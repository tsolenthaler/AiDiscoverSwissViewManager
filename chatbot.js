const SETTINGS_KEY = "aiviewmanager.settings";
const CONTEXT_KEY = "aiviewmanager.chatbot.context";
const CHAT_HISTORY_KEY = "aiviewmanager.chatbot.history";

const DEFAULT_SETTINGS = {
  apiKey: "",
  project: "",
  openaiKey: "",
  openaiModel: "gpt-4o-mini",
  env: "test",
};

const state = {
  settings: { ...DEFAULT_SETTINGS },
  context: null,
  chat: {
    messages: [],
    lastAssistantMessage: "",
  },
};

const elements = {
  envSelect: document.getElementById("envSelect"),
  settingsForm: document.getElementById("settingsForm"),
  dsApiKey: document.getElementById("dsApiKey"),
  dsProject: document.getElementById("dsProject"),
  openaiKey: document.getElementById("openaiKey"),
  openaiModel: document.getElementById("openaiModel"),
  settingsStatus: document.getElementById("settingsStatus"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  chatMessage: document.getElementById("chatMessage"),
  applyChatDraftBtn: document.getElementById("applyChatDraftBtn"),
  clearChatBtn: document.getElementById("clearChatBtn"),
  loadContextBtn: document.getElementById("loadContextBtn"),
  clearContextBtn: document.getElementById("clearContextBtn"),
  contextInfo: document.getElementById("contextInfo"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

function showLoading() {
  elements.loadingOverlay.classList.add("active");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("active");
}

function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadContext() {
  const saved = localStorage.getItem(CONTEXT_KEY);
  if (saved) {
    state.context = JSON.parse(saved);
    renderContext();
  }
}

function saveContext() {
  if (state.context) {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(state.context));
  } else {
    localStorage.removeItem(CONTEXT_KEY);
  }
}

function loadChatHistory() {
  const saved = localStorage.getItem(CHAT_HISTORY_KEY);
  if (saved) {
    state.chat = JSON.parse(saved);
    renderChat();
  }
}

function saveChatHistory() {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state.chat));
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

function renderContext() {
  if (!state.context) {
    elements.contextInfo.innerHTML = '<p class="muted-text">Kein Kontext geladen</p>';
    elements.contextInfo.classList.remove("loaded");
    elements.clearContextBtn.style.display = "none";
    return;
  }

  elements.contextInfo.classList.add("loaded");
  elements.clearContextBtn.style.display = "block";
  
  const html = `
    <strong>View geladen:</strong>
    <div style="margin-top: 8px;">
      <strong>Name:</strong> ${state.context.name || "Unbenannt"}<br>
      <strong>ID:</strong> ${state.context.id || "N/A"}<br>
      <strong>Schedule:</strong> ${state.context.scheduleStrategy || "N/A"}
    </div>
  `;
  
  elements.contextInfo.innerHTML = html;
}

function renderChat() {
  elements.chatLog.innerHTML = "";
  state.chat.messages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-message ${message.role === "user" ? "user" : "bot"}`;
    bubble.textContent = message.content;
    elements.chatLog.appendChild(bubble);
  });
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function extractJsonFromText(text) {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  
  try {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function sendChatMessage(message) {
  if (!state.settings.openaiKey) {
    updateSettingsStatus("Bitte speichern Sie zuerst den OpenAI API Key.", true);
    return;
  }
  
  const viewContextInfo = state.context
    ? `\n\nCURRENT VIEW CONTEXT:\nView ID: ${state.context.id}\nView Name: ${state.context.name}\nView Data:\n${JSON.stringify(state.context, null, 2)}`
    : "\n\nNo view currently selected. User is creating a new view from scratch.";
  
  const systemPrompt = `You are AIViewManager, a helpful assistant for creating and editing discover.swiss SearchViewRequest configurations.

Your role:
- Guide users through building views for searching tourism/hospitality data
- Provide suggestions based on discover.swiss API capabilities
- Generate valid JSON when requested
- Help optimize search strategies
- ${state.context ? `Assist in modifying the currently selected view (${state.context.name})` : "Help create new views"}

discover.swiss API Documentation:
- Environments: Test (api.discover.swiss/test/info/v2), Production (api.discover.swiss/info/v2)
- Main endpoint: /search/views for CRUD operations on views

SearchViewRequest Structure:
{
  "name": "string",
  "description": "string", 
  "scheduleStrategy": "EveryHour | Every6Hours | Every12Hours | Daily | Weekly",
  "searchRequest": {
    "project": ["project-name"],
    "combinedTypeTree": ["Thing|Place|LocalBusiness"],  // OR use categoryTree
    "categoryTree": ["category-name"],                   // Use ONE of combinedTypeTree OR categoryTree
    "facets": [
      {
        "name": "facet-name",
        "responseName": "displayName",
        "responseNames": { "de": "Anzeigename", "en": "Display Name" },
        "filterValues": ["value1", "value2"],
        "additionalType": ["type1"],
        "orderBy": "field",
        "orderDirection": "asc | desc",
        "count": 10,
        "excludeRedundant": true  // Set for categoryTree/combinedTypeTree facets
      }
    ]
  }
}

Filter Types:
- combinedTypeTree: Schema.org combined type hierarchy
- categoryTree: Tourism category hierarchy
- filters, award, campaignTag, allTag, category, amenityFeature, starRatingName, addressLocality, addressPostalCode

Facet Names (common):
- categoryTree: Tourism categories (hotels, restaurants, attractions, etc.)
- combinedTypeTree: Schema.org types (LocalBusiness, Restaurant, etc.)
- amenityFeature: Accommodation amenities (WiFi, pool, gym, etc.)
- starRatingName: Star ratings
- addressLocality: Geographic locations
- award, campaignTag: Special promotions/awards

Best Practices:
- Use facets to enable filtering in search results
- Set responseNames for multi-language support
- Use excludeRedundant=true for tree-based facets to avoid duplicate entries
- orderBy and orderDirection help present facets in logical order
- count limits the number of returned facet values

When creating views:
1. Ask about data scope (accommodations, restaurants, attractions, etc.)
2. Determine needed facets for filtering
3. Suggest appropriate schedule strategy
4. Provide complete JSON structure
5. Guide on filters and facet configuration

${viewContextInfo}

Respond in JSON when user asks "create", "generate", "suggest", "update", or "modify" a view.
Keep technical details concise but complete.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...state.chat.messages,
    { role: "user", content: message },
  ];

  state.chat.messages.push({ role: "user", content: message });
  renderChat();
  saveChatHistory();

  try {
    showLoading();
    const requestBody = {
      model: state.settings.openaiModel || "gpt-4o-mini",
      messages,
      temperature: 0.4,
    };
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.settings.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      throw data;
    }

    const assistantMessage = data.choices?.[0]?.message?.content || "";
    state.chat.messages.push({ role: "assistant", content: assistantMessage });
    state.chat.lastAssistantMessage = assistantMessage;
    renderChat();
    saveChatHistory();
  } catch (error) {
    const errorMessage = `Error: ${error.error?.message || JSON.stringify(error)}`;
    state.chat.messages.push({ role: "assistant", content: errorMessage });
    renderChat();
    saveChatHistory();
  } finally {
    hideLoading();
  }
}

function applyChatDraft() {
  if (!state.chat.lastAssistantMessage) {
    updateSettingsStatus("Keine letzte Antwort vorhanden.", true);
    return;
  }
  
  const json = extractJsonFromText(state.chat.lastAssistantMessage);
  if (!json) {
    updateSettingsStatus("Kein JSON in der letzten Antwort gefunden.", true);
    return;
  }

  // Store the draft in localStorage for the main app to pick up
  localStorage.setItem("aiviewmanager.chatbot.draft", JSON.stringify(json));
  updateSettingsStatus("JSON wurde übertragen. Bitte wechseln Sie zum View Manager.", false);
  
  // Optional: Open the main page
  setTimeout(() => {
    window.open("index.html", "_self");
  }, 1500);
}

function loadContextFromManager() {
  // Try to load the selected view from the main app
  const mainState = localStorage.getItem("aiviewmanager.state");
  if (!mainState) {
    updateSettingsStatus("Kein View im Manager ausgewählt.", true);
    return;
  }
  
  try {
    const parsed = JSON.parse(mainState);
    if (parsed.selectedViewId && parsed.views?.length > 0) {
      const selectedView = parsed.views.find(v => v.id === parsed.selectedViewId);
      if (selectedView) {
        state.context = selectedView;
        saveContext();
        renderContext();
        updateSettingsStatus("Kontext vom Manager geladen.", false);
        return;
      }
    }
    updateSettingsStatus("Kein View im Manager ausgewählt.", true);
  } catch (error) {
    updateSettingsStatus("Fehler beim Laden des Kontexts.", true);
  }
}

function clearContext() {
  state.context = null;
  saveContext();
  renderContext();
  updateSettingsStatus("Kontext gelöscht.", false);
}

function clearChat() {
  if (!confirm("Chat-Verlauf wirklich löschen?")) return;
  
  state.chat.messages = [];
  state.chat.lastAssistantMessage = "";
  saveChatHistory();
  renderChat();
  updateSettingsStatus("Chat-Verlauf gelöscht.", false);
}

function wireEvents() {
  elements.settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.settings.apiKey = elements.dsApiKey.value.trim();
    state.settings.project = elements.dsProject.value.trim();
    state.settings.openaiKey = elements.openaiKey.value.trim();
    state.settings.openaiModel = elements.openaiModel.value.trim() || "gpt-4o-mini";
    state.settings.env = elements.envSelect.value;
    saveSettings();
    updateSettingsStatus("Settings gespeichert", false);
  });

  elements.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = elements.chatMessage.value.trim();
    if (!message) return;
    elements.chatMessage.value = "";
    sendChatMessage(message);
  });

  elements.applyChatDraftBtn.addEventListener("click", applyChatDraft);
  elements.clearChatBtn.addEventListener("click", clearChat);
  elements.loadContextBtn.addEventListener("click", loadContextFromManager);
  elements.clearContextBtn.addEventListener("click", clearContext);
}

function init() {
  loadSettings();
  renderSettings();
  loadContext();
  loadChatHistory();
  wireEvents();
}

init();
