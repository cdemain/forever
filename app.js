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
const ALL_CLASSES = ["Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Shaman", "Mage", "Warlock", "Druid"];

const ROLE_CLASSES = {
  "Tank": ["Warrior", "Paladin", "Druid"],
  "Melee DPS": ["Warrior", "Rogue", "Paladin", "Druid", "Shaman"],
  "Ranged DPS": ["Hunter", "Mage", "Warlock", "Priest", "Shaman"],
  "Healing": ["Priest", "Paladin", "Druid", "Shaman"]
};

const STORAGE_KEY = "wowForeverLegacyPlan";

let state = {
  duoMode: false,
  playstyle: "",
  characters: [],
  duoPartner: null
};

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
    btn.onclick = () => editCharacter(+btn.dataset.edit);
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

function editCharacter(idx) {
  const existing = idx >= 0 ? { ...state.characters[idx] } : {
    name: "", race: "Human", class: "Warrior", level: 1,
    faction: "Alliance", prof1: "", prof1Level: 0, prof2: "", prof2Level: 0, role: "Main"
  };

  const name = prompt("Character name:", existing.name);
  if (name === null) return;

  const race = prompt("Race:\n" + Object.keys(RACE_CLASS_MATRIX).join(", "), existing.race);
  if (!race || !RACE_CLASS_MATRIX[race]) {
    alert("Invalid race.");
    return;
  }

  const valid = getValidClasses(race);
  const cls = prompt(`Class for ${race}:\n${valid.join(", ")}`, existing.class);
  if (!cls || !valid.includes(cls)) {
    alert("Invalid class for that race.");
    return;
  }

  const level = parseInt(prompt("Level:", existing.level) || "1", 10) || 1;
  const role = prompt("Role (Main / Alt / etc.):", existing.role || "Main") || "Main";

  const updated = {
    ...existing,
    name: name.trim(),
    race,
    class: cls,
    level,
    faction: RACE_CLASS_MATRIX[race].faction,
    role
  };

  if (idx >= 0) state.characters[idx] = updated;
  else state.characters.push(updated);

  saveState();
  renderAll();
}

function renderDuo() {
  const section = document.getElementById("duo-section");
  if (!section) return;
  section.classList.toggle("hidden", !state.duoMode);
  if (!state.duoMode) return;

  const fields = document.getElementById("duo-partner-fields");
  if (!fields) return;

  const p = state.duoPartner || { class: "", gathering: "", faction: "Alliance" };

  fields.innerHTML = `
    <label for="partner-class">Partner preferred class</label>
    <select id="partner-class">
      <option value="">Select</option>
      ${ALL_CLASSES.map(c => `<option value="${c}" ${p.class === c ? "selected" : ""}>${c}</option>`).join("")}
    </select>
    <label for="partner-gather">Partner gathering profession</label>
    <select id="partner-gather">
      <option value="">Select</option>
      ${GATHERING_PROFS.map(g => `<option value="${g}" ${p.gathering === g ? "selected" : ""}>${g}</option>`).join("")}
    </select>
    <label for="partner-faction">Partner faction</label>
    <select id="partner-faction">
      <option value="Alliance" ${p.faction === "Alliance" ? "selected" : ""}>Alliance</option>
      <option value="Horde" ${p.faction === "Horde" ? "selected" : ""}>Horde</option>
    </select>
  `;

  const update = () => {
    state.duoPartner = {
      class: document.getElementById("partner-class").value,
      gathering: document.getElementById("partner-gather").value,
      faction: document.getElementById("partner-faction").value
    };
    saveState();
    renderRecommendations();
  };

  ["partner-class", "partner-gather", "partner-faction"].forEach(id => {
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

  if (state.playstyle && ROLE_CLASSES[state.playstyle]) {
    lines.push(`Suitable classes: ${ROLE_CLASSES[state.playstyle].join(", ")}`);
  }

  if (state.characters.length > 0) {
    const main = state.characters.find(c => (c.role || "").toLowerCase().includes("main")) || state.characters[0];
    lines.push(`<strong>Primary character:</strong> ${main.name || "Unnamed"} (${main.race} ${main.class}, lvl ${main.level})`);
    lines.push(`Starting area: ${getStartingArea(main.race)}`);
  }

  if (state.duoMode && state.duoPartner) {
    lines.push(`<strong>Duo partner:</strong> ${state.duoPartner.class || "?"} (${state.duoPartner.faction || "?"}) — gathering: ${state.duoPartner.gathering || "none"}`);
    const userFaction = state.characters[0]?.faction || "Alliance";
    if (state.duoPartner.faction && userFaction !== state.duoPartner.faction) {
      lines.push(`<span class="warning">Different factions — you cannot mail resources to each other.</span>`);
    }
    lines.push(`<strong>Starting area tip:</strong> Prefer shared zones (Elwynn/Dun Morogh for Alliance, Durotar for Horde, Zephras Isle for Skyborne).`);
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

  const playstyleSel = document.getElementById("playstyle");
  if (playstyleSel) playstyleSel.value = state.playstyle || "";

  renderRoster();
  renderDuo();
  renderRecommendations();
}

function bindEvents() {
  const duoMode = document.getElementById("duo-mode");
  if (duoMode) duoMode.onchange = e => { state.duoMode = e.target.checked; saveState(); renderAll(); };

  const playstyle = document.getElementById("playstyle");
  if (playstyle) playstyle.onchange = e => { state.playstyle = e.target.value; saveState(); renderRecommendations(); };

  const addBtn = document.getElementById("add-char");
  if (addBtn) addBtn.onclick = () => editCharacter(-1);

  const resetBtn = document.getElementById("reset-all");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm("Reset all local data?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = { duoMode: false, playstyle: "", characters: [], duoPartner: null };
      renderAll();
    }
  };

  const exportBtn = document.getElementById("export-duo");
  if (exportBtn) exportBtn.onclick = () => {
    const data = {
      preferredRole: state.playstyle || "",
      gathering: state.characters.find(c => GATHERING_PROFS.includes(c.prof1))?.prof1 ||
                 state.characters.find(c => GATHERING_PROFS.includes(c.prof2))?.prof2 || "",
      faction: state.characters[0]?.faction || "Alliance"
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
      state.duoPartner = { class: data.preferredClass || "", gathering: data.gathering || "", faction: data.faction || "Alliance" };
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
