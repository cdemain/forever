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

const ROLE_CLASSES = {
  Tank: ["Warrior", "Paladin", "Druid"],
  "Melee DPS": ["Rogue", "Warrior", "Paladin", "Druid", "Shaman"],
  "Ranged DPS": ["Hunter", "Mage", "Warlock", "Shaman", "Druid"],
  Healing: ["Priest", "Paladin", "Druid", "Shaman"]
};

const STORAGE_KEY = "wowForeverLegacyPlan";

let state = {
  duoMode: false,
  faction: "",
  playstyle: "",
  preferredClass: "",
  characters: [],
  duoPartner: null
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
}

function showCharForm(idx = -1) {
  editingIndex = idx;
  const form = document.getElementById("char-form");
  const title = document.getElementById("form-title");
  form.classList.remove("hidden");

  populateRaceDropdown();

  if (idx >= 0) {
    const char = state.characters[idx];
    title.textContent = "Edit Character";
    document.getElementById("char-name").value = char.name || "";
    document.getElementById("char-race").value = char.race || "";
    updateCharClassDropdown();
    document.getElementById("char-class").value = char.class || "";
    document.getElementById("char-level").value = char.level || 1;
    document.getElementById("char-role").value = char.role || "Main";
  } else {
    title.textContent = "Add Character";
    document.getElementById("char-name").value = "";
    document.getElementById("char-level").value = 1;
    document.getElementById("char-role").value = "Main";
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
    }
  }
}

function hideCharForm() {
  document.getElementById("char-form").classList.add("hidden");
  editingIndex = -1;
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
    div.innerHTML = `
      <strong>${char.name || "Unnamed"}</strong>
      — ${char.race || "?"} ${char.class || "?"} (Lvl ${char.level || 1})
      <span class="badge">${char.faction || "?"}</span>
      <div class="muted small">
        Start: ${getStartingArea(char.race)}<br>
        Profs: ${char.prof1 || "—"} ${char.prof1Level || ""} / ${char.prof2 || "—"} ${char.prof2Level || ""}
        ${char.role ? `<br>Role: ${char.role}` : ""}
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

function renderDuo() {
  const section = document.getElementById("duo-section");
  if (!section) return;
  section.classList.toggle("hidden", !state.duoMode);
  if (!state.duoMode) return;

  const fields = document.getElementById("duo-partner-fields");
  if (!fields) return;

  const p = state.duoPartner || { class: "", gathering: "" };
  const classes = state.playstyle && ROLE_CLASSES[state.playstyle] ? ROLE_CLASSES[state.playstyle] : Object.values(ROLE_CLASSES).flat();

  fields.innerHTML = `
    <label for="partner-class">Partner preferred class</label>
    <select id="partner-class">
      <option value="">Select</option>
      ${[...new Set(classes)].map(c => `<option value="${c}" ${p.class === c ? "selected" : ""}>${c}</option>`).join("")}
    </select>
    <label for="partner-gather">Partner gathering profession</label>
    <select id="partner-gather">
      <option value="">Select</option>
      ${GATHERING_PROFS.map(g => `<option value="${g}" ${p.gathering === g ? "selected" : ""}>${g}</option>`).join("")}
    </select>
  `;

  const update = () => {
    state.duoPartner = {
      class: document.getElementById("partner-class").value,
      gathering: document.getElementById("partner-gather").value,
      faction: state.faction === "Both" ? "Alliance" : (state.faction || "Alliance")
    };
    saveState();
    renderRecommendations();
  };

  ["partner-class", "partner-gather"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = update;
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
  const playstyle = state.playstyle || "any role";
  lines.push(`<strong>Preferred role:</strong> ${playstyle}`);
  if (state.preferredClass) lines.push(`<strong>Preferred class:</strong> ${state.preferredClass}`);
  if (state.faction) lines.push(`<strong>Faction:</strong> ${state.faction}`);

  if (state.playstyle && ROLE_CLASSES[state.playstyle]) {
    lines.push(`Suitable classes: ${ROLE_CLASSES[state.playstyle].join(", ")}`);
  }

  if (state.characters.length > 0) {
    const main = state.characters.find(c => (c.role || "").toLowerCase().includes("main")) || state.characters[0];
    lines.push(`<strong>Primary character:</strong> ${main.name || "Unnamed"} (${main.race} ${main.class}, lvl ${main.level})`);
    lines.push(`Starting area: ${getStartingArea(main.race)}`);
  }

  if (state.duoMode && state.duoPartner) {
    lines.push(`<strong>Duo partner:</strong> ${state.duoPartner.class || "?"} — gathering: ${state.duoPartner.gathering || "none"}`);
    lines.push(`<strong>Starting area tip:</strong> Prefer shared zones for the same faction.`);
  }

  const covered = getCoveredCrafting();
  const missing = CRAFTING_PROFS.filter(p => !covered.has(p));
  lines.push(`<strong>Crafting coverage:</strong> ${covered.size}/6`);
  if (missing.length) lines.push(`Still need: ${missing.join(", ")}`);
  else lines.push("All six crafting professions covered.");

  if (state.characters.some(c => c.level >= 20)) {
    lines.push("Character at or above 20. Consider parking in an inn for rested XP and rotating an alt.");
  }

  let priority = "Cover remaining crafting professions, invest in Working Overtime, and rotate rested XP by logging out in inns.";
  if (state.duoMode) priority += " Keep gathering professions non-overlapping with your partner.";
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
  renderDuo();
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
    const role = document.getElementById("char-role").value;

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
      role,
      prof1: "",
      prof1Level: 0,
      prof2: "",
      prof2Level: 0
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

  const resetBtn = document.getElementById("reset-all");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm("Reset all local data?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = { duoMode: false, faction: "", playstyle: "", preferredClass: "", characters: [], duoPartner: null };
      hideCharForm();
      renderAll();
    }
  };

  const exportBtn = document.getElementById("export-duo");
  if (exportBtn) exportBtn.onclick = () => {
    const data = {
      preferredRole: state.playstyle || "",
      preferredClass: state.preferredClass || "",
      gathering: state.characters.find(c => GATHERING_PROFS.includes(c.prof1))?.prof1 ||
                 state.characters.find(c => GATHERING_PROFS.includes(c.prof2))?.prof2 || "",
      faction: state.faction || "Alliance"
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
      state.duoPartner = { class: data.preferredClass || "", gathering: data.gathering || "", faction: data.faction || state.faction };
      saveState();
      renderAll();
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
