const CONFIGS_KEY = "aiviewmanager.configs";
const CURRENT_CONFIG_KEY = "aiviewmanager.current_config";
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
  const configs = localStorage.getItem(CONFIGS_KEY);
  const configsObj = configs ? JSON.parse(configs) : {};
  
  // Migrate old settings if they exist and no configs are present
  if (Object.keys(configsObj).length === 0) {
    const oldSettings = localStorage.getItem("aiviewmanager.settings");
    if (oldSettings) {
      try {
        const oldSettingsObj = JSON.parse(oldSettings);
        if (oldSettingsObj.apiKey || oldSettingsObj.project) {
          const migratedId = "config_migrated";
          configsObj[migratedId] = {
            name: "Default Configuration",
            apiKey: oldSettingsObj.apiKey || "",
            project: oldSettingsObj.project || "",
            openaiKey: oldSettingsObj.openaiKey || "",
            openaiModel: oldSettingsObj.openaiModel || "gpt-4o-mini",
            env: oldSettingsObj.env || "test",
          };
          localStorage.setItem(CONFIGS_KEY, JSON.stringify(configsObj));
          localStorage.setItem(CURRENT_CONFIG_KEY, migratedId);
          localStorage.removeItem("aiviewmanager.settings");
        }
      } catch (e) {
        console.error("Migration failed:", e);
      }
    }
  }
  
  const currentConfigId = localStorage.getItem(CURRENT_CONFIG_KEY);
  if (currentConfigId && configsObj[currentConfigId]) {
    state.settings = { ...DEFAULT_SETTINGS, ...configsObj[currentConfigId] };
  } else {
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  // Settings werden in settings.js verwaltet
  // Diese Funktion bleibt zur Kompatibilität, tut aber nichts
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
    alert("Bitte speichern Sie zuerst den OpenAI API Key in den Settings.");
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
    alert("Keine letzte Antwort vorhanden.");
    return;
  }
  
  const json = extractJsonFromText(state.chat.lastAssistantMessage);
  if (!json) {
    alert("Kein JSON in der letzten Antwort gefunden.");
    return;
  }

  // Store the draft in localStorage for the main app to pick up
  localStorage.setItem("aiviewmanager.chatbot.draft", JSON.stringify(json));
  alert("JSON wurde übertragen. Bitte wechseln Sie zum View Manager.");
  
  // Optional: Open the main page
  setTimeout(() => {
    window.open("index.html", "_self");
  }, 1500);
}

function loadContextFromManager() {
  // Try to load the selected view from the main app
  const mainState = localStorage.getItem("aiviewmanager.state");
  if (!mainState) {
    alert("Kein View im Manager ausgewählt.");
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
        return;
      }
    }
    alert("Kein View im Manager ausgewählt.");
  } catch (error) {
    alert("Fehler beim Laden des Kontexts.");
  }
}

function clearContext() {
  state.context = null;
  saveContext();
  renderContext();
}

function clearChat() {
  if (!confirm("Chat-Verlauf wirklich löschen?")) return;
  
  state.chat.messages = [];
  state.chat.lastAssistantMessage = "";
  saveChatHistory();
  renderChat();
}

function wireEvents() {
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
  loadContext();
  loadChatHistory();
  wireEvents();
}

init();
