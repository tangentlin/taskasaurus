# Taskasaurus — Documentation Index

| Document                                                   | Description                            |
| ---------------------------------------------------------- | -------------------------------------- |
| [AGENTS.md](./AGENTS.md)                                   | Agent playbook — read first            |
| [DOMAIN.md](./DOMAIN.md)                                   | Vocabulary, invariants, business rules |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                       | Structure, data flow, design decisions |
| [functional-spec/PRODUCT.md](./functional-spec/PRODUCT.md) | Implementation-agnostic product spec   |

## Modules

| Module                                  | Description                                                     |
| --------------------------------------- | --------------------------------------------------------------- |
| [controller](./modules/controller.md)   | TaskasaurusController — central orchestrator                    |
| [hierarchy](./modules/hierarchy.md)     | buildHierarchy + disambiguateLabels                             |
| [status-bar](./modules/status-bar.md)   | StatusBarRenderer + StatusBarModel (label/priority composition) |
| [task-key](./modules/task-key.md)       | Task identity, resolution, equality                             |
| [icon-parser](./modules/icon-parser.md) | JSONC parsing, metadata extraction                              |
| [icon-loader](./modules/icon-loader.md) | Workspace folder file I/O for tasks.json                        |
| [config](./modules/config.md)           | VS Code settings reader                                         |
| [logger](./modules/logger.md)           | Output channel logging                                          |

## Features

| Feature                                                  | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------- |
| [task-grouping](./features/task-grouping.md)             | Delimiter-based 2-level hierarchy               |
| [accordion-expansion](./features/accordion-expansion.md) | Single-group expand/collapse with auto-collapse |
| [task-execution](./features/task-execution.md)           | Click-to-run with visual feedback               |
| [hidden-tasks](./features/hidden-tasks.md)               | Filter tasks with `"hide": true`                |
| [short-child-labels](./features/short-child-labels.md)   | Configurable prefix stripping                   |
| [multi-root](./features/multi-root.md)                   | Cross-folder disambiguation                     |
| [task-icons](./features/task-icons.md)                   | Best-effort icon resolution                     |

## ADRs

| ADR                                 | Decision                                         |
| ----------------------------------- | ------------------------------------------------ |
| [001](./adr/001-status-bar-only.md) | Status bar items only — no TreeView or QuickPick |
| [002](./adr/002-virtual-groups.md)  | Virtual groups from label delimiters             |
| [003](./adr/003-tasks-json-only.md) | Only tasks.json tasks, exclude auto-detected     |

## Other Reference

| Document                               | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| [specs.md](./specs.md)                 | Original product specification (historical) |
| [ROADMAP.md](./ROADMAP.md)             | Future features under consideration         |
| [releasing.md](./releasing.md)         | Release process                             |
| [README.md](../README.md)              | Project readme and usage guide              |
| [THIRDPARTY.md](../THIRDPARTY.md)      | Third-party license attributions            |
