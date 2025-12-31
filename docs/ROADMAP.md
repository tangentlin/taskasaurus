# Taskasaurus Roadmap

Future features under consideration, roughly ordered by priority.

## Custom delimiter configuration

Allow users to configure the grouping delimiter instead of hardcoding `:`.

**Behavior:**

- Default delimiter remains `:` (colon)
- Users can override via workspace or user settings:
  ```json
  {
    "taskasaurus.groupDelimiter": "/"
  }
  ```
- Examples of alternate conventions:
  - `build/dev`, `build/prod` (slash)
  - `test-unit`, `test-e2e` (hyphen)

**Implementation notes:**

- Add configuration contribution in `package.json`
- Update `parseGroupName()` in hierarchy builder to use configured delimiter
- Re-render on configuration change

**Why:**

Different teams/projects have different naming conventions. This removes friction for adoption without changing defaults.

## Configurable auto-collapse timeout

Allow users to customize or disable the 10-second auto-collapse behavior.

**Behavior:**

- Default remains 10 seconds
- Users can override via settings:
  ```json
  {
    "taskasaurus.autoCollapseTimeout": 15000
  }
  ```
- Setting to `0` disables auto-collapse entirely

**Implementation notes:**

- Add configuration contribution in `package.json`
- Read timeout value in controller instead of using constant
- Handle `0` as "disabled" case (don't start timer)

**Why:**

Some users prefer groups to stay open longer while they decide which task to run. Others may want to disable auto-collapse entirely if they find it disruptive.
