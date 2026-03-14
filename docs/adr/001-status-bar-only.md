# ADR 001: Status Bar Only UI

## Status

Accepted

## Context

Taskasaurus needs a persistent, always-visible UI surface for launching tasks. VS Code offers several UI extension points:

- **Status bar items** -- Always visible at the bottom of the window. Each item is a clickable text element supporting codicon icons. Limited to text, tooltip, and a single click command. No hover menus, context menus, or rich content.
- **Tree views** -- Sidebar or panel-based hierarchical lists. Support rich interactions (context menus, drag-and-drop, inline actions) but require the user to have the correct panel open. Not always visible.
- **Quick picks** -- Modal dropdown lists invoked via keyboard shortcut or command. Excellent for search and selection but require explicit invocation. Not persistent.

The core product goal is a "task launcher strip" that developers can see and use at all times without switching panels or invoking commands. The target users have many tasks and want one-click access.

## Decision

Use only VS Code `StatusBarItem` instances to render the entire Taskasaurus UI. No Tree View, Quick Pick, Webview, or other VS Code UI surface is used.

Each visible node (parent group, child task, root leaf task) is a separate `StatusBarItem` positioned in the left status bar region. Hierarchy is conveyed through icon prefixes (`$(chevron-right)`, `$(arrow-small-right)`) and ordering via the `priority` property.

## Consequences

**Positive:**

- The task launcher is always visible without any user action.
- No panel switching or keyboard shortcut required to access tasks.
- Minimal cognitive overhead -- tasks are in the user's peripheral vision.
- Simple mental model: click to expand, click to run.

**Negative:**

- Limited horizontal space. Long task names or many tasks can overflow the status bar.
- No right-click context menus for additional actions (cancel, configure, etc.).
- No hover previews or rich tooltips (limited to plain text tooltips).
- Bends VS Code UX guidelines, which recommend minimal status bar usage.
- Accordion pattern is unconventional for a status bar and may surprise users.
- Item reconciliation logic is needed to avoid flicker when the visible set changes.

## Alternatives Considered

### Tree View (Sidebar)

A dedicated sidebar view would provide rich hierarchy, context menus, and unlimited vertical space. Rejected because it is not always visible -- users must open the correct sidebar panel. This conflicts with the core goal of an always-available launcher strip.

### Quick Pick

A command-palette-style dropdown would support search, filtering, and rich item rendering. Rejected because it requires explicit invocation (keyboard shortcut or command). It is not persistent and does not provide at-a-glance task visibility.

### Webview Panel

A custom HTML panel would allow arbitrary UI. Rejected due to complexity, loss of native look-and-feel, and the same visibility problem as Tree Views (panel must be open).
