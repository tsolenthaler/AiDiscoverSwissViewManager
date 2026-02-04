const SETTINGS_KEY = "aiviewmanager.settings";

const DEFAULT_SETTINGS = {
  apiKey: "",
  project: "",
  openaiKey: "",
  openaiModel: "gpt-4o-mini",
  env: "test",
};

const state = {
  settings: { ...DEFAULT_SETTINGS },
};

const elements = {
  envSelect: document.getElementById("envSelect"),
  settingsForm: document.getElementById("settingsForm"),
  dsApiKey: document.getElementById("dsApiKey"),
  dsProject: document.getElementById("dsProject"),
  openaiKey: document.getElementById("openaiKey"),
  openaiModel: document.getElementById("openaiModel"),
  settingsStatus: document.getElementById("settingsStatus"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

function showLoading() {
  elements.loadingOverlay.classList.add("active");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("active");
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  state.settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function renderSettings() {
  elements.dsApiKey.value = state.settings.apiKey;
  elements.dsProject.value = state.settings.project;
  elements.openaiKey.value = state.settings.openaiKey;
  elements.openaiModel.value = state.settings.openaiModel;
  elements.envSelect.value = state.settings.env;
}

function updateSettingsStatus(message, isError = false) {
  elements.settingsStatus.textContent = message;
  elements.settingsStatus.style.color = isError ? "var(--danger)" : "var(--primary)";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  renderSettings();

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.apiKey = elements.dsApiKey.value.trim();
    state.settings.project = elements.dsProject.value.trim();
    state.settings.openaiKey = elements.openaiKey.value.trim();
    state.settings.openaiModel = elements.openaiModel.value.trim() || "gpt-4o-mini";
    state.settings.env = elements.envSelect.value;
    saveSettings();
    updateSettingsStatus("Settings saved.");
  });
});
