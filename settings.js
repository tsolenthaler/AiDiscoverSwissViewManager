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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadAllConfigs();
  loadCurrentConfig();
  renderConfigList();
  renderForm();

  elements.newConfigBtn.addEventListener("click", newConfig);

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

