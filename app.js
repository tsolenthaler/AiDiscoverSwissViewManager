const CONFIGS_KEY = "aiviewmanager.configs";
const CURRENT_CONFIG_KEY = "aiviewmanager.current_config";

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
    openaiRequest: {},
  },
};

const elements = {
  refreshViewsBtn: document.getElementById("refreshViewsBtn"),
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
  copyOpenaiRequestBtn: document.getElementById("copyOpenaiRequestBtn"),
  requestJson: document.getElementById("requestJson"),
  openaiRequestJson: document.getElementById("openaiRequestJson"),
  responseJson: document.getElementById("responseJson"),
  resultsJson: document.getElementById("resultsJson"),
  copyResponseBtn: document.getElementById("copyResponseBtn"),
  editorViewTitle: document.getElementById("editorViewTitle"),
  loadingOverlay: document.getElementById("loadingOverlay"),
};

let tabs = [];
let tabContents = [];

function showLoading() {
  elements.loadingOverlay.classList.add("active");
}

function hideLoading() {
  elements.loadingOverlay.classList.remove("active");
}

function renderLivePreview() {
  const liveContainer = document.getElementById("liveContainer");
  if (!liveContainer) return;

  liveContainer.innerHTML = "";
  
  // Check if results exist
  const results = state.responses.results;
  const values = results?.values || [];
  const count = results?.count ?? 0;
  
  if (!values || values.length === 0) {
    liveContainer.innerHTML = "<div class=\"status\">No results. Run preview first.</div>";
    return;
  }
  
  // Display count
  const countDiv = document.createElement("div");
  countDiv.style.marginBottom = "16px";
  countDiv.style.padding = "12px";
  countDiv.style.backgroundColor = "#e0f2fe";
  countDiv.style.borderRadius = "8px";
  countDiv.style.fontWeight = "600";
  countDiv.textContent = `Results Count: ${count}`;
  liveContainer.appendChild(countDiv);
  
  // Create table for results display with only specific columns
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "16px";
  
  // Create header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.style.borderBottom = "2px solid var(--border)";
  headerRow.style.backgroundColor = "#f3f4f6";
  
  ["name", "identifier", "additionalType"].forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    th.style.padding = "12px";
    th.style.textAlign = "left";
    th.style.fontWeight = "600";
    th.style.wordBreak = "break-word";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement("tbody");
  values.forEach((item, index) => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid var(--border)";
    if (index % 2 === 0) {
      row.style.backgroundColor = "#f9fafb";
    }
    
    ["name", "identifier", "additionalType"].forEach(key => {
      const cell = document.createElement("td");
      const value = item[key];
      
      if (value === null || value === undefined) {
        cell.textContent = "-";
      } else if (typeof value === "object") {
        cell.textContent = JSON.stringify(value);
        cell.style.fontSize = "0.85em";
        cell.style.color = "#666";
      } else {
        cell.textContent = String(value);
      }
      
      cell.style.padding = "12px";
      cell.style.wordBreak = "break-word";
      row.appendChild(cell);
    });
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  liveContainer.appendChild(table);
}

function renderFacetsPreview() {
  const facetsContainer = document.getElementById("facetsContainer");
  if (!facetsContainer) return;

  facetsContainer.innerHTML = "";
  
  // Check if results exist
  const results = state.responses.results;
  let facets = results?.facets || [];
  
  // Convert object to array if necessary
  if (facets && typeof facets === "object" && !Array.isArray(facets)) {
    facets = Object.values(facets);
  }
  
  facets = Array.isArray(facets) ? facets : [];
  
  if (!facets || facets.length === 0) {
    facetsContainer.innerHTML = "<div class=\"status\">No facets in response. Load results first.</div>";
    return;
  }
  
  // Create table for facets display
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "8px";
  
  // Create header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.style.borderBottom = "2px solid var(--border)";
  headerRow.style.backgroundColor = "#f3f4f6";
  
  ["Facet Name", "Filter Property", "Option Name", "Option Value", "Count"].forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    th.style.padding = "10px";
    th.style.textAlign = "left";
    th.style.fontWeight = "600";
    th.style.fontSize = "0.9rem";
    th.style.wordBreak = "break-word";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement("tbody");
  let rowIndex = 0;
  
  facets.forEach((facet) => {
    const facetName = facet.name || "-";
    const filterPropertyName = facet.filterPropertyName || "-";
    const options = facet.options || [];
    
    if (options.length === 0) {
      // Show facet with no options
      const row = document.createElement("tr");
      row.style.borderBottom = "1px solid var(--border)";
      if (rowIndex % 2 === 0) {
        row.style.backgroundColor = "#f9fafb";
      }
      
      const cells = [facetName, filterPropertyName, "-", "-", "-"];
      cells.forEach((cellValue) => {
        const cell = document.createElement("td");
        cell.textContent = cellValue;
        cell.style.padding = "10px";
        cell.style.wordBreak = "break-word";
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
      rowIndex++;
    } else {
      // Show facet with options
      options.forEach((option, optionIndex) => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";
        if (rowIndex % 2 === 0) {
          row.style.backgroundColor = "#f9fafb";
        }
        
        // Facet name (only on first option)
        const facetNameCell = document.createElement("td");
        facetNameCell.textContent = optionIndex === 0 ? facetName : "";
        facetNameCell.style.padding = "10px";
        facetNameCell.style.fontWeight = optionIndex === 0 ? "600" : "normal";
        row.appendChild(facetNameCell);
        
        // Filter property name (only on first option)
        const filterPropCell = document.createElement("td");
        filterPropCell.textContent = optionIndex === 0 ? filterPropertyName : "";
        filterPropCell.style.padding = "10px";
        row.appendChild(filterPropCell);
        
        // Option name
        const optionNameCell = document.createElement("td");
        optionNameCell.textContent = option.name || "-";
        optionNameCell.style.padding = "10px";
        row.appendChild(optionNameCell);
        
        // Option value
        const optionValueCell = document.createElement("td");
        optionValueCell.textContent = option.value || "-";
        optionValueCell.style.padding = "10px";
        row.appendChild(optionValueCell);
        
        // Count
        const countCell = document.createElement("td");
        countCell.textContent = option.count !== undefined ? option.count : "-";
        countCell.style.padding = "10px";
        countCell.style.textAlign = "center";
        row.appendChild(countCell);
        
        tbody.appendChild(row);
        rowIndex++;
      });
    }
  });
  
  table.appendChild(tbody);
  facetsContainer.appendChild(table);
}

function getBaseUrl() {
  return state.settings.env === "prod"
    ? "https://api.discover.swiss/info/v2"
    : "https://api.discover.swiss/test/info/v2";
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
      updateEditorViewTitle();
      loadSelectedView();
    });
    elements.viewsList.appendChild(item);
  });
}

function updateEditorViewTitle() {
  if (state.selectedViewId) {
    const selectedView = state.views.find((v) => v.id === state.selectedViewId);
    if (selectedView) {
      elements.editorViewTitle.textContent = ` · ${selectedView.name || selectedView.id}`;
    }
  } else {
    elements.editorViewTitle.textContent = "";
  }
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
    const card = document.createElement("details");
    card.className = "filter-card";
    const headerTitle = filter.type ? `Filter ${filter.type}` : `Filter ${index + 1}`;
    card.innerHTML = `
      <summary class="card-summary">
        <h4>${headerTitle}</h4>
        <div class="button-row">
          <button class="secondary" data-action="up">Up</button>
          <button class="secondary" data-action="down">Down</button>
          <button class="danger" data-action="remove">Remove</button>
        </div>
      </summary>
      <div class="card-body grid-2">
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
      button.addEventListener("click", (event) => {
        event.preventDefault();
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
    const card = document.createElement("details");
    card.className = "facet-card";
    const headerTitle = facet.name ? `Facet ${facet.name}` : `Facet ${index + 1}`;
    card.innerHTML = `
      <summary class="card-summary">
        <strong>${headerTitle}</strong>
        <div class="button-row">
          <button class="secondary" data-action="up">Up</button>
          <button class="secondary" data-action="down">Down</button>
          <button class="danger" data-action="remove">Remove</button>
        </div>
      </summary>
      <div class="card-body grid-2">
        <label>
          <span>Name</span>
          <input data-field="name" value="${facet.name || ""}" />
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
      button.addEventListener("click", (event) => {
        event.preventDefault();
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
  
  // Update OpenAI request display if available
  if (state.responses.openaiRequest && Object.keys(state.responses.openaiRequest).length > 0) {
    elements.openaiRequestJson.textContent = JSON.stringify(state.responses.openaiRequest, null, 2);
  }
}

function setResponseJson(target, data) {
  target.textContent = data ? JSON.stringify(data, null, 2) : "";
}

function switchTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  tabContents.forEach((content) => content.classList.toggle("active", content.id === `tab-${tabName}`));
  
  if (tabName === "live") {
    renderLivePreview();
  } else if (tabName === "facets") {
    renderFacetsPreview();
  }
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
    updateEditorViewTitle();
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
    updateEditorViewTitle();
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
    updateEditorViewTitle();
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
    switchTab("live");
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

function wireEvents() {
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

  if (elements.copyRequestBtn) {
    elements.copyRequestBtn.addEventListener("click", () =>
      copyToClipboard(elements.requestJson.textContent)
    );
  }
  
  if (elements.copyOpenaiRequestBtn) {
    elements.copyOpenaiRequestBtn.addEventListener("click", () =>
      copyToClipboard(elements.openaiRequestJson.textContent)
    );
  }
  
  if (elements.copyResponseBtn) {
    elements.copyResponseBtn.addEventListener("click", () =>
      copyToClipboard(elements.responseJson.textContent)
    );
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
}

function init() {
  loadSettings();
  renderDraft();
  
  // Initialize tabs and tabContents before wireEvents
  tabs = document.querySelectorAll(".tab");
  tabContents = document.querySelectorAll(".tab-content");
  
  wireEvents();
  
  // Check if there's a draft from the chatbot
  const chatbotDraft = localStorage.getItem("aiviewmanager.chatbot.draft");
  if (chatbotDraft) {
    try {
      const json = JSON.parse(chatbotDraft);
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
          responseNames: facet.responseNames,
          filterValues: facet.filterValues || [],
          additionalType: facet.additionalType || [],
          orderBy: facet.orderBy,
          orderDirection: facet.orderDirection,
          count: facet.count,
        }));
      }
      renderDraft();
      localStorage.removeItem("aiviewmanager.chatbot.draft");
      updateSettingsStatus("Draft vom Chatbot geladen!", false);
    } catch (error) {
      console.error("Error loading chatbot draft:", error);
    }
  }
  
  // Save state for chatbot context
  window.addEventListener("beforeunload", () => {
    const stateToSave = {
      selectedViewId: state.selectedViewId,
      views: state.views,
    };
    localStorage.setItem("aiviewmanager.state", JSON.stringify(stateToSave));
  });

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

  const previewTabs = document.querySelectorAll("#previewTabs .tab");
  previewTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      previewTabs.forEach((t) => t.classList.toggle("active", t === tab));
      const tabContents = document.querySelectorAll("#resultsPanel .tab-content");
      tabContents.forEach((content) => content.classList.toggle("active", content.id === `tab-${tabName}`));
      
      if (tabName === "live") {
        renderLivePreview();
      }
    });
  });
}

init();
