/* Duo Legacy Plan — static GitHub Pages build. */
(function () {
  "use strict";

  var STORAGE_KEY = "wow-forever-duo-plan-v1";

  var LINKS = {
    legacy: "https://www.wowhead.com/forever/guide/legacy-system-overview-rewards",
    calculator: "https://www.wowhead.com/forever/legacy-calculator",
    pointsNews: "https://www.wowhead.com/forever/news/how-do-legacy-points-work-in-wow-forever-383029",
    explained: "https://www.wowhead.com/forever/news/warcraft-forever-legacy-system-explained-382842",
    professions: "https://www.wowhead.com/forever/guides/professions",
    camping: "https://www.wowhead.com/forever/guide/camping-overview-unlock-rewards",
    skinningChange:
      "https://www.wowhead.com/forever/news/skinning-no-longer-group-wide-in-latest-wow-forever-beta-build-383226",
    blizzard: "https://worldofwarcraft.blizzard.com/en-us/forever",
    blizzardNews:
      "https://news.blizzard.com/en-us/article/24301508/pre-purchase-world-of-warcraft-forever-upgrades-and-begin-your-next-journey-in-azeroth",
    hunter: "https://www.wowhead.com/forever/guide/classes/hunter/marksmanship/level-30-dps-overview",
    mage: "https://www.wowhead.com/forever/guide/classes/mage/fire/level-30-dps-overview",
    priest: "https://www.wowhead.com/forever/guide/classes/priest/holy/level-30-healer-overview",
    shaman: "https://www.wowhead.com/forever/guide/classes/shaman/enhancement/overview-pve-dps",
    alchemy: "https://www.wowhead.com/forever/guide/professions/alchemy-overview-trainer-locations-recipes",
    tailoring: "https://www.wowhead.com/forever/guide/professions/tailoring-overview-trainer-locations-recipes",
    herbalism: "https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling",
  };

  var CRAFTS = ["Alchemy", "Blacksmithing", "Enchanting", "Engineering", "Leatherworking", "Tailoring"];
  var GATHERS = ["Herbalism", "Mining", "Skinning"];

  var PROF_INFO = {
    Alchemy: { skillId: 171, guide: LINKS.alchemy, tip: "Potions and elixirs. Counts toward Legacy Points at 150, 225, and 300. Pair it with mailed herbs." },
    Blacksmithing: { skillId: 164, tip: "Mail and plate, plus weapon stones. Counts toward Legacy Points. Spare greens go to the enchanter." },
    Enchanting: { skillId: 333, tip: "Disenchant mailed greens into dust and essences. Counts toward Legacy Points. Do not vendor those greens." },
    Engineering: { skillId: 202, tip: "Goggles, gadgets, and ammunition-style toys. Counts toward Legacy Points. It is the craft this roster cannot fit until something else moves." },
    Leatherworking: { skillId: 165, tip: "Leather and mail armor for the hunter or druid. Counts toward Legacy Points. Mail spare pieces to be disenchanted." },
    Tailoring: { skillId: 197, guide: LINKS.tailoring, tip: "Train this first on the caster. Bags are the bottleneck for a fresh duo, and cloth drops off mobs you are already killing." },
    Herbalism: { skillId: 182, guide: LINKS.herbalism, tip: "Feeds Alchemy. Does not award Legacy Points. Mail herbs; do not let them sit on the gatherer." },
    Mining: { skillId: 186, tip: "Feeds Blacksmithing and, later, Engineering. Does not award Legacy Points." },
    Skinning: { skillId: 393, tip: "Feeds Leatherworking. Does not award Legacy Points. A corpse can be skinned once, so a second skinner does not double the leather." },
  };

  var P1_PROFS = {
    "skin-lw": { label: "Skinning + Leatherworking", profs: ["Skinning", "Leatherworking"], note: "Default. Leather and mail for the comfort class, and greens for the enchanter." },
    "mine-bs": { label: "Mining + Blacksmithing", profs: ["Mining", "Blacksmithing"], note: "Take this only if you would rather smith than work leather. Check the coverage board so two people are not both smiths." },
  };
  var P2_PROFS = {
    "tailor-herb": { label: "Tailoring + Herbalism", profs: ["Tailoring", "Herbalism"], note: "Default. Bags immediately, and an herb pipeline for the alchemy alt." },
    "alch-ench": { label: "Alchemy + Enchanting", profs: ["Alchemy", "Enchanting"], note: "Consumables and disenchanting on the caster. Nobody else in the default roster makes bags, so switch this only if you accept buying bags." },
  };
  var PAL_PROFS = {
    "mine-bs": { label: "Mining + Blacksmithing", profs: ["Mining", "Blacksmithing"], note: "Default. Ore for plate and mail, and extra greens to disenchant." },
    "mine-eng": { label: "Mining + Engineering", profs: ["Mining", "Engineering"], note: "Closes the Engineering gap and drops Blacksmithing. Do this at the start, or after Blacksmithing has already reached 150." },
  };
  var ALT_PROFS = {
    "alch-ench": { label: "Alchemy + Enchanting", profs: ["Alchemy", "Enchanting"], note: "Default. Uses mailed herbs and turns spare greens into enchanting materials." },
    "alch-eng": { label: "Alchemy + Engineering", profs: ["Alchemy", "Engineering"], note: "Picks up Engineering. Enchanting has to live on someone else, or greens get vendored." },
    "ench-eng": { label: "Enchanting + Engineering", profs: ["Enchanting", "Engineering"], note: "Picks up Engineering. Alchemy has to live on Player 2, or the herbs have nowhere to go." },
  };

  var CLASS_INFO = {
    hunter: { name: "Hunter", id: 3, guide: LINKS.hunter, blurb: "Pet does the dangerous work. You stand back and shoot. Strong default if you want an easy pull and leather or mail." },
    druid: { name: "Druid", id: 11, blurb: "Travel form, a bear when a pull goes wrong, and heals if a dungeon needs them. One character covers a lot of holes." },
    mage: { name: "Mage", id: 8, guide: LINKS.mage, blurb: "Ranged caster with food, water, and later portals. Best default if the second player wants to cast and not manage a pet." },
    paladin: { name: "Paladin", id: 2, blurb: "Plate, a bubble, and auras. Can heal or tank a dungeon without being the main character of the duo. Comfortable early, unlike a warrior." },
    priest: { name: "Priest", id: 5, guide: LINKS.priest, blurb: "Excellent healer and a real caster. Wait. Learn dungeons on classes you already like, then add a priest when a group role is the fun part." },
    warrior: { name: "Warrior", id: 1, blurb: "Strong later, grindy at the start. Delay until you have gold, bags, food, and the habit of logging out in an inn." },
  };

  var PHASES = [
    {
      id: "p1", kicker: "Phase 1", title: "Establish the supply chain", blurb: "Characters, trainers, bags, and a mailbox habit. No dungeon yet.",
      items: [
        { id: "roll", text: "Roll Player 1 and Player 2 on the same realm and faction.", detail: "Shared alts have to mail you. Different realms cannot." },
        { id: "train", text: "Train the profession pairs shown on the roster.", detail: "Starter towns usually have the apprentice trainers. Ask a guard if the map is empty." },
        { id: "bags", text: "Make or buy the first bags and mail a set to each character.", detail: "Tailoring is why this is early. Six-slot bags change how long you can quest." },
        { id: "alts", text: "Create the paladin and the second alt, even if they only log in to train.", detail: "They can sit at level 1 inside an inn and still be your profession benches." },
        { id: "inn", text: "Log every character you are not playing out inside an inn.", detail: "Rested experience only builds while logged out in an inn or a capital." },
      ],
    },
    {
      id: "p2", kicker: "Phase 2", title: "Dungeon gauntlet to about 20–21", blurb: "Quest until the first dungeon, then run it. Keep mailing.",
      items: [
        { id: "quest", text: "Quest the two mains to the first dungeon bracket. Do not rush.", detail: "If a pull feels bad, it is too soon. Comfort is the point of this roster." },
        { id: "dungeon", text: "Run the early dungeon your faction actually uses.", detail: "Horde often starts in Ragefire Chasm, then Wailing Caverns. Alliance often uses the Deadmines. Both are enough to set up the 20s." },
        { id: "mail", text: "After each session, mail herbs, ore, leather, and spare greens.", detail: "Greens go to the enchanter. Materials go to the crafter. Coins stay on the character who needs skills." },
        { id: "toward150", text: "Push each crafting profession you already have toward 150.", detail: "150 is the first Legacy Point for that craft. Gathering skill does not score." },
        { id: "rested-swap", text: "Swap who is online when rested experience runs out.", detail: "The parked characters should be gaining rested experience while you play the other one." },
      ],
    },
    {
      id: "p3", kicker: "Phase 3", title: "Shadowfang Keep and Blackfathom Deeps to 25", blurb: "This is the first real Legacy Point spike.",
      items: [
        { id: "sfk-bfd", text: "Run Shadowfang Keep, then Blackfathom Deeps, as the levels open up.", detail: "Both factions use these. Go in when the quests send you, not the moment the entrance turns gray." },
        { id: "level25", text: "Get the core characters to level 20–25.", detail: "Level 25 on a class is one Legacy Point. A second character of that same class does not grant it again." },
        { id: "skill150", text: "Hit 150 on every crafting profession this roster covers.", detail: "Five crafts is a normal result here. Engineering usually joins on the next wave." },
        { id: "spend", text: "Spend into Working Overtime, then Well Rested.", detail: "Five ranks each. Put profession speed on crafters and rested speed on whoever is leveling." },
      ],
    },
    {
      id: "later", kicker: "Later", title: "After about 20–25 Legacy Points", blurb: "Only once dungeons feel ordinary. Not before.",
      items: [
        { id: "engineering", text: "Close Engineering so all six crafts are on the account.", detail: "Cleanest swap: the paladin drops Blacksmithing for Engineering after the smithing point at 150, and keeps Mining." },
        { id: "push225", text: "Take covered crafts to 225, then to 300.", detail: "Each of those thresholds is another point per craft. Six crafts at all three marks is 18 points." },
        { id: "priest", text: "Add a priest when you want a healer you already trust in groups." },
        { id: "warrior", text: "Add a warrior last of the delayed pair.", detail: "Feed it bags, food, and spare gear from the crafters. Do not level it hungry." },
        { id: "rest-classes", text: "Level any class you still have not played, at the same 25, then 45, then 60 marks.", detail: "Rogue, shaman, warlock, and whichever starter class you skipped. None of these are required to begin." },
      ],
    },
  ];

  var ALL_CHECK_IDS = PHASES.reduce(function (ids, phase) {
    phase.items.forEach(function (item) { ids.push(item.id); });
    return ids;
  }, []);

  var DEFAULT_STATE = {
    p1Class: "hunter", p1Prof: "skin-lw",
    p2Class: "mage", p2Prof: "tailor-herb",
    altClass: "druid", altProf: "alch-ench",
    palProf: "mine-bs", checks: {},
  };

  var state = loadState(localStorage.getItem(STORAGE_KEY));
  var open = { p1: true };
  var copied = false;
  var openTip = "";

  function classHref(id) { return "https://www.wowhead.com/forever/class=" + id; }
  function skillHref(id) { return "https://www.wowhead.com/forever/skill=" + id; }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return "&#" + ch.charCodeAt(0) + ";";
    });
  }

  function icon(name) {
    var paths = {
      check: '<polyline points="20 6 9 17 4 12"/>',
      chevron: '<polyline points="6 9 12 15 18 9"/>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
      reset: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + "</svg>";
  }

  function ext(href, label) {
    return '<a class="ext" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
      esc(label) + icon("external") + '<span class="sr-only"> (opens in a new tab)</span></a>';
  }

  function tip(id, text) {
    var shown = openTip === id;
    return '<span class="tip">' +
      '<button type="button" class="tip-btn" data-tip="' + esc(id) + '" aria-expanded="' + shown + '" aria-label="Short explanation">' +
      icon("info") + "</button>" +
      '<span class="tip-bubble' + (shown ? " is-open" : "") + '" role="tooltip">' + esc(text) + "</span></span>";
  }

  function profName(name, id) {
    var info = PROF_INFO[name];
    var href = info.guide || skillHref(info.skillId);
    return '<span class="name-with-tip">' + ext(href, name) + tip(id, info.tip) + "</span>";
  }

  function className(key) {
    var info = CLASS_INFO[key];
    var html = '<span class="name-with-tip">' + ext(classHref(info.id), info.name);
    if (info.guide) html += ext(info.guide, "Guide");
    return html + "</span>";
  }

  function choice(group, label, value, options) {
    var buttons = options.map(function (option) {
      var on = value === option.id;
      return '<button type="button" role="radio" aria-checked="' + on + '" class="choice-opt' + (on ? " is-on" : "") +
        '" data-choice="' + esc(group) + '" data-value="' + esc(option.id) + '">' + esc(option.label) + "</button>";
    }).join("");
    return '<fieldset class="choice"><legend>' + esc(label) + '</legend><div class="choice-row" role="radiogroup">' + buttons + "</div></fieldset>";
  }

  function loadState(raw) {
    if (!raw) return Object.assign({}, DEFAULT_STATE, { checks: {} });
    try {
      var parsed = JSON.parse(raw);
      var checks = {};
      if (parsed.checks && typeof parsed.checks === "object") {
        ALL_CHECK_IDS.forEach(function (id) {
          if (parsed.checks[id] === true) checks[id] = true;
        });
      }
      return {
        p1Class: parsed.p1Class === "druid" ? "druid" : "hunter",
        p2Class: parsed.p2Class === "hunter" ? "hunter" : "mage",
        altClass: parsed.altClass === "hunter" || parsed.altClass === "mage" ? parsed.altClass : "druid",
        p1Prof: parsed.p1Prof === "mine-bs" ? "mine-bs" : "skin-lw",
        p2Prof: parsed.p2Prof === "alch-ench" ? "alch-ench" : "tailor-herb",
        palProf: parsed.palProf === "mine-eng" ? "mine-eng" : "mine-bs",
        altProf: parsed.altProf === "alch-eng" || parsed.altProf === "ench-eng" ? parsed.altProf : "alch-ench",
        checks: checks,
      };
    } catch (err) {
      return Object.assign({}, DEFAULT_STATE, { checks: {} });
    }
  }

  function analyze(current) {
    var seats = [
      { who: "Player 1", classKey: current.p1Class, profs: P1_PROFS[current.p1Prof].profs },
      { who: "Player 2", classKey: current.p2Class, profs: P2_PROFS[current.p2Prof].profs },
      { who: "Paladin alt", classKey: "paladin", profs: PAL_PROFS[current.palProf].profs },
      { who: "Second alt", classKey: current.altClass, profs: ALT_PROFS[current.altProf].profs },
    ].map(function (seat) {
      return { who: seat.who, classKey: seat.classKey, className: CLASS_INFO[seat.classKey].name, profs: seat.profs };
    });
    function holdersOf(name) {
      return seats.filter(function (seat) { return seat.profs.indexOf(name) !== -1; }).map(function (seat) { return seat.who; });
    }
    var crafts = CRAFTS.map(function (name) { return { name: name, holders: holdersOf(name) }; });
    var gathering = GATHERS.map(function (name) { return { name: name, holders: holdersOf(name) }; });
    var counts = {};
    seats.forEach(function (seat) { counts[seat.className] = (counts[seat.className] || 0) + 1; });
    var uniqueClasses = Object.keys(counts);
    var duplicateClasses = uniqueClasses.filter(function (name) { return counts[name] > 1; });
    var warnings = [];
    if (duplicateClasses.length) {
      warnings.push(duplicateClasses.join(" and ") + " is on more than one character. Level 25, 45, and 60 points are once per class, not once per character. The extra character is still useful for professions.");
    }
    var missing = crafts.filter(function (craft) { return !craft.holders.length; }).map(function (craft) { return craft.name; });
    if (missing.indexOf("Engineering") !== -1 && missing.length === 1) {
      warnings.push("Engineering is the open craft. That is expected at the start: four characters hold eight professions, and six crafts plus herbalism, mining, and skinning is nine. Switch the paladin from Blacksmithing to Engineering when you want the sixth craft.");
    } else if (missing.length) {
      warnings.push("Not covering " + missing.join(", ") + ". The 18 profession points need all six crafts at 150, 225, and 300. Change a pair above, or plan the swap before you pass skill 150.");
    }
    crafts.forEach(function (craft) {
      if (craft.holders.length > 1) {
        warnings.push(craft.name + " is on " + craft.holders.join(" and ") + ". Only one of them can earn the profession points. Free the duplicate slot.");
      }
    });
    if (holdersOf("Skinning").length > 1) {
      warnings.push("Two skinners do not double leather. A corpse can be skinned once. Keep Skinning on one character.");
    }
    if (!holdersOf("Tailoring").length) {
      warnings.push("Nobody is tailoring. You will buy bags instead of making them. Put Tailoring back on Player 2 if bag space starts to hurt.");
    }
    if (!holdersOf("Enchanting").length) {
      warnings.push("Nobody can disenchant. Spare greens should be mailed, not vendored, once an enchanter exists.");
    }
    var classPointsAt25 = uniqueClasses.length;
    var profPointsAt150 = crafts.filter(function (craft) { return craft.holders.length; }).length;
    return {
      seats: seats, crafts: crafts, craftsCovered: profPointsAt150, gathering: gathering,
      classPointsAt25: classPointsAt25, profPointsAt150: profPointsAt150,
      earlyTotal: classPointsAt25 + profPointsAt150, warnings: warnings,
    };
  }

  function buildSummary(current) {
    var report = analyze(current);
    var covered = report.crafts.filter(function (craft) { return craft.holders.length; }).map(function (craft) { return craft.name; });
    var missing = report.crafts.filter(function (craft) { return !craft.holders.length; }).map(function (craft) { return craft.name; });
    return [
      "WoW Forever Duo Legacy Plan — Comfort-First Alt Army",
      "",
      "Roster",
    ].concat(report.seats.map(function (seat) {
      return "- " + seat.who + ": " + seat.className + " — " + seat.profs.join(" + ");
    })).concat([
      "",
      "Crafts covered (" + report.craftsCovered + " of 6): " + (covered.join(", ") || "none"),
      "Still open: " + (missing.join(", ") || "none"),
      "",
      "If every unique class here hits 25 and every covered craft hits 150: " + report.earlyTotal + " Legacy Points (" + report.classPointsAt25 + " class + " + report.profPointsAt150 + " profession).",
      "A repeated class does not add another level point.",
      "",
      "Spend",
      "- Working Overtime, 5 ranks, on characters raising professions.",
      "- Well Rested, 5 ranks, on characters you are leveling.",
      "- Launch cap is 16 points spent per character. Leave the rest until you know what you lack.",
      "",
      "Habits",
      "- Log out in an inn.",
      "- Mail herbs, ore, leather, and greens. Disenchant on the enchanter.",
      "- Priest, then warrior, after about 20–25 Legacy Points and after dungeons feel ordinary.",
      "",
      "Sources: Wowhead Forever Legacy guide, Wowhead Legacy calculator, Blizzard launch notes.",
    ]).join("\n");
  }

  function seatCard(id, index, title, classKey, profs, role, body) {
    var info = CLASS_INFO[classKey];
    var isOpen = !!open[id];
    return '<article class="seat" id="' + id + '">' +
      '<button type="button" class="fold-toggle" data-fold="' + id + '" aria-expanded="' + isOpen + '">' +
      "<span><span class=\"seat-index\">" + esc(index) + "</span>" +
      '<span class="seat-title">' + esc(title) + "</span>" +
      '<span class="seat-class">' + esc(info.name) + " · " + esc(profs.join(" + ")) + "</span></span>" +
      '<span class="chev' + (isOpen ? " is-open" : "") + '">' + icon("chevron") + "</span></button>" +
      '<div class="fold-body' + (isOpen ? "" : " is-shut") + '">' +
      '<p class="role">' + esc(role) + "</p>" +
      '<p class="class-blurb">' + className(classKey) + ". " + esc(info.blurb) + "</p>" +
      body +
      '<p class="prof-links">' + profs.map(function (name) { return profName(name, id + "-" + name); }).join("") + "</p>" +
      "</div></article>";
  }

  function markup() {
    var report = analyze(state);
    var summary = buildSummary(state);
    var done = ALL_CHECK_IDS.filter(function (id) { return state.checks[id]; }).length;
    var p1 = P1_PROFS[state.p1Prof];
    var p2 = P2_PROFS[state.p2Prof];
    var pal = PAL_PROFS[state.palProf];
    var alt = ALT_PROFS[state.altProf];

    var cards = [
      seatCard("p1", "01", "Player 1", state.p1Class, p1.profs,
        "Your main. Early comfort, leather or mail, and greens for disenchanting.",
        choice("p1Class", "Class", state.p1Class, [{ id: "hunter", label: "Hunter" }, { id: "druid", label: "Druid" }]) +
        choice("p1Prof", "Professions", state.p1Prof, [{ id: "skin-lw", label: "Skinning + Leatherworking" }, { id: "mine-bs", label: "Mining + Blacksmithing" }]) +
        '<p class="card-note">' + esc(p1.note) + "</p>"),
      seatCard("p2", "02", "Player 2", state.p2Class, p2.profs,
        "Your partner. Ranged damage, bags, and the herb route. A caster is the default. A hunter is fine. A warlock is not required.",
        choice("p2Class", "Class", state.p2Class, [{ id: "mage", label: "Mage" }, { id: "hunter", label: "Hunter" }]) +
        choice("p2Prof", "Professions", state.p2Prof, [{ id: "tailor-herb", label: "Tailoring + Herbalism" }, { id: "alch-ench", label: "Alchemy + Enchanting" }]) +
        '<p class="card-note">' + esc(p2.note) + "</p>"),
      seatCard("pal", "03", "Shared alt", "paladin", pal.profs,
        "Ore supply and mailed plate or mail. Can heal or tank a dungeon if you need a third body.",
        '<p class="card-note">Paladin stays. It is the comfortable plate class. Warrior comes later.</p>' +
        choice("palProf", "Professions", state.palProf, [{ id: "mine-bs", label: "Mining + Blacksmithing" }, { id: "mine-eng", label: "Mining + Engineering" }]) +
        '<p class="card-note">' + esc(pal.note) + "</p>"),
      seatCard("alt", "04", "Second alt", state.altClass, alt.profs,
        "Finishes the crafting list. Another hunter or druid is fine if that is what you will actually log into.",
        choice("altClass", "Class", state.altClass, [{ id: "druid", label: "Druid" }, { id: "hunter", label: "Hunter" }, { id: "mage", label: "Mage" }]) +
        choice("altProf", "Professions", state.altProf, [
          { id: "alch-ench", label: "Alchemy + Enchanting" },
          { id: "alch-eng", label: "Alchemy + Engineering" },
          { id: "ench-eng", label: "Enchanting + Engineering" },
        ]) +
        '<p class="card-note">' + esc(alt.note) + "</p>"),
    ].join("");

    var craftItems = report.crafts.map(function (craft) {
      return '<li class="craft' + (craft.holders.length ? " is-on" : "") + '">' +
        profName(craft.name, "board-" + craft.name) +
        '<span class="craft-who">' + esc(craft.holders.length ? craft.holders.join(", ") : "Not covered") + "</span></li>";
    }).join("");
    var gatherItems = report.gathering.map(function (node) {
      return "<li>" + profName(node.name, "gather-" + node.name) +
        "<span>" + esc(node.holders.length ? node.holders.join(", ") : "Nobody") + "</span></li>";
    }).join("");
    var warningItems = report.warnings.map(function (warning) {
      return "<li>" + esc(warning) + "</li>";
    }).join("");

    var laterOpen = !!open.later;
    var phases = PHASES.map(function (phase) {
      var phaseDone = phase.items.filter(function (item) { return state.checks[item.id]; }).length;
      var pct = Math.round((phaseDone / phase.items.length) * 100);
      var items = phase.items.map(function (item) {
        var checked = !!state.checks[item.id];
        return "<li><button type=\"button\" role=\"checkbox\" class=\"check\" aria-checked=\"" + checked + "\" data-check=\"" + esc(item.id) + "\">" +
          '<span class="check-box" aria-hidden="true">' + icon("check") + "</span><span>" +
          '<span class="check-text">' + esc(item.text) + "</span>" +
          (item.detail ? '<span class="check-detail">' + esc(item.detail) + "</span>" : "") +
          "</span></button></li>";
      }).join("");
      return '<article class="phase"><header class="phase-head"><div><p class="kicker">' + esc(phase.kicker) +
        "</p><h3>" + esc(phase.title) + "</h3><p>" + esc(phase.blurb) + "</p></div>" +
        '<p class="tabular phase-count">' + phaseDone + "/" + phase.items.length + "</p></header>" +
        '<div class="meter" role="meter" aria-label="' + esc(phase.title) + ' progress" aria-valuemin="0" aria-valuemax="' +
        phase.items.length + '" aria-valuenow="' + phaseDone + '"><span style="width:' + pct + '%"></span></div>' +
        '<ul class="checks">' + items + "</ul></article>";
    }).join("");

    return '<div class="page"><a class="skip" href="#overview">Skip to the plan</a>' +
      '<header class="topbar"><div class="topbar-inner"><a class="brand" href="#top"><span class="brand-mark" aria-hidden="true"></span>Duo Legacy Plan</a>' +
      '<p class="topbar-progress tabular"><span class="topbar-count">' + done + '</span><span class="topbar-of"> / ' + ALL_CHECK_IDS.length + " steps</span></p>" +
      '<nav class="nav" aria-label="On this page"><a href="#overview">Overview</a><a href="#roster">Roster</a><a href="#points">Points</a><a href="#phases">Phases</a><a href="#summary">Summary</a></nav></div></header>' +
      '<main id="top"><section class="hero"><p class="kicker">World of Warcraft: Forever</p><h1>Duo Legacy Plan</h1>' +
      '<p class="hero-sub">Comfort-first alt army</p>' +
      '<p class="lede">Earn Legacy Points early from professions and class milestones, and stay on classes you already like. One of you plays a comfortable melee-or-pet class. The other plays a ranged caster. Two shared alts hold the crafts the mains do not. Priest and warrior wait until the game feels ordinary.</p>' +
      '<dl class="stats"><div><dt>Profession points</dt><dd class="tabular">18</dd></div><div><dt>Crafting professions</dt><dd class="tabular">6</dd></div><div><dt>Spend cap at launch</dt><dd class="tabular">16</dd></div><div><dt>Class milestones</dt><dd class="tabular">25 / 45 / 60</dd></div></dl></section>' +
      '<section id="overview" class="block"><h2>How this plan works</h2><div class="steps">' +
      '<article><p class="step-no">01</p><h3>Start comfortable</h3><p>Hunter or druid for you. Mage, or a second hunter, for your partner. Do not start on a priest or a warrior, and do not talk anyone into a warlock.</p></article>' +
      '<article><p class="step-no">02</p><h3>Cover the six crafts</h3><p>Alchemy, blacksmithing, enchanting, engineering, leatherworking, and tailoring each score at 150, 225, and 300. Gathering does not. That is the 18 profession points.</p></article>' +
      '<article><p class="step-no">03</p><h3>Park people in inns</h3><p>Only one character needs to be online. Everyone else logs out in an inn so rested experience keeps building. Mail herbs, ore, leather, and greens between sessions.</p></article></div>' +
      '<p class="note">Launch is November 4, 2026. If you are in the beta, use it to learn the keys. Treat beta characters as practice unless Blizzard says they carry over. ' + ext(LINKS.blizzardNews, "Launch notes") + "</p></section>" +
      '<section id="roster" class="block"><div class="section-head"><h2>Starting roster</h2>' +
      '<button type="button" class="text-btn" data-action="reset"> ' + icon("reset") + "Recommended setup</button></div>" +
      '<p class="section-lead">Open a card to change the class or the profession pair. The board under the cards updates what you actually cover.</p>' +
      '<div class="cards">' + cards + "</div>" +
      '<div class="board"><div class="board-head"><h3>What this roster scores</h3><p class="tabular board-total">' + report.earlyTotal + "<span> early points</span></p></div>" +
      '<p class="board-math">' + report.classPointsAt25 + " from unique classes at level 25, plus " + report.profPointsAt150 + " from covered crafts at skill 150. Pushing those same crafts to 225 and 300 adds two more points each.</p>" +
      '<ul class="craft-grid">' + craftItems + "</ul><ul class=\"gather-row\">" + gatherItems + "</ul>" +
      (warningItems ? '<ul class="warnings">' + warningItems + "</ul>" : "") + "</div>" +
      '<article class="later-card"><button type="button" class="fold-toggle" data-fold="later" aria-expanded="' + laterOpen + '">' +
      '<span><span class="seat-index">Later</span><span class="seat-title">Priest, then warrior</span></span>' +
      '<span class="chev' + (laterOpen ? " is-open" : "") + '">' + icon("chevron") + "</span></button>" +
      '<div class="fold-body' + (laterOpen ? "" : " is-shut") + '"><p>Add these after the account has about 20–25 Legacy Points and both of you are comfortable in dungeons. They are not bad classes. They are bad places to learn the game.</p>' +
      '<div class="later-pair"><div><h3>' + className("priest") + "</h3><p>" + esc(CLASS_INFO.priest.blurb) + "</p></div>" +
      "<div><h3>" + className("warrior") + "</h3><p>" + esc(CLASS_INFO.warrior.blurb) + "</p></div></div>" +
      "<p>After those two, any class you skipped: rogue, shaman, warlock, or the starter you did not pick. " + ext(LINKS.shaman, "Shaman notes") + " if that one comes up. Warlock stays optional.</p></div></article></section>" +
      '<section id="points" class="block"><h2>Points, spending, and the mailbox</h2><div class="mech-grid">' +
      '<article class="panel"><h3>Where a point comes from ' + tip("sources", "Each listed challenge awards one Legacy Point to the account. Cosmetic rewards at 15, 25, 40, and 55 use points earned, whether or not you have spent them.") + "</h3>" +
      "<table><thead><tr><th scope=\"col\">Source</th><th scope=\"col\">When</th><th scope=\"col\">Points</th></tr></thead><tbody>" +
      "<tr><td>" + ext(classHref(3), "Class level") + "</td><td>25, 45, and 60, once per class</td><td class=\"tabular\">1 each</td></tr>" +
      "<tr><td>" + ext(skillHref(197), "Crafting profession") + "</td><td>150, 225, and 300 on each of the six crafts</td><td class=\"tabular\">1 each</td></tr>" +
      "<tr><td>Gathering, cooking, fishing, first aid</td><td>Any skill</td><td class=\"tabular\">0</td></tr></tbody></table>" +
      '<p class="panel-foot">Dungeons, exploration, raids, and PvP ranks also award points. Use them when they happen. Do not schedule the duo around them. ' + ext(LINKS.legacy, "Full challenge list") + "</p></article>" +
      '<article class="panel"><h3>What to buy first</h3><ol class="spend">' +
      '<li><span class="spend-rank">5</span><div><p class="spend-name">Working Overtime ' + tip("overtime", "Professions tree. Each rank adds 4% chance to gain a skill point when you use a primary, secondary, or class tradeskill. Five ranks is +20%. It does not create extra items.") + "</p><p>On anyone raising a profession. This is why the first crafts reach 150 faster.</p></div></li>" +
      '<li><span class="spend-rank">5</span><div><p class="spend-name">Well Rested ' + tip("rested", "Adventure tree. Each rank makes rested experience build 4% faster and raises the rested cap by 4%. Five ranks is +20%. You still have to log out in an inn.") + "</p><p>On anyone you are leveling. The inn rotation is worth more after this.</p></div></li>" +
      '<li><span class="spend-rank dim">6</span><div><p class="spend-name">Leave these</p><p>The launch cap is 16 spent points per character. Points are earned once for the account, and characters can spend them differently. Save the last six until you feel a specific gap.</p></div></li></ol>' +
      '<p class="panel-foot">Respec is described as a class-trainer option. Confirm the cost in game; it moved during beta. ' + ext(LINKS.calculator, "Legacy calculator") + "</p></article></div>" +
      '<div class="split"><article class="panel"><h3>' + icon("moon") + " Rested rotation</h3><ol class=\"plain-list\">" +
      "<li>Finish a session in a town. Hearth if you have to.</li><li>Log out inside the inn, not at the front door and not in the wild.</li>" +
      "<li>Next session, play whoever has rested experience, or whoever has a craft ready to skill.</li><li>When that rest is gone, park them and wake the next character.</li></ol>" +
      '<p class="panel-foot">Camping tents from leatherworking can also grant a small rested bump. ' + ext(LINKS.camping, "Camping overview") + "</p></article>" +
      '<article class="panel"><h3>Mailbox routes</h3><ul class="routes">' +
      "<li><span>Herbs</span><span>Gatherer → alchemist</span></li><li><span>Ore</span><span>Miner → blacksmith, later engineer</span></li>" +
      "<li><span>Leather</span><span>Skinner → leatherworker</span></li><li><span>Greens</span><span>Everyone → enchanter. Do not vendor them.</span></li>" +
      "<li><span>Bags</span><span>Tailor → whoever is out of space</span></li></ul>" +
      '<p class="panel-foot">Skinning news, if you were both planning to skin the same kills: ' + ext(LINKS.skinningChange, "one skin per corpse") + ".</p></article></div></section>" +
      '<section id="phases" class="block"><div class="section-head"><h2>Phase tracker</h2>' +
      '<button type="button" class="text-btn" data-action="clear"' + (done === 0 ? " disabled" : "") + ">Clear checks</button></div>" +
      '<p class="section-lead">Checks stay in this browser. Work top to bottom. The early goal is level 20–25 and crafting skill 150, not a pile of alts at 60.</p>' +
      '<div class="phases">' + phases + "</div></section>" +
      '<section id="summary" class="block"><div class="section-head"><h2>Copy this</h2><div class="summary-actions">' +
      '<button type="button" class="btn" data-action="copy">' + icon(copied ? "check" : "copy") + (copied ? "Copied" : "Copy summary") + "</button>" +
      '<button type="button" class="btn btn-quiet" data-action="print">' + icon("printer") + "Print</button></div></div>" +
      '<p class="section-lead">The text follows the roster you picked above. Paste it into a note you both can see.</p>' +
      '<pre class="summary-pre" id="summary-text">' + esc(summary) + "</pre></section></main>" +
      '<footer class="foot"><div class="foot-inner"><div><p class="kicker">Sources</p><h2>Further reading</h2>' +
      "<p>Rules on this page follow Wowhead’s Forever coverage and Blizzard’s launch notes. Profession trainers, recipes, and a few perk costs were still moving in beta. If a line here disagrees with the client, trust the client.</p></div>" +
      '<ul class="sources">' +
      "<li>" + ext(LINKS.legacy, "Legacy system overview") + "<span>Wowhead Forever</span></li>" +
      "<li>" + ext(LINKS.pointsNews, "How Legacy Points work") + "<span>Wowhead news</span></li>" +
      "<li>" + ext(LINKS.explained, "Legacy system explained") + "<span>Wowhead news</span></li>" +
      "<li>" + ext(LINKS.calculator, "Legacy calculator") + "<span>Wowhead Forever</span></li>" +
      "<li>" + ext(LINKS.professions, "Profession guides") + "<span>Wowhead Forever</span></li>" +
      "<li>" + ext(LINKS.blizzard, "World of Warcraft: Forever") + "<span>Blizzard</span></li>" +
      "<li>" + ext(LINKS.blizzardNews, "Pre-purchase and launch timing") + "<span>Blizzard News</span></li></ul>" +
      '<p class="legal">' + icon("book") + " Fan planning aid. Not affiliated with Blizzard Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc.</p></div></footer></div>";
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    var y = window.scrollY;
    document.getElementById("app").innerHTML = markup();
    window.scrollTo(0, y);
  }

  document.getElementById("app").addEventListener("click", function (event) {
    var tipBtn = event.target.closest("[data-tip]");
    if (tipBtn) {
      var id = tipBtn.getAttribute("data-tip");
      openTip = openTip === id ? "" : id;
      render();
      return;
    }
    if (!event.target.closest(".tip")) openTip = "";

    var fold = event.target.closest("[data-fold]");
    if (fold) {
      var key = fold.getAttribute("data-fold");
      open[key] = !open[key];
      render();
      return;
    }
    var choiceBtn = event.target.closest("[data-choice]");
    if (choiceBtn) {
      state[choiceBtn.getAttribute("data-choice")] = choiceBtn.getAttribute("data-value");
      persist();
      render();
      return;
    }
    var check = event.target.closest("[data-check]");
    if (check) {
      var checkId = check.getAttribute("data-check");
      state.checks[checkId] = !state.checks[checkId];
      if (!state.checks[checkId]) delete state.checks[checkId];
      persist();
      render();
      return;
    }
    var action = event.target.closest("[data-action]");
    if (!action || action.disabled) return;
    var name = action.getAttribute("data-action");
    if (name === "reset") {
      var checks = state.checks;
      state = Object.assign({}, DEFAULT_STATE, { checks: checks });
      persist();
      render();
    } else if (name === "clear") {
      state.checks = {};
      persist();
      render();
    } else if (name === "print") {
      window.print();
    } else if (name === "copy") {
      var text = buildSummary(state);
      var doneCopy = function () {
        copied = true;
        render();
        window.setTimeout(function () { copied = false; render(); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(doneCopy).catch(function () {
          var node = document.getElementById("summary-text");
          var range = document.createRange();
          range.selectNodeContents(node);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("copy");
          selection.removeAllRanges();
          doneCopy();
        });
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && openTip) {
      openTip = "";
      render();
    }
  });

  render();
})();
