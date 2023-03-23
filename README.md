# Node Terminal Formatter
A simple single-line LSP which serves for advanced CLI usage.

## Usage
Override  `suggest` and `insertSuggestion` methods `LSP` class.

- `suggest` method should return a list of suggestions, which triggers when user inputs an alphbetical key.
- `insertSuggestion` method should elaborately define how to insert a suggestion into the terminal, given `this.suggestions` and `this.index`, which triggers when user presses `Tab` key.

## Demo
See `index.ts` for a simple demo, and run `npm run test` to see the result. It listens for 3 keywords: `help`, `exit` and `update`. When user inputs `help`, it will show a dummy help message. When user inputs `exit`, it will exit the program. When user inputs `update`, it will show a dummy update message, which sleeps(asynchronously) for 2 secs.
