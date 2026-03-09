import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock vscode module
vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: vi.fn(),
  },
}));

import * as vscode from "vscode";
import { getConfig, affectsTaskasaurusConfig, DEFAULT_DELIMITER } from "./config";

describe("getConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default delimiter when not configured", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupDelimiter).toBe(DEFAULT_DELIMITER);
  });

  it("returns configured delimiter", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockReturnValue(":"),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupDelimiter).toBe(":");
  });

  it("returns default for invalid delimiter (empty string)", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockReturnValue(""),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupDelimiter).toBe(DEFAULT_DELIMITER);
  });

  it("returns default for invalid delimiter (multiple characters)", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockReturnValue("::"),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupDelimiter).toBe(DEFAULT_DELIMITER);
  });

  it("returns default for non-string delimiter", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockReturnValue(123),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupDelimiter).toBe(DEFAULT_DELIMITER);
  });

  it("accepts any single character as delimiter", () => {
    const delimiters = [":", ".", "|", "-", "_", "#", "@"];

    for (const delimiter of delimiters) {
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vi.fn().mockReturnValue(delimiter),
      } as unknown as vscode.WorkspaceConfiguration);

      const config = getConfig();
      expect(config.groupDelimiter).toBe(delimiter);
    }
  });
});

describe("getConfig shortChildLabels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to true when not configured", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => defaultValue),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.shortChildLabels).toBe(true);
  });

  it("reads false when configured", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "shortChildLabels") return false;
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.shortChildLabels).toBe(false);
  });

  it("falls back to true for non-boolean value", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "shortChildLabels") return "yes";
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.shortChildLabels).toBe(true);
  });
});

describe("getConfig groupOverrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty map when not configured", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => defaultValue),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupOverrides.size).toBe(0);
  });

  it("parses valid group overrides", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "groups") {
          return { Test: { shortLabel: false }, Check: { shortLabel: true } };
        }
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupOverrides.size).toBe(2);
    expect(config.groupOverrides.get("Test")?.shortLabel).toBe(false);
    expect(config.groupOverrides.get("Check")?.shortLabel).toBe(true);
  });

  it("handles null groups gracefully", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "groups") return null;
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupOverrides.size).toBe(0);
  });

  it("treats non-boolean shortLabel as undefined", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "groups") {
          return {
            Test: { shortLabel: "yes" },
            Check: { shortLabel: null },
            Build: { shortLabel: true },
          };
        }
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupOverrides.size).toBe(3);
    expect(config.groupOverrides.get("Test")?.shortLabel).toBeUndefined();
    expect(config.groupOverrides.get("Check")?.shortLabel).toBeUndefined();
    expect(config.groupOverrides.get("Build")?.shortLabel).toBe(true);
  });

  it("skips non-object values in groups", () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === "groups") {
          return { Test: "invalid", Check: { shortLabel: true } };
        }
        return defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration);

    const config = getConfig();
    expect(config.groupOverrides.size).toBe(1);
    expect(config.groupOverrides.get("Check")?.shortLabel).toBe(true);
  });
});

describe("affectsTaskasaurusConfig", () => {
  it("returns true when taskasaurus config changes", () => {
    const event = {
      affectsConfiguration: vi.fn().mockReturnValue(true),
    };

    expect(affectsTaskasaurusConfig(event as unknown as vscode.ConfigurationChangeEvent)).toBe(
      true,
    );
    expect(event.affectsConfiguration).toHaveBeenCalledWith("taskasaurus");
  });

  it("returns false when other config changes", () => {
    const event = {
      affectsConfiguration: vi.fn().mockReturnValue(false),
    };

    expect(affectsTaskasaurusConfig(event as unknown as vscode.ConfigurationChangeEvent)).toBe(
      false,
    );
  });
});
