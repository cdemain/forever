/* Static Legacy Optimization Plan. Roster and checklist stay in localStorage.
 * No Battle.net login in this copy.
 */
(function () {
  "use strict";
  var KEY = "wow-forever-duo-plan-v2";
  var CLASSES = ["hunter","druid","mage","paladin","priest","warrior","rogue","shaman","warlock"];
  var CLASS_NAME = {hunter:"Hunter",druid:"Druid",mage:"Mage",paladin:"Paladin",priest:"Priest",warrior:"Warrior",rogue:"Rogue",shaman:"Shaman",warlock:"Warlock"};
  var CRAFTS = ["Alchemy","Blacksmithing","Enchanting","Engineering","Leatherworking","Tailoring"];
  var GATHERS = ["Herbalism","Mining","Skinning"];
  var PROFS = CRAFTS.concat(GATHERS);
  var RACES = [
    {id:"human",name:"Human",faction:"alliance",zone:"Elwynn Forest",classes:["warrior","hunter","rogue","priest","mage","warlock","paladin"]},
    {id:"dwarf",name:"Dwarf",faction:"alliance",zone:"Dun Morogh",classes:["warrior","hunter","rogue","priest","paladin","shaman"]},
    {id:"night-elf",name:"Night Elf",faction:"alliance",zone:"Teldrassil",classes:["warrior","hunter","rogue","priest","druid"]},
    {id:"gnome",name:"Gnome",faction:"alliance",zone:"Dun Morogh",classes:["warrior","mage","rogue","priest","warlock"]},
    {id:"skyborne-a",name:"Skyborne",faction:"alliance",zone:"Zephras Isle",classes:["warrior","hunter","mage","rogue","druid"],pack:true},
    {id:"orc",name:"Orc",faction:"horde",zone:"Durotar",classes:["warrior","hunter","mage","rogue","warlock","shaman"]},
    {id:"undead",name:"Undead",faction:"horde",zone:"Tirisfal Glades",classes:["warrior","mage","rogue","priest","warlock","paladin"]},
    {id:"tauren",name:"Tauren",faction:"horde",zone:"Mulgore",classes:["warrior","hunter","druid","shaman"]},
    {id:"troll",name:"Troll",faction:"horde",zone:"Durotar",classes:["warrior","hunter","mage","rogue","priest","warlock","shaman"]},
    {id:"skyborne-h",name:"Skyborne",faction:"horde",zone:"Zephras Isle",classes:["warrior","hunter","rogue","druid","shaman"],pack:true}
  ];
  var state = load(localStorage.getItem(KEY));
  var note = "";
  var draft = null;
  var importText = "";

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) { return "&#" + ch.charCodeAt(0) + ";"; });
  }
  function label(key) { return CLASS_NAME[key] || key; }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function load(raw) {
    var base = {mode:"solo",playstyle:"hunter",faction:"both",partner:{classKey:"mage",gathering:["Herbalism"],faction:""},characters:[],checks:{},pairPicks:{}};
    if (!raw) return base;
    try {
      var parsed = JSON.parse(raw);
      if (parsed.kind === "duo-legacy-partner") {
        base.mode = "duo";
        base.partner = cleanPartner(parsed);
        return base;
      }
      base.mode = parsed.mode === "duo" ? "duo" : "solo";
      base.playstyle = CLASS_NAME[parsed.playstyle] ? parsed.playstyle : "hunter";
      base.faction = parsed.faction === "alliance" || parsed.faction === "horde" ? parsed.faction : "both";
      base.partner = cleanPartner(parsed.partner || {});
      base.characters = Array.isArray(parsed.characters) ? parsed.characters.map(cleanChar).filter(Boolean) : [];
      base.checks = parsed.checks && typeof parsed.checks === "object" ? parsed.checks : {};
      base.pairPicks = parsed.pairPicks && typeof parsed.pairPicks === "object" ? parsed.pairPicks : {};
      return base;
    } catch (err) { return base; }
  }
  function cleanPartner(raw) {
    raw = raw || {};
    return {
      classKey: CLASS_NAME[raw.classKey] ? raw.classKey : "mage",
      gathering: Array.isArray(raw.gathering) ? raw.gathering.filter(function (name) { return GATHERS.indexOf(name) !== -1; }).slice(0, 2) : [],
      faction: raw.faction === "alliance" || raw.faction === "horde" ? raw.faction : ""
    };
  }
  function cleanChar(raw) {
    if (!raw || !CLASS_NAME[raw.classKey]) return null;
    var profs = [0, 1].map(function (index) {
      var slot = raw.profs && raw.profs[index] ? raw.profs[index] : {};
      return {name: PROFS.indexOf(slot.name) !== -1 ? slot.name : "", skill: Math.max(0, Math.min(300, Number(slot.skill) || 0))};
    });
    return {
      id: raw.id || ("c-" + Math.random().toString(36).slice(2, 8)),
      name: String(raw.name || "").slice(0, 24),
      classKey: raw.classKey,
      raceId: RACES.some(function (race) { return race.id === raw.raceId; }) ? raw.raceId : "",
      level: Math.max(1, Math.min(60, Number(raw.level) || 1)),
      faction: raw.faction === "horde" ? "horde" : "alliance",
      role: raw.role === "main" ? "main" : "alt",
      owner: raw.owner === "partner" ? "partner" : "me",
      profs: profs,
      rested: raw.rested === "rested" || raw.rested === "spent" ? raw.rested : "unknown",
      source: raw.source === "battlenet" ? "battlenet" : "manual",
      realm: String(raw.realm || "").slice(0, 40)
    };
  }
  function racesFor(faction, classKey, zone) {
    return RACES.filter(function (race) {
      return race.faction === faction && race.classes.indexOf(classKey) !== -1 && (zone === undefined || race.zone === zone);
    });
  }
  function startFor(faction, classA, classB) {
    var zones = [];
    RACES.forEach(function (race) { if (race.faction === faction && zones.indexOf(race.zone) === -1) zones.push(race.zone); });
    var options = [];
    zones.forEach(function (zone) {
      var a = racesFor(faction, classA, zone);
      var b = classB ? racesFor(faction, classB, zone) : a;
      if (!a.length || !b.length) return;
      var you = a[0], partner = classB ? b[0] : null, different = false;
      if (classB) {
        a.forEach(function (left) {
          b.forEach(function (right) {
            if (!different && left.id !== right.id) { you = left; partner = right; different = true; }
          });
        });
      } else {
        you = a.filter(function (race) { return !race.pack; })[0] || a[0];
      }
      options.push({faction:faction, zone:zone, you:you, partner:partner, different:different, pack:Boolean((you && you.pack) || (partner && partner.pack))});
    });
    options.sort(function (left, right) {
      if (left.different !== right.different) return left.different ? -1 : 1;
      if (left.pack !== right.pack) return left.pack ? 1 : -1;
      return left.zone.localeCompare(right.zone);
    });
    return options[0] || null;
  }
  var PAIRS = {
    hunter: [["Skinning","Leatherworking","Leather and mail armor for a hunter."],["Skinning","Enchanting","Skinning, plus disenchanting while you level."]],
    druid: [["Skinning","Leatherworking","Leather armor for a druid."],["Herbalism","Alchemy","Potions, if someone else is already making leather armor."]],
    rogue: [["Skinning","Leatherworking","Leather armor for a rogue."]],
    shaman: [["Skinning","Leatherworking","Leatherworking makes the mail a shaman wears."],["Mining","Blacksmithing","Blacksmithing also makes mail."],["Mining","Engineering","Same ore, if you would rather take Engineering than Blacksmithing."]],
    mage: [["Tailoring","Enchanting","Bags, cloth armor, and disenchanting."],["Herbalism","Alchemy","Potions, if someone else is already tailoring."]],
    priest: [["Tailoring","Enchanting","Cloth armor and disenchanting."],["Herbalism","Alchemy","Potions, if someone else is already tailoring."]],
    warlock: [["Tailoring","Enchanting","Cloth armor and disenchanting."],["Herbalism","Alchemy","Potions, if someone else is already tailoring."]],
    paladin: [["Mining","Blacksmithing","Plate and mail armor for a paladin."],["Mining","Engineering","Same ore, if you would rather take Engineering than Blacksmithing."]],
    warrior: [["Mining","Blacksmithing","Plate armor for a warrior."],["Mining","Engineering","Same ore, if you would rather take Engineering than Blacksmithing."],["Skinning","Leatherworking","Leather armor while leveling, before plate is the main set."]]
  };
  var DELAYED = {priest:1, warrior:1};
  function isCraft(name) { return CRAFTS.indexOf(name) !== -1; }
  function isGather(name) { return GATHERS.indexOf(name) !== -1; }
  function pairScore(pair, covered, used) {
    var fresh = 0;
    pair.slice(0, 2).forEach(function (name) { if (isCraft(name) && !covered[name]) fresh += 1; });
    var gather = pair.slice(0, 2).filter(isGather)[0];
    return fresh * 10 - (gather && used[gather] ? 6 : 0);
  }
  function chosenPair(pickKey, covered, used) {
    var classKey = pickKey.split(":").pop();
    var options = PAIRS[classKey] || [["Mining","Blacksmithing","Ore for plate and mail."]];
    var pick = state.pairPicks && state.pairPicks[pickKey];
    var found = options.filter(function (pair) { return pair[0] + "|" + pair[1] === pick; })[0];
    if (found) return found;
    return options.reduce(function (best, pair) { return pairScore(pair, covered, used) > pairScore(best, covered, used) ? pair : best; });
  }
  function suggest(owner, classKey, faction, blocked) {
    var covered = {};
    var used = {};
    blocked.forEach(function (name) { used[name] = 1; });
    var seats = [];
    var order = ["paladin","mage","druid","hunter","rogue","shaman","warlock","priest","warrior"].filter(function (key) { return key !== classKey; });
    function add(role, key) {
      var pair = chosenPair(owner + ":" + key, covered, used);
      pair.slice(0, 2).forEach(function (name) {
        if (isCraft(name)) covered[name] = 1;
        if (isGather(name)) used[name] = 1;
      });
      seats.push({owner:owner, role:role, classKey:key, profs:pair.slice(0, 2), options:PAIRS[key] || [pair], why:(DELAYED[key] ? "Save this class for later, when you are more familiar with the game. " : "") + pair[2]});
    }
    add("main", classKey);
    while (seats.length < 4 && Object.keys(covered).length < CRAFTS.length) {
      var bestKey = "";
      var bestScore = 0;
      order.forEach(function (key) {
        if (seats.some(function (seat) { return seat.classKey === key; })) return;
        var score = pairScore(chosenPair(owner + ":" + key, covered, used), covered, used);
        if (score > bestScore) { bestScore = score; bestKey = key; }
      });
      if (!bestKey) break;
      add("alt", bestKey);
    }
    return seats;
  }
  function plan() {
    var factions = state.faction === "both" ? ["alliance","horde"] : [state.faction];
    var partnerClass = state.mode === "duo" ? state.partner.classKey : null;
    var starts = factions.map(function (faction) { return startFor(faction, state.playstyle, partnerClass); }).filter(Boolean);
    var faction = starts[0] ? starts[0].faction : "alliance";
    var me = suggest("me", state.playstyle, faction, []);
    var myGather = me[0].profs.filter(function (name) { return GATHERS.indexOf(name) !== -1; })[0] || "";
    var partner = state.mode === "duo" ? suggest("partner", state.partner.classKey, state.partner.faction || faction, myGather ? [myGather] : []) : [];
    return {starts:starts, me:me, partner:partner};
  }
  function coverage(list) {
    var crafts = CRAFTS.map(function (name) {
      return {name:name, holders:list.filter(function (item) { return item.profs.indexOf(name) !== -1; }).map(function (item) { return label(item.classKey); })};
    });
    var unique = [];
    list.forEach(function (item) { if (unique.indexOf(item.classKey) === -1) unique.push(item.classKey); });
    var covered = crafts.filter(function (craft) { return craft.holders.length; }).length;
    return {crafts:crafts, total:unique.length + covered, covered:covered, classes:unique.length};
  }
  function advice(built) {
    var lines = [];
    var mine = state.characters.filter(function (character) { return character.owner === "me"; });
    var spent = mine.filter(function (character) { return character.rested === "spent"; });
    var rested = mine.filter(function (character) { return character.rested === "rested"; });
    if (spent.length && rested.length) lines.push("Leave " + spent.map(function (character) { return character.name || label(character.classKey); }).join(", ") + " logged out in an inn and play the rested character.");
    else if (mine.length) lines.push("Log out in an inn on the character you are not playing. Rested experience does not build if you log out at the door.");
    else lines.push("Add characters after you create them. Until then, this is a suggested set for the class you picked.");
    if (state.mode === "duo") {
      var mineG = (mine.filter(function (character) { return character.role === "main"; })[0] || {profs:built.me[0].profs.map(function (name) { return {name:name}; })}).profs.map(function (slot) { return slot.name; });
      var theirG = state.partner.gathering.slice();
      GATHERS.forEach(function (name) {
        if (mineG.indexOf(name) !== -1 && theirG.indexOf(name) !== -1) lines.push("Both main characters have " + name + ". Split that while you play together. The same herb, ore vein, or animal does not pay twice.");
      });
    }
    var factions = {};
    state.characters.forEach(function (character) { factions[character.faction] = 1; });
    if (state.partner.faction) factions[state.partner.faction] = 1;
    if (Object.keys(factions).length > 1) lines.push("These characters are not all the same faction. Mail does not cross factions in Forever, and you cannot group across factions.");
    return lines;
  }

  function options(keys, current) {
    return keys.map(function (key) {
      var id = typeof key === "string" ? key : key.id;
      var text = typeof key === "string" ? (CLASS_NAME[key] || key) : key.label;
      return '<option value="' + esc(id) + '"' + (id === current ? " selected" : "") + ">" + esc(text) + "</option>";
    }).join("");
  }
  function radio(group, value, choices) {
    return '<fieldset class="choice"><legend>' + esc(group) + '</legend><div class="choice-row">' + choices.map(function (choice) {
      var on = value === choice.id;
      return '<button type="button" class="choice-opt' + (on ? " is-on" : "") + '" data-set="' + esc(group) + '" data-value="' + esc(choice.id) + '">' + esc(choice.label) + "</button>";
    }).join("") + "</div></fieldset>";
  }

  var PHASES = [
    {id:"p1", kicker:"Phase 1", title:"Get characters, trainers, and bags", blurb:"No dungeon yet.", items:[
      {id:"roll", text:"Create your characters on one realm. In a duo, both accounts use that realm and the same faction.", detail:"Mail does not cross factions or realms."},
      {id:"train", text:"Learn the professions shown in the plan.", detail:"The starting towns usually have the first profession trainers."},
      {id:"bags", text:"Make or buy bags and mail a set to each character.", detail:"This is why Tailoring comes first. A 6-slot bag lets you quest longer before you have to sell."},
      {id:"alts", text:"Create extra characters, even if you only log them in to learn a profession.", detail:"Log them out in an inn when you are not playing them."},
      {id:"inn", text:"Log out inside an inn on every character you are not playing.", detail:"Rested experience only builds while you are logged out in an inn or a city."}
    ]},
    {id:"p2", kicker:"Phase 2", title:"First dungeons, up to about level 20", blurb:"Quest until the first dungeon is a normal next step, then run it. Keep mailing materials.", items:[
      {id:"quest", text:"Quest your main characters to the first dungeon. Do not rush.", detail:"If a fight feels too hard, quest a bit more before you go in."},
      {id:"dungeon", text:"Run the early dungeon for your faction.", detail:"Horde often starts in Ragefire Chasm, then Wailing Caverns. Alliance often uses the Deadmines."},
      {id:"mail", text:"After each session, mail herbs, ore, leather, and extra gear.", detail:"Extra gear goes to the enchanter. Materials go to the crafter."},
      {id:"toward150", text:"Raise each crafting profession you already have toward 150.", detail:"150 is the first Legacy Point for that profession. Gathering skill does not give a point."},
      {id:"rested-swap", text:"When rested experience runs out, switch to another character.", detail:"The characters you are not playing should be logged out in an inn."}
    ]},
    {id:"p3", kicker:"Phase 3", title:"Shadowfang Keep and Blackfathom Deeps to 25", blurb:"This is the first large batch of Legacy Points.", items:[
      {id:"sfk-bfd", text:"Run Shadowfang Keep, then Blackfathom Deeps, when the quests send you there.", detail:"Both factions use these."},
      {id:"level25", text:"Get the main characters to about level 20–25.", detail:"Level 25 on a class is one Legacy Point. A second character of the same class does not give that point again."},
      {id:"skill150", text:"Reach 150 on each crafting profession this plan covers.", detail:"Five professions is a normal result here. Engineering usually comes later."},
      {id:"spend", text:"Spend points on Working Overtime, then Well Rested.", detail:"Five ranks of each. Put Working Overtime on characters raising a profession, and Well Rested on the character you are leveling."}
    ]},
    {id:"later", kicker:"Later", title:"After you have about 20–25 Legacy Points", blurb:"Save the classes you are less comfortable with for later, when you are more familiar with the game.", items:[
      {id:"engineering", text:"Add Engineering so all six crafting professions are on the account.", detail:"A common way is to keep Mining and replace Blacksmithing with Engineering after Blacksmithing reaches 150."},
      {id:"push225", text:"Take the professions you already have to 225, then to 300.", detail:"Each of those skill levels is another point. Six professions at all three levels is 18 points."},
      {id:"priest", text:"Add a priest when you want a healer and you are already comfortable in groups."},
      {id:"warrior", text:"Add a warrior after the other classes you are less comfortable with.", detail:"Give that character bags, food, and spare gear first."},
      {id:"rest-classes", text:"Level any class you have not played yet. The points are at 25, then 45, then 60.", detail:"That includes rogue, shaman, warlock, and any starting class you skipped. You do not need them to begin."}
    ]}
  ];
  var SKILL = {Alchemy:171, Blacksmithing:164, Enchanting:333, Engineering:202, Leatherworking:165, Tailoring:197, Herbalism:182, Mining:186, Skinning:393};

  function doneCount() {
    return PHASES.reduce(function (n, phase) {
      return n + phase.items.filter(function (item) { return state.checks[item.id]; }).length;
    }, 0);
  }
  function wh(name) {
    return '<a class="ext" href="https://www.wowhead.com/forever/skill=' + SKILL[name] + '" target="_blank" rel="noopener noreferrer">' + esc(name) + '</a>';
  }
  function currentPhase() {
    var top = 0;
    state.characters.forEach(function (character) { if (character.owner === "me") top = Math.max(top, character.level); });
    if (!state.characters.length || top < 10) return "p1";
    if (top < 20) return "p2";
    if (top < 26) return "p3";
    return "later";
  }
  function tail(board, saved) {
    var phaseId = currentPhase();
    var phaseTitle = (PHASES.filter(function (phase) { return phase.id === phaseId; })[0] || PHASES[0]).title;
    var phases = PHASES.map(function (phase) {
      var phaseDone = phase.items.filter(function (item) { return state.checks[item.id]; }).length;
      var pct = Math.round((phaseDone / phase.items.length) * 100);
      return '<article class="phase' + (phase.id === phaseId ? " is-current" : "") + '"><header class="phase-head"><div><p class="kicker">' + esc(phase.kicker) + '</p><h3>' + esc(phase.title) + '</h3><p>' + esc(phase.blurb) + '</p></div><p class="tabular phase-count">' + phaseDone + '/' + phase.items.length + '</p></header><div class="meter" role="meter" aria-label="' + esc(phase.title) + '" aria-valuemin="0" aria-valuemax="' + phase.items.length + '" aria-valuenow="' + phaseDone + '"><span style="width:' + pct + '%"></span></div><ul class="checks">' +
        phase.items.map(function (item) {
          var on = !!state.checks[item.id];
          return '<li><button type="button" class="check" data-check="' + item.id + '" aria-pressed="' + on + '"><span class="check-box" aria-hidden="true"></span><span><span class="check-text">' + esc(item.text) + '</span>' + (item.detail ? '<span class="check-detail">' + esc(item.detail) + '</span>' : '') + '</span></button></li>';
        }).join("") + '</ul></article>';
    }).join("");
    var summary = [
      "WoW Forever Legacy Optimization Plan",
      "Mode: " + (state.mode === "duo" ? "Duo, separate accounts" : "Solo"),
      "Preferred class: " + label(state.playstyle),
      "Faction filter: " + state.faction,
      saved.length ? "Saved characters" : "Suggested characters (not saved)",
      "Suggested phase: " + phaseTitle
    ].join("\n");
    return '<section id="points" class="block"><h2>Points, spending, and the mailbox</h2><div class="mech-grid"><article class="panel"><h3>Where a point comes from</h3><table><thead><tr><th>Source</th><th>When</th><th>Points</th></tr></thead><tbody><tr><td>Class level</td><td>25, 45, and 60, once per class on that account</td><td class="tabular">1 each</td></tr><tr><td>Crafting profession</td><td>150, 225, and 300 on each of the six crafts</td><td class="tabular">1 each</td></tr><tr><td>Gathering, cooking, fishing, first aid</td><td>Any skill</td><td class="tabular">0</td></tr></tbody></table><p class="panel-foot"><a class="ext" href="https://www.wowhead.com/forever/guide/legacy-system-overview-rewards" target="_blank" rel="noopener noreferrer">Full challenge list</a></p></article><article class="panel"><h3>What to buy first</h3><ol class="spend"><li><span class="spend-rank">5</span><div><p class="spend-name">Working Overtime</p><p>On anyone raising a profession. Each rank adds 4% chance to gain a skill point.</p></div></li><li><span class="spend-rank">5</span><div><p class="spend-name">Well Rested</p><p>On anyone you are leveling. You still log out in an inn.</p></div></li><li><span class="spend-rank dim">6</span><div><p class="spend-name">Leave these</p><p>Launch cap is 16 spent points per character. Save the last six.</p></div></li></ol><p class="panel-foot"><a class="ext" href="https://www.wowhead.com/forever/legacy-calculator" target="_blank" rel="noopener noreferrer">Legacy calculator</a></p></article></div><div class="split"><article class="panel"><h3>Rested rotation</h3><ol class="plain-list"><li>Finish a session in a town.</li><li>Log out inside the inn.</li><li>Next session, play whoever is rested, or whoever has a craft ready to skill.</li><li>Mark rested or spent on the character so the advice can tell you who to park.</li></ol><p class="panel-foot"><a class="ext" href="https://www.wowhead.com/forever/guide/camping-overview-unlock-rewards" target="_blank" rel="noopener noreferrer">Camping overview</a></p></article><article class="panel"><h3>Mailbox</h3><ul class="routes"><li><span>Herbs</span><span>Gatherer to alchemist</span></li><li><span>Ore</span><span>Miner to blacksmith, later engineer</span></li><li><span>Leather</span><span>Skinner to leatherworker</span></li><li><span>Greens</span><span>To the enchanter. Do not vendor them.</span></li><li><span>Across accounts</span><span>Same faction only.</span></li></ul><p class="panel-foot"><a class="ext" href="https://www.wowhead.com/forever/news/skinning-no-longer-group-wide-in-latest-wow-forever-beta-build-383226" target="_blank" rel="noopener noreferrer">One skin per corpse</a></p></article></div></section>' +
      '<section id="phases" class="block"><div class="section-head"><h2>Phase tracker</h2><button type="button" class="text-btn" data-action="clear">Clear checks</button></div><p class="section-lead">Check these off as you go. From your highest saved level, the current step is ' + esc(phaseTitle) + '.</p><div class="phases">' + phases + '</div></section>' +
      '<section id="summary" class="block"><div class="section-head"><h2>Copy this</h2><div class="summary-actions"><button type="button" class="btn" data-action="copy">Copy summary</button><button type="button" class="btn btn-quiet" data-action="print">Print</button></div></div><pre class="summary-pre" id="summary-text">' + esc(summary) + '</pre></section>';
  }

  function markup() {
    var built = plan();
    var saved = state.characters.filter(function (character) { return character.owner === "me"; });
    var scored = saved.length ? saved.map(function (character) { return {classKey:character.classKey, profs:character.profs.map(function (slot) { return slot.name; }).filter(Boolean)}; }) : built.me;
    var board = coverage(scored);
    var lines = advice(built);
    var starts = built.starts.map(function (start) {
      return '<article class="panel"><p class="kicker">' + esc(start.faction) + '</p><h3>Start in ' + esc(start.zone) + '</h3><p>You: ' + esc(start.you.name) + ' ' + esc(label(state.playstyle)) + '.' +
        (start.partner ? ' Partner: ' + esc(start.partner.name) + ' ' + esc(label(state.partner.classKey)) + '.' : '') +
        (start.different ? ' Different races, same first zone.' : ' Same race is how these classes share a start.') +
        (start.pack ? ' Skyborne needs the heroic pack.' : '') + '</p></article>';
    }).join("");
    var suggest = built.me.concat(state.mode === "duo" ? built.partner : []).map(function (item, index) {
      var buttons = item.options && item.options.length > 1
        ? '<div class="choice-row">' + item.options.map(function (pair) {
            var id = pair[0] + "|" + pair[1];
            var on = item.profs.join("|") === id;
            return '<button type="button" class="choice-opt' + (on ? " is-on" : "") + '" data-pair="' + esc(item.owner + ":" + item.classKey) + '" data-pick="' + esc(id) + '">' + esc(pair[0] + " + " + pair[1]) + "</button>";
          }).join("") + "</div>"
        : '<span class="check-detail">' + esc(item.profs.join(" + ")) + "</span>";
      return '<li><div><strong>' + esc(item.owner === "me" ? "You" : "Partner") + " · " + esc(item.role) + " · " + esc(label(item.classKey)) + '</strong><span class="check-detail">' + esc(item.why) + "</span>" + buttons + '</div><button type="button" class="text-btn" data-save-suggest="' + index + '">Save</button></li>';
    }).join("");
    var rows = state.characters.map(function (character) {
      return '<li><div><strong>' + esc(character.name || label(character.classKey)) + '</strong><span> ' + esc(label(character.classKey)) + ' · ' + character.level + ' · ' + esc(character.faction) + ' · ' + (character.owner === "me" ? "You" : "Partner") + (character.source === "battlenet" ? " · Battle.net" : "") + '</span><span class="check-detail">' + esc(character.profs.filter(function (slot) { return slot.name; }).map(function (slot) { return slot.name + " " + slot.skill; }).join(" · ") || "No professions") + '</span></div><div><button type="button" class="text-btn" data-edit="' + esc(character.id) + '">Edit</button><button type="button" class="text-btn" data-remove="' + esc(character.id) + '">Remove</button></div></li>';
    }).join("");
    var form = "";
    if (draft) {
      var races = RACES.filter(function (race) { return race.faction === draft.faction && race.classes.indexOf(draft.classKey) !== -1; });
      form = '<form class="panel character-form" data-form="1"><h3>' + (draft.name ? "Edit" : "New character") + '</h3><div class="setup-grid">' +
        '<label class="field">Name<input name="name" value="' + esc(draft.name) + '"></label>' +
        '<label class="field">Class<select name="classKey">' + options(CLASSES, draft.classKey) + '</select></label>' +
        '<label class="field">Level<input name="level" type="number" min="1" max="60" value="' + draft.level + '"></label>' +
        '<label class="field">Faction<select name="faction"><option value="alliance"' + (draft.faction === "alliance" ? " selected" : "") + '>Alliance</option><option value="horde"' + (draft.faction === "horde" ? " selected" : "") + '>Horde</option></select></label>' +
        '<label class="field">Race<select name="raceId"><option value="">Unset</option>' + races.map(function (race) { return '<option value="' + race.id + '"' + (draft.raceId === race.id ? " selected" : "") + '>' + esc(race.name) + '</option>'; }).join("") + '</select></label>' +
        '<label class="field">Role<select name="role"><option value="main"' + (draft.role === "main" ? " selected" : "") + '>Main</option><option value="alt"' + (draft.role === "alt" ? " selected" : "") + '>Alt</option></select></label>' +
        (state.mode === "duo" ? '<label class="field">Whose<select name="owner"><option value="me"' + (draft.owner === "me" ? " selected" : "") + '>Mine</option><option value="partner"' + (draft.owner === "partner" ? " selected" : "") + '>Partner</option></select></label>' : '') +
        '<label class="field">Rested<select name="rested"><option value="unknown">Unknown</option><option value="rested"' + (draft.rested === "rested" ? " selected" : "") + '>Rested</option><option value="spent"' + (draft.rested === "spent" ? " selected" : "") + '>Spent</option></select></label>' +
        draft.profs.map(function (slot, index) {
          return '<label class="field">Profession ' + (index + 1) + '<span class="prof-slot"><select name="prof' + index + '"><option value="">None</option>' + PROFS.map(function (name) { return '<option' + (slot.name === name ? " selected" : "") + '>' + name + '</option>'; }).join("") + '</select><input name="skill' + index + '" type="number" min="0" max="300" value="' + slot.skill + '"></span></label>';
        }).join("") +
        '</div><div class="summary-actions"><button class="btn" type="submit">Save character</button><button class="btn btn-quiet" type="button" data-action="cancel">Cancel</button></div></form>';
    }
    return '<div class="page"><header class="topbar"><div class="topbar-inner"><a class="brand" href="#top"><span class="brand-mark"></span>Legacy Optimization Plan</a><nav class="nav"><a href="#overview">Overview</a><a href="#roster">Roster</a><a href="#points">Points</a><a href="#phases">Phases</a><a href="#summary">Summary</a></nav><p class="topbar-progress tabular"><span class="topbar-count">' + doneCount() + '</span><span class="topbar-of"> / ' + PHASES.reduce(function (n, phase) { return n + phase.items.length; }, 0) + ' steps</span></p></div></header><main id="top"><section class="hero"><p class="kicker">World of Warcraft: Forever</p><h1>Legacy Optimization Plan</h1><p class="lede">Earn Legacy Points from professions and class levels, on classes you already like. Save the classes you are less comfortable with for later, when you are more familiar with the game.</p><dl class="stats"><div><dt>Profession points</dt><dd class="tabular">18</dd></div><div><dt>Crafting professions</dt><dd class="tabular">6</dd></div><div><dt>Spend cap at launch</dt><dd class="tabular">16</dd></div><div><dt>Class milestones</dt><dd class="tabular">25 / 45 / 60</dd></div></dl></section>' +
      '<section id="overview" class="block"><h2>How this plan works</h2><div class="steps"><article><p class="step-no">01</p><h3>Start with a class you like</h3><p>Pick the class you will actually play. The suggestion below follows that choice.</p></article><article><p class="step-no">02</p><h3>Learn the six crafting professions</h3><p>Alchemy, Blacksmithing, Enchanting, Engineering, Leatherworking, and Tailoring each give a point at skill 150, 225, and 300. Herbalism, Mining, and Skinning do not.</p></article><article><p class="step-no">03</p><h3>Do not gather the same thing</h3><p>Stay the same faction if you want to mail items or play together. Give the two characters you play at the same time different gathering skills.</p></article></div><p class="note">The profession plan follows Ceedsy’s comfort-first alt army: start on a class you like, cover the crafting professions on your characters, and save the classes you are less comfortable with for later. <a class="ext" href="https://youtu.be/rAcXmhon5Oo" target="_blank" rel="noopener noreferrer">Ceedsy’s video</a> Launch is November 4, 2026. <a class="ext" href="https://news.blizzard.com/en-us/article/24301508/pre-purchase-world-of-warcraft-forever-upgrades-and-begin-your-next-journey-in-azeroth" target="_blank" rel="noopener noreferrer">Launch notes</a></p></section>' +
      '<section id="roster" class="block"><div class="section-head"><h2>Your plan</h2><button type="button" class="text-btn" data-action="reset">Reset</button></div>' +
      '<p class="section-lead">Choose a class. The suggestion updates when you change it. Add characters after you create them so the plan can use their levels.</p><div class="setup-grid">' +
      radio("mode", state.mode, [{id:"solo",label:"Just me"},{id:"duo",label:"I play with a duo partner"}]) +
      radio("faction", state.faction, [{id:"both",label:"Show both"},{id:"alliance",label:"Alliance"},{id:"horde",label:"Horde"}]) +
      '<label class="field">What’s your preferred playstyle / class?<select data-playstyle="1">' + options(CLASSES, state.playstyle) + '</select></label></div>' +
      (state.mode === "duo" ? '<div class="setup-grid"><label class="field">Partner’s class<select data-partner-class="1">' + options(CLASSES, state.partner.classKey) + '</select></label>' +
        '<fieldset class="choice"><legend>Partner’s gathering</legend><div class="choice-row">' + GATHERS.map(function (name) {
          var on = state.partner.gathering.indexOf(name) !== -1;
          return '<button type="button" class="choice-opt' + (on ? " is-on" : "") + '" data-gather="' + name + '">' + name + "</button>";
        }).join("") + '</div></fieldset>' +
        radio("pfaction", state.partner.faction || "same", [{id:"same",label:"Same as the plan"},{id:"alliance",label:"Alliance"},{id:"horde",label:"Horde"}]) + '</div>' : '') +
      '<div class="starts">' + (starts || '<p class="card-note">Those classes do not share a starting zone on that faction.</p>') + '</div>' +
      '<div class="advice">' + lines.map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("") + '</div>' +
      '<h3>Suggestion</h3><ul class="roster-list">' + suggest + '</ul>' +
      '<div class="section-head"><h2>Characters</h2><button type="button" class="text-btn" data-action="add">Add character</button></div>' +
      (rows ? '<ul class="roster-list">' + rows + '</ul>' : '<p class="section-lead">Add characters as you create them. Until then, this list is a suggestion.</p>') +
      form +
      '<div class="board"><div class="board-head"><h3>' + (saved.length ? "Your saved coverage" : "Suggested coverage") + '</h3><p class="tabular board-total">' + board.total + '<span> early points</span></p></div>' +
      '<ul class="craft-grid">' + board.crafts.map(function (craft) { return '<li class="craft' + (craft.holders.length ? " is-on" : "") + '"><span>' + wh(craft.name) + '</span><span class="craft-who">' + esc(craft.holders.join(", ") || "Not covered") + '</span></li>'; }).join("") + '</ul><ul class="gather-row">' + GATHERS.map(function (name) {
        var holders = scored.filter(function (item) { return item.profs.indexOf(name) !== -1; }).map(function (item) { return item.name || label(item.classKey); });
        return '<li><span>' + wh(name) + '</span><span>' + esc(holders.filter(Boolean).join(", ") || "Nobody") + '</span></li>';
      }).join("") + '</ul></div>' +
      '<div class="summary-actions"><button type="button" class="btn" data-action="partner">Copy partner card</button><button type="button" class="btn btn-quiet" data-action="backup">Copy JSON</button></div>' +
      '<label class="field">Import JSON<textarea data-import="1">' + esc(importText) + '</textarea></label><button type="button" class="btn" data-action="import">Import</button>' +
      (note ? '<p class="card-note">' + esc(note) + '</p>' : '') +
      '</section>' +
      tail(board, saved) +
      '</main><footer class="foot"><div class="foot-inner"><p class="kicker">Sources</p><h2>Further reading</h2><ul class="sources">' +
      '<li><a class="ext" href="https://www.wowhead.com/forever/guide/legacy-system-overview-rewards" target="_blank" rel="noopener noreferrer">Legacy system overview</a><span>Wowhead Forever</span></li>' +
      '<li><a class="ext" href="https://www.wowhead.com/forever/news/how-do-legacy-points-work-in-wow-forever-383029" target="_blank" rel="noopener noreferrer">How Legacy Points work</a><span>Wowhead news</span></li>' +
      '<li><a class="ext" href="https://www.wowhead.com/forever/legacy-calculator" target="_blank" rel="noopener noreferrer">Legacy calculator</a><span>Wowhead Forever</span></li>' +
      '<li><a class="ext" href="https://worldofwarcraft.blizzard.com/en-us/forever" target="_blank" rel="noopener noreferrer">World of Warcraft: Forever</a><span>Blizzard</span></li>' +
      '</ul><p class="legal">Fan planning aid. Not affiliated with Blizzard Entertainment.</p></div></footer></div>';
  }

  function render() {
    var y = window.scrollY;
    var focus = document.activeElement && document.activeElement.getAttribute && (document.activeElement.getAttribute("data-import"));
    document.getElementById("app").innerHTML = markup();
    if (!focus) window.scrollTo(0, y);
  }

  function readForm(form) {
    var data = new FormData(form);
    draft.name = String(data.get("name") || "");
    draft.classKey = String(data.get("classKey") || draft.classKey);
    draft.level = Number(data.get("level")) || 1;
    draft.faction = data.get("faction") === "horde" ? "horde" : "alliance";
    draft.raceId = String(data.get("raceId") || "");
    draft.role = data.get("role") === "main" ? "main" : "alt";
    draft.owner = data.get("owner") === "partner" ? "partner" : "me";
    draft.rested = data.get("rested") === "rested" || data.get("rested") === "spent" ? data.get("rested") : "unknown";
    draft.profs = [0, 1].map(function (index) {
      return {name: String(data.get("prof" + index) || ""), skill: Number(data.get("skill" + index)) || 0};
    });
  }

  document.getElementById("app").addEventListener("click", function (event) {
    var set = event.target.closest("[data-set]");
    if (set) {
      var group = set.getAttribute("data-set");
      var value = set.getAttribute("data-value");
      if (group === "mode") state.mode = value;
      if (group === "faction") state.faction = value;
      if (group === "pfaction") state.partner.faction = value === "same" ? "" : value;
      save(); render(); return;
    }
    var gather = event.target.closest("[data-gather]");
    if (gather) {
      var name = gather.getAttribute("data-gather");
      var has = state.partner.gathering.indexOf(name) !== -1;
      state.partner.gathering = has ? state.partner.gathering.filter(function (item) { return item !== name; }) : state.partner.gathering.concat(name).slice(0, 2);
      save(); render(); return;
    }
    var action = event.target.closest("[data-action]");
    if (action) {
      var kind = action.getAttribute("data-action");
      if (kind === "reset") { var checks = state.checks; state = load(null); state.checks = checks; save(); render(); }
      if (kind === "add") { draft = cleanChar({classKey:state.playstyle, role: state.characters.some(function (character) { return character.owner === "me" && character.role === "main"; }) ? "alt" : "main", faction: state.faction === "horde" ? "horde" : "alliance"}); render(); }
      if (kind === "cancel") { draft = null; render(); }
      if (kind === "partner") {
        var card = {kind:"duo-legacy-partner", classKey:state.playstyle, mainClass:state.playstyle, gathering: plan().me[0].profs.filter(function (name) { return GATHERS.indexOf(name) !== -1; }), faction: state.faction === "both" ? "" : state.faction};
        importText = JSON.stringify(card);
        navigator.clipboard && navigator.clipboard.writeText(importText);
        note = "Partner card copied. Class, gathering, and faction only.";
        render();
      }
      if (kind === "backup") {
        importText = JSON.stringify({kind:"duo-legacy-plan", mode:state.mode, playstyle:state.playstyle, faction:state.faction, partner:state.partner, characters:state.characters, checks:state.checks, pairPicks:state.pairPicks});
        navigator.clipboard && navigator.clipboard.writeText(importText);
        note = "Backup copied.";
        render();
      }
      if (kind === "import") {
        try { state = load(importText); save(); note = "Imported."; }
        catch (err) { note = "That text is not valid JSON."; }
        render();
      }
      if (kind === "clear") { state.checks = {}; save(); render(); }
      if (kind === "copy") {
        var node = document.getElementById("summary-text");
        var text = node ? node.textContent : "";
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        note = "Summary copied.";
        render();
      }
      if (kind === "print") window.print();
      return;
    }
    var check = event.target.closest("[data-check]");
    if (check) {
      var id = check.getAttribute("data-check");
      state.checks[id] = !state.checks[id];
      save();
      render();
      return;
    }
    var pairBtn = event.target.closest("[data-pair]");
    if (pairBtn) {
      state.pairPicks[pairBtn.getAttribute("data-pair")] = pairBtn.getAttribute("data-pick");
      save();
      render();
      return;
    }
    var saveSuggest = event.target.closest("[data-save-suggest]");
    if (saveSuggest) {
      var built = plan();
      var all = built.me.concat(state.mode === "duo" ? built.partner : []);
      var item = all[Number(saveSuggest.getAttribute("data-save-suggest"))];
      if (item) {
        state.characters.push(cleanChar({classKey:item.classKey, role:item.role, owner:item.owner, faction: state.faction === "horde" ? "horde" : "alliance", profs:item.profs.map(function (name) { return {name:name, skill:0}; })}));
        save(); render();
      }
      return;
    }
    var edit = event.target.closest("[data-edit]");
    if (edit) { draft = state.characters.filter(function (character) { return character.id === edit.getAttribute("data-edit"); })[0]; render(); }
    var remove = event.target.closest("[data-remove]");
    if (remove) { state.characters = state.characters.filter(function (character) { return character.id !== remove.getAttribute("data-remove"); }); save(); render(); }
  });
  document.getElementById("app").addEventListener("change", function (event) {
    if (event.target.matches("[data-playstyle]")) { state.playstyle = event.target.value; save(); render(); }
    if (event.target.matches("[data-partner-class]")) { state.partner.classKey = event.target.value; save(); render(); }
    if (event.target.matches("[data-import]")) importText = event.target.value;
  });
  document.getElementById("app").addEventListener("submit", function (event) {
    if (!event.target.matches("[data-form]")) return;
    event.preventDefault();
    readForm(event.target);
    var next = cleanChar(draft);
    var exists = state.characters.some(function (character) { return character.id === next.id; });
    state.characters = exists ? state.characters.map(function (character) { return character.id === next.id ? next : character; }) : state.characters.concat(next);
    draft = null; save(); render();
  });

  render();
})();
