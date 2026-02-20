# AIViewManager Web App

AIViewManager is a web app for managing discover.swiss Views. It supports offline credential storage via LocalStorage, view listing, creation/editing, and API response inspection with OpenAI integration.

## Project Structure

The app is a static GitHub Pages-ready site:

- **index.html**: Main view manager page with UI and structure
- **chatbot.html**: Dedicated chatbot page for AI-assisted view creation
- **styles.css**: Global styling and layout
- **chatbot.css**: Chatbot-specific styles
- **app.js**: Main application logic (settings, API calls, view draft builder)
- **chatbot.js**: Chatbot-specific logic with OpenAI integration

## Features

### View Management
- List all discover.swiss Views
- Load, edit, create, update, and delete Views
- Draft editor with Name, Description, Schedule Strategy
- Filters (combinedTypeTree, categoryTree, etc.)
- Facets with advanced configuration (language support, ordering, count)
- Live preview of search results

### API Request Inspection
- **Search Request Tab**: View the discover.swiss SearchViewRequest JSON being sent
- **OpenAI Request Tab**: Inspect the exact request payload sent to OpenAI API
- Copy buttons for both request types for debugging

### AI-Powered View Builder (Dedicated Chatbot Page)
- Separate chatbot page for focused AI interaction
- Chat with OpenAI-powered AIViewManager bot
- Bot provides guidance based on discover.swiss API documentation
- Automatic JSON suggestion for view creation
- One-click transfer of AI-suggested configurations to main view manager
- Context loading from selected views in the main manager
- Persistent chat history across sessions

### Credential Management
- Secure LocalStorage-based credential storage
- Support for discover.swiss API key and project name
- OpenAI API key and model configuration
- Environment selection (Test/Production)

## Usage

Open [index.html](index.html) in a browser (or deploy to GitHub Pages):

1. **Configure Settings**:
   - Enter discover.swiss API key + project name
   - Enter OpenAI API key + model (e.g., gpt-4o-mini)
   - Select environment (Test or Production)
   - Click "Save settings"

2. **Manage Views**:
   - Click "Load views" to list available Views
   - Select a View and click "Load selected" to edit
   - In a filter/facet card click "Copy", then load another view and use "Add copy filter" or "Add copy facet"
   - Use the Draft Editor to modify properties
   - Click "Update view" to save changes
   - Click "💬 Zum Chatbot" in the header to open the dedicated chatbot page
   - Configure your OpenAI API key and settings in the chatbot page sidebar
   - (Optional) Click "Load from View Manager" to import context from a selected view
   - Ask the bot for help creating or configuring Views
   - Example: "Create a view for luxury hotels with categories and amenities"
   - The bot will provide a JSON suggestion
   - Click "Apply JSON to View Manager" to transfer the configuration
   - You'll be redirected back to the main page with the draft pre-populated
   - Edit and save the View as neededhotels with categories and amenities"
   - The bot will provide a JSON suggestion
   - Click "Apply JSON from last reply" to auto-populate the draft
   - You can then edit and save the View

4. **Inspect API Requests**:
   - Go to the **Request Tab** in the Editor
   - View **Search Request** - the discover.swiss API request body
   - View **OpenAI Request** - the exact OpenAI Chat API request (messages, model, temperature, etc.)
   - Use this for debugging or understanding how the bot is configured

## Notes

- Credentials are stored locally (LocalStorage) and never sent to any server other than the configured APIs.
- The chatbot uses the OpenAI API directly from the browser.
- The application is fully offline-capable once loaded; no backend server required.

## API Reference

The application interacts with the discover.swiss API to manage views. For detailed API documentation, refer to the [discover.swiss API documentation](https://docs.discover.swiss).

### discover.swiss SearchViewRequest Structure
- **name**: View name
- **description**: View description
- **scheduleStrategy**: EveryHour, Every6Hours, Every12Hours, Daily, Weekly
- **searchRequest**: Contains project[], facets[], combinedTypeTree[], categoryTree[]
  - **facets**: Aggregation configuration with name, responseName, responseNames (language map), filterValues[], additionalType[], orderBy, orderDirection, count
  - **combinedTypeTree / categoryTree**: Filter values (use one or the other)

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.