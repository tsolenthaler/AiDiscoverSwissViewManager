const CONFIGS_KEY = "aiviewmanager.configs";
const CURRENT_CONFIG_KEY = "aiviewmanager.current_config";

const DEFAULT_CONFIG = {
  apiKey: "",
  project: "",
  env: "test",
};

const state = {
  configs: {}, // { configId: { name, ...config } }
  currentConfigId: null,
  currentConfig: { ...DEFAULT_CONFIG },
};

const elements = {
  configList: document.getElementById("configList"),
  newConfigBtn: document.getElementById("newConfigBtn"),
  exportConfigsBtn: document.getElementById("exportConfigsBtn"),
  importConfigsBtn: document.getElementById("importConfigsBtn"),
  importConfigsInput: document.getElementById("importConfigsInput"),
  configName: document.getElementById("configName"),
  envSelect: document.getElementById("envSelect"),
  settingsForm: document.getElementById("settingsForm"),
  dsApiKey: document.getElementById("dsApiKey"),
  dsProject: document.getElementById("dsProject"),
  settingsStatus: document.getElementById("settingsStatus"),
  deleteConfigBtn: document.getElementById("deleteConfigBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

function showLoading() {
  elements.loadingOverlay.classList.add("active");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("active");
}

function loadAllConfigs() {
  const raw = localStorage.getItem(CONFIGS_KEY);
  state.configs = raw ? JSON.parse(raw) : {};
  
  // Migrate old settings if they exist and no configs are present
  if (Object.keys(state.configs).length === 0) {
    const oldSettings = localStorage.getItem("aiviewmanager.settings");
    if (oldSettings) {
      try {
        const oldSettingsObj = JSON.parse(oldSettings);
        if (oldSettingsObj.apiKey || oldSettingsObj.project) {
          const migratedId = "config_migrated";
          state.configs[migratedId] = {
            name: "Default Configuration",
            apiKey: oldSettingsObj.apiKey || "",
            project: oldSettingsObj.project || "",
            env: oldSettingsObj.env || "test",
          };
          saveAllConfigs();
          localStorage.setItem(CURRENT_CONFIG_KEY, migratedId);
          localStorage.removeItem("aiviewmanager.settings");
        }
      } catch (e) {
        console.error("Migration failed:", e);
      }
    }
  }
}

function loadCurrentConfig() {
  const configId = localStorage.getItem(CURRENT_CONFIG_KEY);
  if (configId && state.configs[configId]) {
    state.currentConfigId = configId;
    state.currentConfig = { ...state.configs[configId] };
  } else {
    state.currentConfigId = null;
    state.currentConfig = { ...DEFAULT_CONFIG };
  }
}

function saveAllConfigs() {
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(state.configs));
}

function saveCurrentConfig() {
  if (state.currentConfigId) {
    localStorage.setItem(CURRENT_CONFIG_KEY, state.currentConfigId);
  }
}

function generateConfigId() {
  return "config_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function renderConfigList() {
  elements.configList.innerHTML = "";
  
  if (Object.keys(state.configs).length === 0) {
    elements.configList.innerHTML = '<p class="muted-text">Keine Konfigurationen gespeichert</p>';
    return;
  }

  Object.entries(state.configs).forEach(([configId, config]) => {
    const div = document.createElement("div");
    div.className = `config-item ${configId === state.currentConfigId ? "active" : ""}`;
    
    const nameSpan = document.createElement("span");
    nameSpan.className = "config-name";
    nameSpan.textContent = config.name || "Unnamed";
    
    const infoSpan = document.createElement("span");
    infoSpan.className = "config-info";
    infoSpan.textContent = `${config.env} • ${config.project || "no project"}`;
    
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "config-buttons";
    
    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "tertiary";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => loadConfigIntoForm(configId));
    
    buttonContainer.appendChild(loadBtn);
    div.appendChild(nameSpan);
    div.appendChild(infoSpan);
    div.appendChild(buttonContainer);
    elements.configList.appendChild(div);
  });
}

function renderForm() {
  elements.configName.value = state.currentConfig.name || "";
  elements.dsApiKey.value = state.currentConfig.apiKey || "";
  elements.dsProject.value = state.currentConfig.project || "";
  elements.envSelect.value = state.currentConfig.env || "test";
  
  elements.deleteConfigBtn.style.display = state.currentConfigId ? "block" : "none";
}

function loadConfigIntoForm(configId) {
  if (state.configs[configId]) {
    state.currentConfigId = configId;
    state.currentConfig = { ...state.configs[configId] };
    saveCurrentConfig();
    renderForm();
    renderConfigList();
    updateSettingsStatus("Konfiguration geladen.");
  }
}

function newConfig() {
  state.currentConfigId = null;
  state.currentConfig = { ...DEFAULT_CONFIG };
  elements.configName.focus();
  renderForm();
  renderConfigList();
  updateSettingsStatus("Neue Konfiguration");
}

function updateSettingsStatus(message, isError = false) {
  elements.settingsStatus.textContent = message;
  elements.settingsStatus.style.color = isError ? "var(--danger)" : "var(--primary)";
}

function getExportFileName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `aiviewmanager-configs-${stamp}.json`;
}

function exportConfigsAsJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    currentConfigId: state.currentConfigId,
    configs: state.configs,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = getExportFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
  updateSettingsStatus("Konfigurationen als JSON exportiert.");
}

function normalizeImportedConfig(config) {
  if (!config || typeof config !== "object") return null;

  const name = typeof config.name === "string" ? config.name.trim() : "";
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";
  const project = typeof config.project === "string" ? config.project.trim() : "";
  const env = config.env === "prod" ? "prod" : "test";

  if (!name) return null;

  return { name, apiKey, project, env };
}

function importConfigsFromJsonFile(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const raw = String(reader.result || "");
      const parsed = JSON.parse(raw);
      const importedConfigs = parsed?.configs;

      if (!importedConfigs || typeof importedConfigs !== "object" || Array.isArray(importedConfigs)) {
        throw new Error("invalid-format");
      }

      const normalizedConfigs = {};
      Object.entries(importedConfigs).forEach(([configId, config]) => {
        if (!configId || typeof configId !== "string") return;
        const normalized = normalizeImportedConfig(config);
        if (normalized) {
          normalizedConfigs[configId] = normalized;
        }
      });

      const importedCount = Object.keys(normalizedConfigs).length;
      if (importedCount === 0) {
        throw new Error("no-valid-configs");
      }

      if (Object.keys(state.configs).length > 0) {
        const shouldOverwrite = confirm("Vorhandene Konfigurationen durch Import ersetzen?");
        if (!shouldOverwrite) {
          updateSettingsStatus("Import abgebrochen.");
          return;
        }
      }

      state.configs = normalizedConfigs;

      const preferredCurrentId = typeof parsed.currentConfigId === "string" ? parsed.currentConfigId : null;
      const availableIds = Object.keys(state.configs);
      state.currentConfigId = preferredCurrentId && state.configs[preferredCurrentId]
        ? preferredCurrentId
        : availableIds[0] || null;
      state.currentConfig = state.currentConfigId
        ? { ...state.configs[state.currentConfigId] }
        : { ...DEFAULT_CONFIG };

      saveAllConfigs();
      if (state.currentConfigId) {
        saveCurrentConfig();
      } else {
        localStorage.removeItem(CURRENT_CONFIG_KEY);
      }

      renderConfigList();
      renderForm();
      updateSettingsStatus(`${importedCount} Konfiguration(en) importiert.`);
    } catch (error) {
      console.error("Import failed:", error);
      updateSettingsStatus("Import fehlgeschlagen: Ungültige JSON-Datei.", true);
    } finally {
      elements.importConfigsInput.value = "";
    }
  };

  reader.onerror = () => {
    updateSettingsStatus("Import fehlgeschlagen: Datei konnte nicht gelesen werden.", true);
    elements.importConfigsInput.value = "";
  };

  reader.readAsText(file, "utf-8");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadAllConfigs();
  loadCurrentConfig();
  renderConfigList();
  renderForm();

  elements.newConfigBtn.addEventListener("click", newConfig);
  elements.exportConfigsBtn.addEventListener("click", exportConfigsAsJson);
  elements.importConfigsBtn.addEventListener("click", () => elements.importConfigsInput.click());
  elements.importConfigsInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    importConfigsFromJsonFile(file);
  });

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const name = elements.configName.value.trim();
    if (!name) {
      updateSettingsStatus("Bitte geben Sie einen Namen ein.", true);
      return;
    }

    const apiKey = elements.dsApiKey.value.trim();
    if (!apiKey) {
      updateSettingsStatus("Bitte geben Sie einen API Key ein.", true);
      return;
    }

    const project = elements.dsProject.value.trim();
    if (!project) {
      updateSettingsStatus("Bitte geben Sie einen Project Name ein.", true);
      return;
    }

    // Create or update config
    const configId = state.currentConfigId || generateConfigId();
    
    state.configs[configId] = {
      name,
      apiKey,
      project,
      env: elements.envSelect.value,
    };

    state.currentConfigId = configId;
    state.currentConfig = { ...state.configs[configId] };
    
    saveAllConfigs();
    saveCurrentConfig();
    renderConfigList();
    renderForm();
    updateSettingsStatus("Konfiguration gespeichert.");
  });

  elements.deleteConfigBtn.addEventListener("click", () => {
    if (!state.currentConfigId) return;
    
    if (!confirm(`Wirklich löschen: "${state.configs[state.currentConfigId].name}"?`)) {
      return;
    }

    delete state.configs[state.currentConfigId];
    state.currentConfigId = null;
    state.currentConfig = { ...DEFAULT_CONFIG };
    
    saveAllConfigs();
    localStorage.removeItem(CURRENT_CONFIG_KEY);
    renderConfigList();
    renderForm();
    updateSettingsStatus("Konfiguration gelöscht.");
  });
});

