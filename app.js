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
  views: [],
  selectedViewId: null,
  draft: {
    name: "",
    description: "",
    scheduleStrategy: "Daily",
    filters: [],
    facets: [],
  },
  responses: {
    request: {},
    response: {},
    results: {},
  },
  chat: {
    messages: [],
    lastAssistantMessage: "",
  },
};

const elements = {
  envSelect: document.getElementById("envSelect"),
  refreshViewsBtn: document.getElementById("refreshViewsBtn"),
  settingsForm: document.getElementById("settingsForm"),
  dsApiKey: document.getElementById("dsApiKey"),
  dsProject: document.getElementById("dsProject"),
  openaiKey: document.getElementById("openaiKey"),
  openaiModel: document.getElementById("openaiModel"),
  settingsStatus: document.getElementById("settingsStatus"),
  viewsList: document.getElementById("viewsList"),
  loadViewBtn: document.getElementById("loadViewBtn"),
  deleteViewBtn: document.getElementById("deleteViewBtn"),
  draftName: document.getElementById("draftName"),
  draftDescription: document.getElementById("draftDescription"),
  draftSchedule: document.getElementById("draftSchedule"),
  addFilterBtn: document.getElementById("addFilterBtn"),
  filterList: document.getElementById("filterList"),
  facetList: document.getElementById("facetList"),
  addFacetBtn: document.getElementById("addFacetBtn"),
  createViewBtn: document.getElementById("createViewBtn"),
  updateViewBtn: document.getElementById("updateViewBtn"),
  previewResultsBtn: document.getElementById("previewResultsBtn"),
  copyRequestBtn: document.getElementById("copyRequestBtn"),
  requestJson: document.getElementById("requestJson"),
  responseJson: document.getElementById("responseJson"),
  resultsJson: document.getElementById("resultsJson"),
  copyResponseBtn: document.getElementById("copyResponseBtn"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  chatMessage: document.getElementById("chatMessage"),
  applyChatDraftBtn: document.getElementById("applyChatDraftBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

function showLoading() {
  elements.loadingOverlay.classList.add("active");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("active");
}

function getBaseUrl() {
  return state.settings.env === "prod"
    ? "https://api.discover.swiss/info/v2"
    : "https://api.discover.swiss/test/info/v2";
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
  elements.settingsStatus.style.color = isError ? "#dc2626" : "#6b7280";
}

async function apiRequest(path, options = {}) {
  if (!state.settings.apiKey || !state.settings.project) {
    updateSettingsStatus("Please save API key and project name first.", true);
    throw new Error("Missing settings");
  }
  const url = new URL(`${getBaseUrl()}${path}`);
  url.searchParams.set("project", state.settings.project);
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    query: undefined,
    headers: {
      "Ocp-Apim-Subscription-Key": state.settings.apiKey,
      "Accept-Language": "de",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = {
      status: response.status,
      message: response.statusText,
      data,
    };
    throw error;
  }

  return data;
}

function renderViews() {
  elements.viewsList.innerHTML = "";
  if (!state.views.length) {
    elements.viewsList.innerHTML = "<div class=\"status\">No views loaded.</div>";
    return;
  }
  state.views.forEach((view) => {
    const item = document.createElement("div");
    item.className = `list-item ${state.selectedViewId === view.id ? "active" : ""}`;
    item.textContent = `${view.name || view.id} · ${view.scheduleStrategy || ""}`;
    item.addEventListener("click", () => {
      state.selectedViewId = view.id;
      renderViews();
      updateButtonStates();
      loadSelectedView();
    });
    elements.viewsList.appendChild(item);
  });
}

function renderDraft() {
  elements.draftName.value = state.draft.name;
  elements.draftDescription.value = state.draft.description;
  elements.draftSchedule.value = state.draft.scheduleStrategy;
  renderFilters();
  renderFacets();
  updateRequestJson();
  updateButtonStates();
}

function updateButtonStates() {
  const isEditingExisting = !!state.selectedViewId;
  elements.createViewBtn.disabled = isEditingExisting;
  elements.updateViewBtn.disabled = !isEditingExisting;
  
  if (isEditingExisting) {
    elements.createViewBtn.style.opacity = "0.5";
    elements.createViewBtn.style.cursor = "not-allowed";
    elements.updateViewBtn.style.opacity = "1";
    elements.updateViewBtn.style.cursor = "pointer";
  } else {
    elements.createViewBtn.style.opacity = "1";
    elements.createViewBtn.style.cursor = "pointer";
    elements.updateViewBtn.style.opacity = "0.5";
    elements.updateViewBtn.style.cursor = "not-allowed";
  }
}

function renderFilters() {
  elements.filterList.innerHTML = "";
  if (!state.draft.filters.length) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "No filters configured yet.";
    elements.filterList.appendChild(empty);
    return;
  }

  state.draft.filters.forEach((filter, index) => {
    const card = document.createElement("div");
    card.className = "filter-card";
    card.innerHTML = `
      <header>
        <h4>Filter ${index + 1}</h4>
        <div class="button-row">
          <button class="secondary" data-action="up">Up</button>
          <button class="secondary" data-action="down">Down</button>
          <button class="danger" data-action="remove">Remove</button>
        </div>
      </header>
      <div class="grid-2">
        <label>
          <span>Filter type</span>
          <select data-field="type">
            <option value="combinedTypeTree" ${filter.type === "combinedTypeTree" ? "selected" : ""}>combinedTypeTree</option>
            <option value="categoryTree" ${filter.type === "categoryTree" ? "selected" : ""}>categoryTree</option>
            <option value="filters" ${filter.type === "filters" ? "selected" : ""}>filters</option>
            <option value="award" ${filter.type === "award" ? "selected" : ""}>award</option>
            <option value="campaignTag" ${filter.type === "campaignTag" ? "selected" : ""}>campaignTag</option>
            <option value="allTag" ${filter.type === "allTag" ? "selected" : ""}>allTag</option>
            <option value="category" ${filter.type === "category" ? "selected" : ""}>category</option>
            <option value="amenityFeature" ${filter.type === "amenityFeature" ? "selected" : ""}>amenityFeature</option>
            <option value="starRatingName" ${filter.type === "starRatingName" ? "selected" : ""}>starRatingName</option>
            <option value="addressLocality" ${filter.type === "addressLocality" ? "selected" : ""}>addressLocality</option>
            <option value="addressPostalCode" ${filter.type === "addressPostalCode" ? "selected" : ""}>addressPostalCode</option>
          </select>
        </label>
        <label class="full">
          <span>Filter values (one per line)</span>
          <textarea rows="3" data-field="values" placeholder="Thing|Place|LocalBusiness|FoodEstablishment">${(filter.values || []).join("\n")}</textarea>
        </label>
      </div>
    `;

    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "remove") {
          state.draft.filters.splice(index, 1);
        } else if (action === "up" && index > 0) {
          [state.draft.filters[index - 1], state.draft.filters[index]] = [
            state.draft.filters[index],
            state.draft.filters[index - 1],
          ];
        } else if (action === "down" && index < state.draft.filters.length - 1) {
          [state.draft.filters[index + 1], state.draft.filters[index]] = [
            state.draft.filters[index],
            state.draft.filters[index + 1],
          ];
        }
        renderFilters();
        updateRequestJson();
      });
    });

    card.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        updateFilterField(index, field, input.value);
      });
    });

    elements.filterList.appendChild(card);
  });
}

function updateFilterField(index, field, value) {
  const filter = state.draft.filters[index];
  if (!filter) return;

  if (field === "values") {
    filter.values = value.split("\n").map((v) => v.trim()).filter(Boolean);
  } else if (field === "type") {
    filter.type = value;
  }
  updateRequestJson();
}

function renderFacets() {
  elements.facetList.innerHTML = "";
  if (!state.draft.facets.length) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "No facets configured yet.";
    elements.facetList.appendChild(empty);
    return;
  }

  state.draft.facets.forEach((facet, index) => {
    const card = document.createElement("div");
    card.className = "facet-card";
    card.innerHTML = `
      <header>
        <strong>Facet ${index + 1}</strong>
        <div class="button-row">
          <button class="secondary" data-action="up">Up</button>
          <button class="secondary" data-action="down">Down</button>
          <button class="danger" data-action="remove">Remove</button>
        </div>
      </header>
      <div class="grid-2">
        <label>
          <span>Name</span>
          <input data-field="name" value="${facet.name || ""}" />
        </label>
        <label>
          <span>Response Name (single)</span>
          <input data-field="responseName" value="${facet.responseName || ""}" />
        </label>
        <label>
          <span>Response Names DE</span>
          <input data-field="responseNames.de" value="${facet.responseNames?.de || ""}" />
        </label>
        <label>
          <span>Response Names EN</span>
          <input data-field="responseNames.en" value="${facet.responseNames?.en || ""}" />
        </label>
        <label>
          <span>Filter values (one per line)</span>
          <textarea rows="3" data-field="filterValues">${(facet.filterValues || []).join("\n")}</textarea>
        </label>
        <label>
          <span>Additional type (comma separated)</span>
          <input data-field="additionalType" value="${(facet.additionalType || []).join(",")}" />
        </label>
        <label>
          <span>Order by</span>
          <input data-field="orderBy" value="${facet.orderBy || ""}" />
        </label>
        <label>
          <span>Order direction</span>
          <select data-field="orderDirection">
            <option value="">--</option>
            <option value="asc" ${facet.orderDirection === "asc" ? "selected" : ""}>asc</option>
            <option value="desc" ${facet.orderDirection === "desc" ? "selected" : ""}>desc</option>
          </select>
        </label>
        <label>
          <span>Count</span>
          <input data-field="count" type="number" min="1" value="${facet.count || ""}" />
        </label>
      </div>
    `;

    card.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "remove") {
          state.draft.facets.splice(index, 1);
        } else if (action === "up" && index > 0) {
          [state.draft.facets[index - 1], state.draft.facets[index]] = [
            state.draft.facets[index],
            state.draft.facets[index - 1],
          ];
        } else if (action === "down" && index < state.draft.facets.length - 1) {
          [state.draft.facets[index + 1], state.draft.facets[index]] = [
            state.draft.facets[index],
            state.draft.facets[index + 1],
          ];
        }
        renderFacets();
        updateRequestJson();
      });
    });

    card.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        updateFacetField(index, field, input.value);
      });
    });

    elements.facetList.appendChild(card);
  });
}

function updateFacetField(index, field, value) {
  const facet = state.draft.facets[index];
  if (!facet) return;

  if (field === "filterValues") {
    facet.filterValues = value.split("\n").map((v) => v.trim()).filter(Boolean);
  } else if (field === "additionalType") {
    facet.additionalType = value.split(",").map((v) => v.trim()).filter(Boolean);
  } else if (field === "count") {
    facet.count = value ? Number(value) : undefined;
  } else if (field?.startsWith("responseNames.")) {
    const key = field.split(".")[1];
    facet.responseNames = facet.responseNames || {};
    facet.responseNames[key] = value;
  } else {
    facet[field] = value;
  }
  updateRequestJson();
}

function buildRequestBody() {
  const searchRequest = {
    project: [state.settings.project],
    facets: state.draft.facets
      .map((facet) => {
        const mapped = {
          name: facet.name || undefined,
          responseName: facet.responseName || undefined,
          responseNames: facet.responseNames || undefined,
          filterValues: facet.filterValues?.length ? facet.filterValues : undefined,
          additionalType: facet.additionalType?.length ? facet.additionalType : undefined,
          orderBy: facet.orderBy || undefined,
          orderDirection: facet.orderDirection || undefined,
          count: facet.count || undefined,
        };

        if (facet.name === "categoryTree" || facet.name === "combinedTypeTree") {
          mapped.excludeRedundant = true;
        }
        return mapped;
      })
      .filter((facet) => facet.name),
  };

  state.draft.filters.forEach((filter) => {
    if (filter.type === "combinedTypeTree") {
      searchRequest.combinedTypeTree = filter.values;
    } else if (filter.type === "categoryTree") {
      searchRequest.categoryTree = filter.values;
    }
  });

  return {
    name: state.draft.name,
    description: state.draft.description,
    scheduleStrategy: state.draft.scheduleStrategy,
    searchRequest,
  };
}

function updateRequestJson() {
  const requestBody = buildRequestBody();
  state.responses.request = requestBody;
  elements.requestJson.textContent = JSON.stringify(requestBody, null, 2);
}

function setResponseJson(target, data) {
  target.textContent = data ? JSON.stringify(data, null, 2) : "";
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

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  tabContents.forEach((content) => content.classList.toggle("active", content.id === `tab-${tabName}`));
}

async function loadViews() {
  try {
    showLoading();
    const data = await apiRequest("/search/views", { method: "GET" });
    state.views = Array.isArray(data) ? data : [];
    renderViews();
  } catch (error) {
    state.views = [];
    renderViews();
    setResponseJson(elements.responseJson, error);
  } finally {
    hideLoading();
  }
}

async function loadSelectedView() {
  if (!state.selectedViewId) return;
  try {
    showLoading();
    const data = await apiRequest(`/search/views/${state.selectedViewId}`, { method: "GET" });
    state.responses.response = data;
    setResponseJson(elements.responseJson, data);
    applyViewToDraft(data);
    switchTab("draft");
  } catch (error) {
    setResponseJson(elements.responseJson, error);
  } finally {
    hideLoading();
  }
}

function applyViewToDraft(view) {
  state.draft.name = view.name || "";
  state.draft.description = view.description || "";
  state.draft.scheduleStrategy = view.scheduleStrategy || "Daily";
  
  // Reset filters
  state.draft.filters = [];
  
  // Add combinedTypeTree filter if present
  if (view.searchRequest?.combinedTypeTree?.length) {
    state.draft.filters.push({
      type: "combinedTypeTree",
      values: view.searchRequest.combinedTypeTree,
    });
  }
  
  // Add categoryTree filter if present
  if (view.searchRequest?.categoryTree?.length) {
    state.draft.filters.push({
      type: "categoryTree",
      values: view.searchRequest.categoryTree,
    });
  }
  
  state.draft.facets = (view.searchRequest?.facets || []).map((facet) => ({
    name: facet.name,
    responseName: facet.responseName,
    responseNames: facet.responseNames,
    filterValues: facet.filterValues || [],
    additionalType: facet.additionalType || [],
    orderBy: facet.orderBy,
    orderDirection: facet.orderDirection,
    count: facet.count,
  }));
  renderDraft();
}

async function createView() {
  try {
    showLoading();
    const requestBody = buildRequestBody();
    const data = await apiRequest("/search/views", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    state.responses.response = data;
    setResponseJson(elements.responseJson, data);
    state.selectedViewId = null;
    await loadViews();
  } catch (error) {
    setResponseJson(elements.responseJson, error);
    hideLoading();
  }
}

async function updateView() {
  if (!state.selectedViewId) return;
  try {
    showLoading();
    const requestBody = buildRequestBody();
    const data = await apiRequest(`/search/views/${state.selectedViewId}`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
    });
    state.responses.response = data;
    setResponseJson(elements.responseJson, data);
    await loadViews();
  } catch (error) {
    setResponseJson(elements.responseJson, error);
    hideLoading();
  }
}

async function deleteView() {
  if (!state.selectedViewId) return;
  if (!confirm("Delete this view?") ) return;
  try {
    showLoading();
    await apiRequest(`/search/views/${state.selectedViewId}`, { method: "DELETE" });
    state.selectedViewId = null;
    await loadViews();
    setResponseJson(elements.responseJson, { message: "Deleted." });
  } catch (error) {
    setResponseJson(elements.responseJson, error);
    hideLoading();
  }
}

async function previewResults() {
  if (!state.selectedViewId) {
    setResponseJson(elements.resultsJson, { message: "Select a view first." });
    return;
  }
  try {
    showLoading();
    const data = await apiRequest("/search", {
      method: "GET",
      query: { viewId: state.selectedViewId },
    });
    state.responses.results = data;
    setResponseJson(elements.resultsJson, data);
    const resultsPanel = document.getElementById("resultsPanel");
    if (resultsPanel) {
      resultsPanel.open = true;
    }
  } catch (error) {
    setResponseJson(elements.resultsJson, error);
  } finally {
    hideLoading();
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text || "");
}

function extractJsonFromText(text) {
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) return null;
  let depth = 0;
  for (let i = firstBrace; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") depth -= 1;
    if (depth === 0) {
      const candidate = text.slice(firstBrace, i + 1);
      try {
        return JSON.parse(candidate);
      } catch (error) {
        return null;
      }
    }
  }
  return null;
}

async function sendChatMessage(message) {
  if (!state.settings.openaiKey) {
    updateSettingsStatus("Please save OpenAI API key first.", true);
    return;
  }
  const systemPrompt = `You are AIViewManager, a helpful assistant that guides users to create or edit discover.swiss SearchViewRequest JSON.\n\nRules:\n- Ask clarifying questions if required.\n- Provide suggestions for scheduleStrategy and filters.\n- If the user asks to update the draft, respond with a JSON object for SearchViewRequest.\n- Use combinedTypeTree or categoryTree only.\n- For facets named categoryTree or combinedTypeTree, set excludeRedundant to true.\n- Keep response concise.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...state.chat.messages,
    { role: "user", content: message },
  ];

  state.chat.messages.push({ role: "user", content: message });
  renderChat();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.settings.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: state.settings.openaiModel || "gpt-4o-mini",
        messages,
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw data;
    }

    const assistantMessage = data.choices?.[0]?.message?.content || "";
    state.chat.messages.push({ role: "assistant", content: assistantMessage });
    state.chat.lastAssistantMessage = assistantMessage;
    renderChat();
  } catch (error) {
    state.chat.messages.push({ role: "assistant", content: `Error: ${JSON.stringify(error)}` });
    renderChat();
  }
}

function applyChatDraft() {
  if (!state.chat.lastAssistantMessage) return;
  const json = extractJsonFromText(state.chat.lastAssistantMessage);
  if (!json) {
    updateSettingsStatus("No JSON found in the last response.", true);
    return;
  }

  state.draft.name = json.name || state.draft.name;
  state.draft.description = json.description || state.draft.description;
  state.draft.scheduleStrategy = json.scheduleStrategy || state.draft.scheduleStrategy;
  
  const searchRequest = json.searchRequest || {};
  state.draft.filters = [];
  
  if (searchRequest.combinedTypeTree?.length) {
    state.draft.filters.push({
      type: "combinedTypeTree",
      values: searchRequest.combinedTypeTree,
    });
  }
  
  if (searchRequest.categoryTree?.length) {
    state.draft.filters.push({
      type: "categoryTree",
      values: searchRequest.categoryTree,
    });
  }
  
  if (Array.isArray(searchRequest.facets)) {
    state.draft.facets = searchRequest.facets.map((facet) => ({
      name: facet.name,
      responseName: facet.responseName,
      responseNames: facet.responseNames,
      filterValues: facet.filterValues || [],
      additionalType: facet.additionalType || [],
      orderBy: facet.orderBy,
      orderDirection: facet.orderDirection,
      count: facet.count,
    }));
  }
  renderDraft();
}

function wireEvents() {
  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.settings.apiKey = elements.dsApiKey.value.trim();
    state.settings.project = elements.dsProject.value.trim();
    state.settings.openaiKey = elements.openaiKey.value.trim();
    state.settings.openaiModel = elements.openaiModel.value.trim() || "gpt-4o-mini";
    state.settings.env = elements.envSelect.value;
    saveSettings();
    updateSettingsStatus("Settings saved.");
    loadViews();
  });

  elements.refreshViewsBtn.addEventListener("click", loadViews);
  elements.loadViewBtn.addEventListener("click", loadSelectedView);
  elements.deleteViewBtn.addEventListener("click", deleteView);

  elements.draftName.addEventListener("input", () => {
    state.draft.name = elements.draftName.value;
    updateRequestJson();
  });

  elements.draftDescription.addEventListener("input", () => {
    state.draft.description = elements.draftDescription.value;
    updateRequestJson();
  });

  elements.draftSchedule.addEventListener("change", () => {
    state.draft.scheduleStrategy = elements.draftSchedule.value;
    updateRequestJson();
  });

  elements.addFilterBtn.addEventListener("click", () => {
    state.draft.filters.push({
      type: "combinedTypeTree",
      values: [],
    });
    renderFilters();
  });

  elements.addFacetBtn.addEventListener("click", () => {
    state.draft.facets.push({
      name: "",
      responseName: "",
      responseNames: { de: "", en: "" },
      filterValues: [],
      additionalType: [],
      orderBy: "",
      orderDirection: "",
      count: undefined,
    });
    renderFacets();
  });

  elements.createViewBtn.addEventListener("click", createView);
  elements.updateViewBtn.addEventListener("click", updateView);
  elements.previewResultsBtn.addEventListener("click", previewResults);

  elements.copyRequestBtn.addEventListener("click", () =>
    copyToClipboard(elements.requestJson.textContent)
  );
  elements.copyResponseBtn.addEventListener("click", () =>
    copyToClipboard(elements.responseJson.textContent)
  );

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = elements.chatMessage.value.trim();
    if (!message) return;
    elements.chatMessage.value = "";
    sendChatMessage(message);
  });

  elements.applyChatDraftBtn.addEventListener("click", applyChatDraft);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
}

function init() {
  loadSettings();
  renderSettings();
  renderDraft();
  wireEvents();

  document.querySelectorAll("details.panel").forEach((panel) => {
    panel.addEventListener("toggle", () => {
      if (!panel.open) return;
      document.querySelectorAll("details.panel").forEach((other) => {
        if (other !== panel) {
          other.open = false;
        }
      });
    });
  });
}

init();
