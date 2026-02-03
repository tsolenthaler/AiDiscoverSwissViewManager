# AIViewManager Web App

AIViewManager is a chatbot-based single-page web app for managing discover.swiss Views. It supports offline credential storage via LocalStorage, view listing, creation/editing, and API response inspection.

## Project Structure

The app is a static GitHub Pages-ready site:

- **index.html**: Layout and UI structure
- **styles.css**: Styling and layout
- **app.js**: Application logic (settings, API calls, chatbot, view draft builder)

## Usage

Open [index.html](index.html) in a browser (or deploy the folder to GitHub Pages). Then:

1. Enter discover.swiss API key + project name
2. Enter OpenAI API key + model
3. Save settings (stored locally in your browser)
4. Load views, create/update views, or use the chatbot to draft JSON

## Notes

- Credentials are stored locally (LocalStorage) and never sent to any server other than the configured APIs.
- The chatbot uses the OpenAI API directly from the browser.

## API Reference

The application interacts with the discover.swiss API to manage views. For detailed API documentation, refer to the [discover.swiss API documentation](https://docs.discover.swiss).

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.