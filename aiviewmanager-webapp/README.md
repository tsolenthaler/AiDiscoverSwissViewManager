# AIViewManager Web App

AIViewManager is a chatbot designed to manage views for discover.swiss. This web application allows users to create, edit, and manage views efficiently while securely storing API keys and project information.

## Project Structure

The project consists of the following files and directories:

- **src/app.ts**: Entry point of the application. Initializes the AIViewManager chatbot and handles user interactions.
- **src/components/index.ts**: Exports UI components for creating and editing views, displaying existing views, and managing API keys.
- **src/services/index.ts**: Contains functions for interacting with the discover.swiss API, including methods for listing, creating, updating, and deleting views.
- **src/storage/index.ts**: Manages offline storage of the API key and project information, providing secure save and retrieve functions.
- **src/types/index.ts**: Exports TypeScript interfaces and types used throughout the application, including definitions for views, API responses, and configuration settings.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd aiviewmanager-webapp
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```

This will launch the web app, allowing you to interact with the AIViewManager chatbot.

## API Reference

The application interacts with the discover.swiss API to manage views. For detailed API documentation, refer to the [discover.swiss API documentation](https://docs.discover.swiss).

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.