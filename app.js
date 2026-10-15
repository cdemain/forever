const RACE_CLASS_MATRIX = {
  Human: { faction: "Alliance", classes: ["Warrior", "Hunter", "Mage", "Rogue", "Priest", "Warlock", "Paladin"], start: "Elwynn Forest" },
  Dwarf: { faction: "Alliance", classes: ["Warrior", "Hunter", "Rogue", "Priest", "Paladin", "Shaman"], start: "Dun Morogh" },
  "Night Elf": { faction: "Alliance", classes: ["Warrior", "Hunter", "Rogue", "Priest", "Druid"], start: "Teldrassil" },
  Gnome: { faction: "Alliance", classes: ["Warrior", "Mage", "Rogue", "Priest", "Warlock"], start: "Dun Morogh" },
  "Skyborne (High Order)": { faction: "Alliance", classes: ["Warrior", "Hunter", "Mage", "Rogue", "Druid"], start: "Zephras Isle" },
  Orc: { faction: "Horde", classes: ["Warrior", "Hunter", "Mage", "Rogue", "Shaman", "Warlock"], start: "Durotar" },
  Undead: { faction: "Horde", classes: ["Warrior", "Mage", "Paladin", "Priest", "Rogue", "Warlock"], start: "Tirisfal Glades" },
  Tauren: { faction: "Horde", classes: ["Warrior", "Hunter", "Shaman", "Druid"], start: "Mulgore" },
  Troll: { faction: "Horde", classes: ["Warrior", "Hunter", "Mage", "Rogue", "Priest", "Shaman", "Warlock"], start: "Durotar" },
  "Skyborne (Windshaper)": { faction: "Horde", classes: ["Warrior", "Hunter", "Rogue", "Druid", "Shaman"], start: "Zephras Isle" }
};

const CRAFTING_PROFS = ["Alchemy", "Blacksmithing", "Enchanting", "Engineering", "Leatherworking", "Tailoring"];
const GATHERING_PROFS = ["Herbalism", "Mining", "Skinning"];
const ALL_PROFS = [...CRAFTING_PROFS, ...GATHERING_PROFS];

const ROLE_CLASSES = {
  "No Preference": ["Hunter", "Druid", "Paladin", "Warrior", "Mage", "Priest", "Shaman", "Warlock", "Rogue"],
  Tank: ["Warrior", "Paladin", "Druid"],
  "Melee DPS": ["Rogue", "Warrior", "Paladin", "Druid", "Shaman"],
  "Ranged DPS": ["Hunter", "Mage", "Warlock", "Shaman", "Druid"],
  Healing: ["Priest", "Paladin", "Druid", "Shaman"]
};

const PROF_SUGGESTIONS = {
  Hunter: ["Skinning", "Leatherworking"],
  Mage: ["Herbalism", "Tailoring"],
  Warlock: ["Herbalism", "Tailoring"],
  Rogue: ["Skinning", "Leatherworking"],
  Warrior: ["Mining", "Blacksmithing"],
  Paladin: ["Mining", "Blacksmithing"],
  Druid: ["Herbalism", "Alchemy"],
  Priest: ["Herbalism", "Tailoring"],
  Shaman: ["Mining", "Engineering"]
};

const COMPLEMENTARY_ROLES = {
  Tank: ["Ranged DPS", "Healing"],
  "Melee DPS": ["Ranged DPS", "Healing", "Tank"],
  "Ranged DPS": ["Tank", "Healing", "Melee DPS"],
  Healing: ["Tank", "Melee DPS", "Ranged DPS"],
  "No Preference": ["Tank", "Ranged DPS", "Healing"]
};

const STORAGE_KEY = "wowForeverLegacyPlan";

let state = {
  duoMode: false,
  faction: "",
  playstyle: "",
  preferredClass: "",
  characters: [],
  duoPairs: {}
};

let editingIndex = -1;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Could not load saved state", e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getValidClasses(race) {
  return RACE_CLASS_MATRIX[race]?.classes || [];
}

function getStartingArea(race) {
  return RACE_CLASS_MATRIX[race]?.start || "Unknown";
}

function getRacesForFaction(faction) {
  if (!faction || faction === "Both") return Object.keys(RACE_CLASS_MATRIX);
  return Object.keys(RACE_CLASS_MATRIX).filter(r => RACE_CLASS_MATRIX[r].faction === faction);
}

function getGathering(char) {
  return [char.prof1, char.prof2].find(p => GATHERING_PROFS.includes(p)) || "";
}

function updateClassDropdown() {
  const role = document.getElementById("playstyle").value;
  const select = document.getElementById("class-select");
  select.innerHTML = "";
  if (!role || !ROLE_CLASSES[role]) {
    select.disabled = true;
    select.innerHTML = '<option value="">Select a role first</option>';
    return;
  }
  select.disabled = false;
  const classes = ROLE_CLASSES[role];
  select.innerHTML = '<option value="">-- Select class --</option>' +
    classes.map(c => `<option value="${c}">${c}</option>`).join("");
  if (state.preferredClass && classes.includes(state.preferredClass)) {
    select.value = state.preferredClass;
  }
}

function populateRaceDropdown() {
  const select = document.getElementById("char-race");
  const races = getRacesForFaction(state.faction);
  select.innerHTML = races.map(r => `<option value="${r}">${r}</option>`).join("");
  updateCharClassDropdown();
}

function updateCharClassDropdown() {
  const race = document.getElementById("char-race").value;
  const select = document.getElementById("char-class");
  const valid = getValidClasses(race);
  select.innerHTML = valid.map(c => `<option value="${c}">${c}</option>`).join("");
  suggestProfessions();
}

function populateProfDropdowns() {
  const options = '<option value="">None</option>' + ALL_PROFS.map(p => `<option value="${p}">${p}</option>`).join("");
  document.getElementById("char-prof1").innerHTML = options;
  document.getElementById("char-prof2").innerHTML = options;
}

function suggestProfessions() {
  const cls = document.getElementById("char-class").value;
  const suggestions = PROF_SUGGESTIONS[cls] || [];
  const prof1 = document.getElementById("char-prof1");
  const prof2 = document.getElementById("char-prof2");
  if (suggestions[0]) prof1.value = suggestions[0];
  if (suggestions[1]) prof2.value = suggestions[1];
}

function showCharForm(idx = -1) {
  editingIndex = idx;
  const form = document.getElementById("char-form");
  const title = document.getElementById("form-title");
  form.classList.remove("hidden");

  populateRaceDropdown();
  populateProfDropdowns();

  if (idx >= 0) {
    const char = state.characters[idx];
    title.textContent = "Edit Character";
    document.getElementById("char-name").value = char.name || "";
    document.getElementById("char-race").value = char.race || "";
    updateCharClassDropdown();
    document.getElementById("char-class").value = char.class || "";
    document.getElementById("char-level").value = char.level || 1;
    document.getElementById("char-main").checked = (char.role || "").toLowerCase() === "main";
    document.getElementById("char-prof1").value = char.prof1 || "";
    document.getElementById("char-prof1-level").value = char.prof1Level || 0;
    document.getElementById("char-prof2").value = char.prof2 || "";
    document.getElementById("char-prof2-level").value = char.prof2Level || 0;
  } else {
    title.textContent = "Add Character";
    document.getElementById("char-name").value = "";
    document.getElementById("char-level").value = 1;
    document.getElementById("char-main").checked = false;
    document.getElementById("char-prof1").value = "";
    document.getElementById("char-prof1-level").value = 0;
    document.getElementById("char-prof2").value = "";
    document.getElementById("char-prof2-level").value = 0;
    if (state.preferredClass) {
      const raceSelect = document.getElementById("char-race");
      for (const opt of raceSelect.options) {
        if (getValidClasses(opt.value).includes(state.preferredClass)) {
          raceSelect.value = opt.value;
          break;
        }
      }
      updateCharClassDropdown();
      document.getElementById("char-class").value = state.preferredClass;
      suggestProfessions();
    }
  }
}

function hideCharForm() {
  document.getElementById("char-form").classList.add("hidden");
  editingIndex = -1;
}

function getComplementaryRecommendations(char) {
  const myGather = getGathering(char);
  const myStart = getStartingArea(char.race);
  const myFaction = char.faction;
  const complementaryRoles = COMPLEMENTARY_ROLES[state.playstyle] || COMPLEMENTARY_ROLES["No Preference"];

  const suggestions = [];
  const races = getRacesForFaction(myFaction);

  complementaryRoles.forEach(role => {
    const classes = ROLE_CLASSES[role] || [];
    classes.forEach(cls => {
      races.forEach(race => {
        if (!getValidClasses(race).includes(cls)) return;
        if (getStartingArea(race) !== myStart) return;
        const partnerGather = (PROF_SUGGESTIONS[cls] || []).find(p => GATHERING_PROFS.includes(p));
        if (partnerGather && partnerGather === myGather) return;
        suggestions.push({
          role,
          class: cls,
          race,
          start: myStart,
          gathering: partnerGather || "none",
          crafting: (PROF_SUGGESTIONS[cls] || []).find(p => CRAFTING_PROFS.includes(p)) || ""
        });
      });
    });
  });

  return suggestions.slice(0, 4);
}

function renderRoster() {
  const container = document.getElementById("roster");
  if (!container) return;
  container.innerHTML = "";

  if (state.characters.length === 0) {
    container.innerHTML = "<p class='muted'>No characters yet. Add one or select a role above.</p>";
    return;
  }

  state.characters.forEach((char, idx) => {
    const div = document.createElement("div");
    div.className = "char-card";
    const roleLabel = (char.role || "").toLowerCase() === "main" ? "Main" : "";
    div.innerHTML = `
      <strong>${char.name || "Unnamed"}</strong>
      — ${char.race || "?"} ${char.class || "?"} (Lvl ${char.level || 1})
      <span class="badge">${char.faction || "?"}</span>
      <div class="muted small">
        Start: ${getStartingArea(char.race)}<br>
        Profs: ${char.prof1 || "—"} ${char.prof1Level || ""} / ${char.prof2 || "—"} ${char.prof2Level || ""}
        ${roleLabel ? `<br>Role: ${roleLabel}` : ""}
      </div>
      <div class="actions">
        <button data-edit="${idx}">Edit</button>
        <button data-remove="${idx}" class="secondary">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => showCharForm(+btn.dataset.edit);
  });
  container.querySelectorAll("[data-remove]").forEach(btn => {
    btn.onclick = () => {
      if (confirm("Remove this character?")) {
        state.characters.splice(+btn.dataset.remove, 1);
        saveState();
        renderAll();
      }
    };
  });
}

function renderDuoPairs() {
  const container = document.getElementById("duo-pairs");
  if (!container) return;
  if (!state.duoMode || state.characters.length === 0) {
    container.innerHTML = "<p class='muted'>Add characters to set partner halves of each duo set.</p>";
    return;
  }

  let html = "";
  state.characters.forEach((char, idx) => {
    const pair = state.duoPairs[char.name || idx] || {};
    const recs = getComplementaryRecommendations(char);
    const raceOptions = getRacesForFaction(char.faction).map(r => `<option value="${r}" ${pair.race === r ? "selected" : ""}>${r}</option>`).join("");
    const classOptions = (ROLE_CLASSES[pair.role] || ROLE_CLASSES["No Preference"]).map(c => `<option value="${c}" ${pair.class === c ? "selected" : ""}>${c}</option>`).join("");

    html += `
      <div class="char-card">
        <strong>Your ${char.name || "character"} (${char.class})</strong>
        <div class="muted small">Partner half of this set:</div>
        <div class="form-fields">
          <div>
            <label>Partner Name</label>
            <input type="text" data-pair-name="${idx}" value="${pair.name || ""}" placeholder="Partner name">
          </div>
          <div>
            <label>Race</label>
            <select data-pair-race="${idx}">${raceOptions}</select>
          </div>
          <div>
            <label>Class</label>
            <select data-pair-class="${idx}">${classOptions}</select>
          </div>
          <div>
            <label>Gathering</label>
            <select data-pair-gather="${idx}">
              <option value="">None</option>
              ${GATHERING_PROFS.map(g => `<option value="${g}" ${pair.gathering === g ? "selected" : ""}>${g}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="muted small">Suggestions: ${recs.map(r => `${r.race} ${r.class}`).join(", ") || "none"}</div>
      </div>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll("input, select").forEach(el => {
    el.onchange = el.oninput = () => {
      const idx = el.dataset.pairName || el.dataset.pairRace || el.dataset.pairClass || el.dataset.pairGather;
      if (idx === undefined) return;
      const char = state.characters[idx];
      const key = char.name || idx;
      if (!state.duoPairs[key]) state.duoPairs[key] = {};
      if (el.dataset.pairName) state.duoPairs[key].name = el.value;
      if (el.dataset.pairRace) state.duoPairs[key].race = el.value;
      if (el.dataset.pairClass) state.duoPairs[key].class = el.value;
      if (el.dataset.pairGather) state.duoPairs[key].gathering = el.value;
      saveState();
    };
  });
}

function getCoveredCrafting() {
  const covered = new Set();
  state.characters.forEach(c => {
    if (CRAFTING_PROFS.includes(c.prof1)) covered.add(c.prof1);
    if (CRAFTING_PROFS.includes(c.prof2)) covered.add(c.prof2);
  });
  return covered;
}

function getRecommendations() {
  const lines = [];
  const playstyle = state.playstyle || "No Preference";
  lines.push(`<strong>Preferred role:</strong> ${playstyle}`);
  if (state.preferredClass) lines.push(`<strong>Preferred class:</strong> ${state.preferredClass}`);
  if (state.faction) lines.push(`<strong>Faction:</strong> ${state.faction}`);

  if (state.playstyle && ROLE_CLASSES[state.playstyle]) {
    const top = ROLE_CLASSES[state.playstyle].slice(0, 3).join(", ");
    lines.push(`Top recommended classes: ${top}`);
  }

  if (state.preferredClass && PROF_SUGGESTIONS[state.preferredClass]) {
    lines.push(`Suggested professions for ${state.preferredClass}: ${PROF_SUGGESTIONS[state.preferredClass].join(" + ")}`);
  }

  if (state.characters.length > 0) {
    const main = state.characters.find(c => (c.role || "").toLowerCase() === "main") || state.characters[0];
    lines.push(`<strong>Primary character:</strong> ${main.name || "Unnamed"} (${main.race} ${main.class}, lvl ${main.level})`);
    lines.push(`Starting area: ${getStartingArea(main.race)}`);
  }

  if (state.duoMode) {
    lines.push(`<strong>Duo mode:</strong> Set the partner half of each duo set below. Overlap only matters inside a set.`);
  }

  const covered = getCoveredCrafting();
  const missing = CRAFTING_PROFS.filter(p => !covered.has(p));
  lines.push(`<strong>Crafting coverage:</strong> ${covered.size}/6`);
  if (missing.length) {
    lines.push(`Still need: ${missing.join(", ")}`);
    lines.push(`Suggestion: put ${missing[0]} on a later alt.`);
  } else {
    lines.push("All six crafting professions covered.");
  }

  if (state.characters.some(c => c.level >= 20)) {
    lines.push("Character at or above 20. Consider parking in an inn for rested XP and rotating an alt.");
  }

  let priority = "Prioritize your main for Legacy Points, then cover remaining crafting professions on alts.";
  if (state.duoMode) priority += " Pair characters by complementary role and shared starting zone first.";
  lines.push(`<strong>Next priority:</strong> ${priority}`);

  return lines.map(l => `<li>${l}</li>`).join("");
}

function renderRecommendations() {
  const el = document.getElementById("recommendations");
  if (!el) return;
  if (!state.playstyle && state.characters.length === 0) {
    el.innerHTML = "Select a role or add a character to generate recommendations.";
    return;
  }
  el.innerHTML = `<ul>${getRecommendations()}</ul>`;
}

function renderAll() {
  const duoCheck = document.getElementById("duo-mode");
  if (duoCheck) duoCheck.checked = state.duoMode;

  const factionSel = document.getElementById("faction");
  if (factionSel) factionSel.value = state.faction || "";

  const playstyleSel = document.getElementById("playstyle");
  if (playstyleSel) playstyleSel.value = state.playstyle || "";

  updateClassDropdown();
  const classSel = document.getElementById("class-select");
  if (classSel && state.preferredClass) classSel.value = state.preferredClass;

  renderRoster();
  const duoSection = document.getElementById("duo-section");
  if (duoSection) duoSection.classList.toggle("hidden", !state.duoMode);
  renderDuoPairs();
  renderRecommendations();
}

function bindEvents() {
  const duoMode = document.getElementById("duo-mode");
  if (duoMode) duoMode.onchange = e => { state.duoMode = e.target.checked; saveState(); renderAll(); };

  const faction = document.getElementById("faction");
  if (faction) faction.onchange = e => { state.faction = e.target.value; saveState(); renderAll(); };

  const playstyle = document.getElementById("playstyle");
  if (playstyle) playstyle.onchange = e => {
    state.playstyle = e.target.value;
    state.preferredClass = "";
    saveState();
    updateClassDropdown();
    renderRecommendations();
  };

  const classSelect = document.getElementById("class-select");
  if (classSelect) classSelect.onchange = e => {
    state.preferredClass = e.target.value;
    saveState();
    renderRecommendations();
  };

  const addBtn = document.getElementById("add-char");
  if (addBtn) addBtn.onclick = () => showCharForm(-1);

  const saveBtn = document.getElementById("save-char");
  if (saveBtn) saveBtn.onclick = () => {
    const name = document.getElementById("char-name").value.trim();
    const race = document.getElementById("char-race").value;
    const cls = document.getElementById("char-class").value;
    const level = parseInt(document.getElementById("char-level").value, 10) || 1;
    const isMain = document.getElementById("char-main").checked;
    const prof1 = document.getElementById("char-prof1").value;
    const prof1Level = parseInt(document.getElementById("char-prof1-level").value, 10) || 0;
    const prof2 = document.getElementById("char-prof2").value;
    const prof2Level = parseInt(document.getElementById("char-prof2-level").value, 10) || 0;

    if (!name) {
      alert("Please enter a name.");
      return;
    }

    const updated = {
      name,
      race,
      class: cls,
      level,
      faction: RACE_CLASS_MATRIX[race].faction,
      role: isMain ? "Main" : "",
      prof1,
      prof1Level,
      prof2,
      prof2Level
    };

    if (editingIndex >= 0) {
      state.characters[editingIndex] = { ...state.characters[editingIndex], ...updated };
    } else {
      state.characters.push(updated);
    }

    saveState();
    hideCharForm();
    renderAll();
  };

  const cancelBtn = document.getElementById("cancel-char");
  if (cancelBtn) cancelBtn.onclick = hideCharForm;

  const raceSelect = document.getElementById("char-race");
  if (raceSelect) raceSelect.onchange = updateCharClassDropdown;

  const classInForm = document.getElementById("char-class");
  if (classInForm) classInForm.onchange = suggestProfessions;

  const resetBtn = document.getElementById("reset-all");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm("Reset all local data?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = { duoMode: false, faction: "", playstyle: "", preferredClass: "", characters: [], duoPairs: {} };
      hideCharForm();
      renderAll();
    }
  };

  const exportBtn = document.getElementById("export-duo");
  if (exportBtn) exportBtn.onclick = () => {
    const data = {
      myCharacters: state.characters.map(c => ({
        name: c.name,
        race: c.race,
        class: c.class,
        gathering: getGathering(c),
        start: getStartingArea(c.race)
      })),
      duoPairs: state.duoPairs,
      recommendations: state.characters.map(c => ({
        for: c.name || c.class,
        partners: getComplementaryRecommendations(c)
      })),
      faction: state.faction
    };
    const text = JSON.stringify(data, null, 2);
    const out = document.getElementById("export-output");
    if (out) out.value = text;
    navigator.clipboard?.writeText(text);
  };

  const importBtn = document.getElementById("import-duo");
  if (importBtn) importBtn.onclick = () => {
    const input = document.getElementById("import-input");
    if (!input) return;
    try {
      const data = JSON.parse(input.value);
      if (data.duoPairs) state.duoPairs = data.duoPairs;
      else if (data.myCharacters) {
        state.duoPairs = {};
        data.myCharacters.forEach((c, i) => {
          state.duoPairs[c.name || i] = { name: c.name, race: c.race, class: c.class, gathering: c.gathering };
        });
      }
      saveState();
      renderAll();
      alert("Imported partner data.");
    } catch (e) {
      alert("Invalid JSON.");
    }
  };

  const bnetBtn = document.getElementById("connect-bnet");
  if (bnetBtn) bnetBtn.onclick = () => {
    alert("Battle.net OAuth requires a registered Client ID. Follow Blizzard’s official guide and prefer maintained libraries. Implement Authorization Code + PKCE. Store tokens only in localStorage.");
    const status = document.getElementById("bnet-status");
    if (status) status.textContent = "Not connected.";
  };
}

loadState();
bindEvents();
renderAll();
