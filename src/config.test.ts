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
