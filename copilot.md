# GitHub Copilot Prompt: AIViewManager - Views Manager Chatbot

## Project Overview

Create a GitHub Pages web application called **AIViewManager** - a chatbot-based interface that manages Views from the discover.swiss platform. This is a single-page webapp with offline local storage capabilities for all credentials.

---

## Core Functionalities

### 1. Credential Management (Settings Page)
Users can input and store locally (offline) on their device:
- **discover.swiss API Key** (`Ocp-Apim-Subscription-Key`)
- **discover.swiss Project Name** (e.g., `tso-test`)
- **OpenAI API Key**
- Credentials are stored in browser local storage (no server upload)

### 2. View Listing
- Display all existing Views in the discover.swiss project
- Show basic info: View name, description, schedule strategy
- Allow selection to view detailed configuration

### 3. Create & Edit Views
Provide chatbot interface to create new Views or edit existing ones with:

#### Basic Information
- **Name**: Define/edit the View name
- **Description**: Define/edit the View description

#### Schedule Strategy
Set one of these options:
- `EveryHour`
- `Every6Hours`
- `Every12Hours`
- `Daily`
- `Weekly`

Reference: https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewRequest/#properties

#### Filters
Users can set filters in two ways:

**By Type (Typenbaum):**
- Configure `combinedTypeTree` filter
- Example: `Thing|Place|LocalBusiness|FoodEstablishment`

**By Category (Kategorienbaum):**
- Configure `categoryTree` filter

#### Facets Configuration
Enable detailed facet management:
- **responseNames**: Set multilingual names for each facet (DE and EN)
- **excludeRedundant**: Automatically set to `true` for `categoryTree` and `combinedTypeTree` facets
- **orderBy**: Set field to order by (e.g., "name")
- **orderDirection**: Set sort direction (`asc` or `desc`)
- **Reorder Facets**: Allow moving facets up/down to change their order

### 4. View Configuration Display
- Show the complete View configuration in JSON format (Response Body)
- Display both the request structure and API response
- Allow copy-to-clipboard functionality

### 5. API Feedback & Results
- Return complete API response after each operation (Create, Update, Delete)
- Display View search results when user requests preview
- Show error messages and HTTP status codes

### 6. Chatbot Interface
- Conversational AI-powered chatbot using OpenAI API
- Guide users through View creation and editing step-by-step
- Provide helpful suggestions and validation
- Use stored OpenAI API Key for all LLM requests

---

## API Endpoints & Documentation

### Base URLs

**Test Environment:**
```
https://api.discover.swiss/test/info/v2
```

**Production Environment:**
```
https://api.discover.swiss/info/v2
```

### Available Endpoints

| Endpoint | Operation | Request | Response |
|---|---|---|---|
| GET `/search/views` | Get all search views | - | [SearchViewResponse](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewResponse/)[] |
| GET `/search/views/{id}` | Get search view by Id | - | [SearchViewResponse](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewResponse/) |
| POST `/search/views` | Create search view | [SearchViewRequest](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewRequest/) | [SearchViewResponse](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewResponse/) |
| PUT `/search/views/{id}` | Update search view | [SearchViewRequest](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewRequest/) | [SearchViewResponse](https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewResponse/) |
| DELETE `/search/views/{id}` | Delete search view by Id | - | - |

### Documentation References
- View Concepts: https://docs.discover.swiss/dev/concepts/infocenter/view/
- SearchViewRequest: https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewRequest/
- SearchViewSearchRequest: https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/SearchViewSearchRequest/#searchviewsearchrequest
- FacetViewRequest: https://docs.discover.swiss/dev/reference/dataschema/definition/infocenter-classes/FacetViewRequest/

---

## API Examples

### 1. GET search/views - List All Views

**Endpoint:**
```
https://api.discover.swiss/test/info/v2/search/views?project=tso-test
```

**Headers:**
```
Ocp-Apim-Subscription-Key: {apiKey}
Accept-Language: de
```

**Response:** Array of SearchViewResponse objects

---

### 2. POST search/views - Create New View

**Endpoint:**
```
https://api.discover.swiss/test/info/v2/search/views?project=tso-test
```

**Headers:**
```
Ocp-Apim-Subscription-Key: {apiKey}
Accept-Language: de
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "TEST Place FoodEstablishment",
  "description": "Gastronomie",
  "scheduleStrategy": "Daily",
  "searchRequest": {
    "project": [
      "tso-test"
    ],
    "combinedTypeTree": [
      "Thing|Place|LocalBusiness|FoodEstablishment"
    ],
    "facets": [
      {
        "name": "containedInPlace/id",
        "responseNames": {
          "de": "Ferienregion",
          "en": "vacation area"
        },
        "filterValues": [
          "ds_braunwald_toedigebiet",
          "ds_elm_sernftal",
          "ds_glarus_kloental",
          "ds_glarusnord_walensee",
          "ds_grosstal_mettmen"
        ],
        "orderBy": "name",
        "orderDirection": "asc"
      },
      {
        "name": "leafType",
        "responseNames": {
          "de": "Gastronomie-Typ",
          "en": "Type of gastronomy"
        },
        "orderBy": "name",
        "orderDirection": "asc",
        "count": 100
      },
      {
        "name": "tag",
        "responseNames": {
          "de": "Saisonalität",
          "en": "Seasonality"
        },
        "additionalType": ["seasonality"]
      },
      {
        "name": "tag",
        "additionalType": ["accessibility"],
        "responseNames": {
          "de": "Zugänglichkeit",
          "en": "Accessibility"
        }
      },
      {
        "name": "campaignTag",
        "responseName": "Weitere Filter",
        "filterValues": [
          "vgl_label-kinderregion",
          "vgl_label-gl-gutschein",
          "vgl_label-unesco",
          "vgl_label-glarnerlandpass"
        ],
        "orderBy": "name",
        "orderDirection": "asc"
      }
    ]
  }
}
```

---

### 3. GET search/views/{id} - Get Single View

**Endpoint:**
```
https://api.discover.swiss/test/info/v2/search/views/tso-7595dae
```

**Headers:**
```
Ocp-Apim-Subscription-Key: {apiKey}
Accept-Language: de
```

**Response:** Single SearchViewResponse object

---

### 4. PUT search/views/{id} - Update Search View

**Endpoint:**
```
https://api.discover.swiss/test/info/v2/search/views/tso-7595dae
```

**Headers:**
```
Ocp-Apim-Subscription-Key: {apiKey}
Accept-Language: de
Content-Type: application/json
```

**Request Body:** Same structure as POST (SearchViewRequest)

**Response:** Updated SearchViewResponse object

---

### 5. DELETE search/views/{id} - Delete Search View

**Endpoint:**
```
https://api.discover.swiss/test/info/v2/search/views/tso-7595dae
```

**Headers:**
```
Ocp-Apim-Subscription-Key: {apiKey}
Accept-Language: de
```

---

## Terminology & Mapping

| German Term | English Term | API Field |
|---|---|---|
| Typenbaum | Type Tree | `combinedTypeTree` |
| Kategorienbaum | Category Tree | `categoryTree` |

---

## Technical Architecture

### Frontend Stack
- **Framework:** React, Vue, or similar SPA framework
- **Hosting:** GitHub Pages
- **Storage:** Browser LocalStorage for credentials
- **Language:** TypeScript (recommended)

### Key Components
1. **Settings Page:** Credential input and storage
2. **View List Page:** Display all views from API
3. **Chatbot Interface:** OpenAI-powered conversation for creating/editing views
4. **View Configuration Panel:** Display JSON request/response bodies
5. **Search Results Viewer:** Preview view results

### Offline Storage
- Store OpenAI API Key locally
- Store discover.swiss API Key locally
- Store discover.swiss Project name locally
- Use browser's LocalStorage or IndexedDB
- **No server-side storage of sensitive data**

### Error Handling
- Validate all user inputs before API calls
- Display clear error messages from API responses
- Handle network errors gracefully
- Show HTTP status codes and response details

---

## User Workflows

### Workflow 1: First-Time Setup
1. User visits GitHub Pages webapp
2. Goes to Settings page
3. Enters discover.swiss API Key
4. Enters discover.swiss Project name
5. Enters OpenAI API Key
6. Saves (stored locally)

### Workflow 2: Create New View
1. User opens chatbot interface
2. Types: "Create new view"
3. Chatbot guides through step-by-step:
   - View name
   - Description
   - Schedule strategy
   - Filter type (Typenbaum or Kategorienbaum)
   - Filter values
   - Add facets with DE/EN names
   - Set orderBy and orderDirection per facet
4. Review configuration
5. Chatbot sends POST request to API
6. Shows API response and confirmation

### Workflow 3: Edit Existing View
1. View List page shows all views
2. User selects a view to edit
3. Chatbot loads current configuration
4. User can modify any field
5. Chatbot shows differences
6. User confirms changes
7. Chatbot sends PUT request to API
8. Shows API response and confirmation

### Workflow 4: Delete View
1. User selects view from list
2. Requests deletion
3. Chatbot confirms action
4. Sends DELETE request to API
5. Shows confirmation

### Workflow 5: View Configuration & Results
1. User selects a view
2. Can view:
   - Complete JSON configuration (Request Body)
   - API response structure
   - Search results (if requested)
3. Copy-to-clipboard for configuration

---

## Feature Checklist

- [ ] GitHub Pages deployment
- [ ] Settings page for credentials (API Keys, Project)
- [ ] Local storage of credentials (offline)
- [ ] View listing from API
- [ ] Chatbot interface powered by OpenAI
- [ ] Create view workflow
- [ ] Edit view workflow
- [ ] Delete view workflow
- [ ] View configuration display (JSON)
- [ ] API response display
- [ ] Search results preview
- [ ] Facet management (multilingual names, ordering, reordering)
- [ ] Filter configuration (Type/Category)
- [ ] Schedule strategy selection
- [ ] Error handling and validation
- [ ] Responsive UI design
