# Taskasaurus

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/tangent.taskasaurus?label=VS%20Code%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=tangent.taskasaurus)

A VS Code extension that displays your tasks in the status bar for one-click launching. Perfect for repositories with many build, test, lint, and run tasks.

![Taskasaurus Demo](https://github.com/tangentlin/taskasaurus/raw/HEAD/docs/demo.gif)

## Features

- **Status bar task launcher** - Tasks appear directly in the status bar for quick access
- **Automatic grouping** - Tasks with colon-separated names (e.g., `Test: unit`, `Test: e2e`) are grouped together
- **Expandable groups** - Click a group to expand it, click again to collapse
- **One-click execution** - Click any task to run it immediately
- **Icon support** - Display icons next to your tasks using VS Code's built-in codicons
- **Multi-root workspace support** - Works with multiple workspace folders, disambiguating duplicate task names
- **Hide tasks** - Keep utility tasks out of the status bar while still accessible via Command Palette

## Installation

**[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=tangent.taskasaurus)**

Or install manually:

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Taskasaurus"
4. Click **Install**

## Usage

### Basic Usage

Once installed, Taskasaurus automatically displays your workspace tasks in the left side of the status bar:

![Collapsed View](https://github.com/tangentlin/taskasaurus/raw/HEAD/docs/collapsed.png)

- **Click a task** to run it
- **Click a group** (indicated by a chevron) to expand it and see its children

![Expanded View](https://github.com/tangentlin/taskasaurus/raw/HEAD/docs/expanded.png)

### Task Grouping

Taskasaurus automatically groups tasks that share a common prefix separated by a colon. For example:

```json
{
  "version": "2.0.0",
  "tasks": [
    { "label": "Package", "type": "shell", "command": "npm run build" },
    { "label": "Run", "type": "shell", "command": "npm start" },
    { "label": "Test: unit", "type": "shell", "command": "npm run test:unit" },
    { "label": "Test: e2e", "type": "shell", "command": "npm run test:e2e" },
  ]
}
```

This creates:

- `Package` - standalone task
- `Run` - standalone task
- `Test` - expandable group containing `Test: unit` and `Test: e2e`

> **Note:** Groups are only created when there are 2 or more tasks with the same prefix.

### Adding Icons

Add icons to your tasks using the `icon` property with any [VS Code codicon](https://code.visualstudio.com/api/references/icons-in-labels):

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Package",
      "type": "shell",
      "command": "npm run build",
      "icon": { "id": "build" }
    },
    {
      "label": "Run",
      "type": "shell",
      "command": "npm start",
      "icon": { "id": "run" }
    },
    {
      "label": "Test: unit",
      "type": "shell",
      "command": "npm run test:unit",
      "icon": { "id": "beaker" }
    },
    {
      "label": "Test: e2e",
      "type": "shell",
      "command": "npm run test:e2e",
      "icon": { "id": "compass" }
    }
  ]
}
```

### Hiding Tasks

Keep utility tasks out of the status bar by adding `"hide": true`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build",
      "type": "shell",
      "command": "npm run build"
    },
    {
      "label": "internal-watcher",
      "type": "shell",
      "command": "npm run watch",
      "hide": true
    }
  ]
}
```

Hidden tasks remain accessible via the Command Palette (`Tasks: Run Task`) but won't clutter your status bar.

### Multi-Root Workspaces

When working with multiple workspace folders that have tasks with the same name, Taskasaurus automatically disambiguates them by appending the folder name:

- `Build【api】`
- `Build【web】`

## Behavior

- **Accordion mode** - Only one group can be expanded at a time
- **Auto-collapse** - Expanded groups automatically collapse after 10 seconds of inactivity
- **Alphabetical sorting** - Tasks and groups are sorted alphabetically
- **Auto-refresh** - The task list refreshes when you save `tasks.json` or change workspace folders

## Commands

Taskasaurus provides these commands (accessible via Command Palette):

| Command                            | Description                    |
| ---------------------------------- | ------------------------------ |
| `Taskasaurus: Refresh Tasks`       | Manually refresh the task list |
| `Taskasaurus: Collapse All Groups` | Collapse any expanded group    |

## Requirements

- VS Code 1.85.0 or higher
- A workspace with tasks defined in `.vscode/tasks.json` or provided by extensions

## Tips

1. **Keep task labels short** - Status bar space is limited
2. **Use consistent naming** - `Category: action` format works best for grouping
3. **Add icons** - Visual cues make tasks easier to identify at a glance
4. **Hide background tasks** - Use `hide: true` for watchers and internal scripts

## License

MIT

## Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=tangent.taskasaurus)
- [Report Issues](https://github.com/tangentlin/taskasaurus/issues)
- [Source Code](https://github.com/tangentlin/taskasaurus)
