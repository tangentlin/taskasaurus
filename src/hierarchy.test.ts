import { describe, it, expect } from 'vitest';
import { buildHierarchy, disambiguateLabels } from './hierarchy';
import type { IconMap } from './types';
import type * as vscode from 'vscode';

function mockTask(name: string, source = 'Workspace', folderName?: string): vscode.Task {
  const scope = folderName
    ? { name: folderName, uri: { fsPath: `/mock/${folderName}` } } as vscode.WorkspaceFolder
    : undefined;

  return {
    name,
    source,
    scope,
    definition: { type: 'shell' },
    isBackground: false,
    presentationOptions: {},
    problemMatchers: [],
    runOptions: {},
  } as unknown as vscode.Task;
}

describe('buildHierarchy', () => {
  const emptyIconMap: IconMap = new Map();

  it('returns empty array for no tasks', () => {
    const result = buildHierarchy([], emptyIconMap);
    expect(result).toEqual([]);
  });

  it('creates root leaves for tasks without colons', () => {
    const tasks = [mockTask('Build'), mockTask('Run')];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('rootLeaf');
    expect(result[0].label).toBe('Build');
    expect(result[1].kind).toBe('rootLeaf');
    expect(result[1].label).toBe('Run');
  });

  it('creates a group when 2+ tasks share a group name', () => {
    const tasks = [
      mockTask('Build'),
      mockTask('Test: unit'),
      mockTask('Test: e2e'),
      mockTask('Run'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(3); // Build, Test (parent), Run

    const testGroup = result.find(n => n.label === 'Test');
    expect(testGroup).toBeDefined();
    expect(testGroup?.kind).toBe('parent');

    if (testGroup?.kind === 'parent') {
      expect(testGroup.children).toHaveLength(2);
      expect(testGroup.children[0].label).toBe('Test: e2e');
      expect(testGroup.children[1].label).toBe('Test: unit');
    }
  });

  it('does NOT create a group when only 1 task has a colon', () => {
    const tasks = [
      mockTask('Build'),
      mockTask('Test: unit'),
      mockTask('Run'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(3);
    expect(result.every(n => n.kind === 'rootLeaf')).toBe(true);
  });

  it('handles edge case: task label equals group name (runnable parent)', () => {
    const tasks = [
      mockTask('Test'),         // exactly "Test"
      mockTask('Test: unit'),
      mockTask('Test: e2e'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(1);
    const testGroup = result[0];
    expect(testGroup.kind).toBe('parent');

    if (testGroup.kind === 'parent') {
      expect(testGroup.runnableTaskKey).toBeDefined();
      expect(testGroup.runnableTaskKey?.label).toBe('Test');

      // The runnable task should appear at the top of children
      expect(testGroup.children).toHaveLength(3);
      expect(testGroup.children[0].label).toBe('Test');
      expect(testGroup.children[1].label).toBe('Test: e2e');
      expect(testGroup.children[2].label).toBe('Test: unit');
    }
  });

  it('sorts root nodes alphabetically (case-insensitive)', () => {
    const tasks = [
      mockTask('zebra'),
      mockTask('Alpha'),
      mockTask('beta'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result.map(n => n.label)).toEqual(['Alpha', 'beta', 'zebra']);
  });

  it('sorts group children alphabetically by full label', () => {
    const tasks = [
      mockTask('Test: zebra'),
      mockTask('Test: alpha'),
      mockTask('Test: Beta'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(1);
    if (result[0].kind === 'parent') {
      expect(result[0].children.map(c => c.label)).toEqual([
        'Test: alpha',
        'Test: Beta',
        'Test: zebra',
      ]);
    }
  });

  it('includes icon from iconMap', () => {
    const iconMap: IconMap = new Map([['Build', 'tools']]);
    const tasks = [mockTask('Build')];
    const result = buildHierarchy(tasks, iconMap);

    expect(result[0].iconId).toBe('tools');
  });

  it('handles multiple groups correctly', () => {
    const tasks = [
      mockTask('Build'),
      mockTask('Test: unit'),
      mockTask('Test: e2e'),
      mockTask('Check: lint'),
      mockTask('Check: style'),
      mockTask('Run'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);

    expect(result).toHaveLength(4); // Build, Check (parent), Run, Test (parent)
    expect(result.map(n => n.label)).toEqual(['Build', 'Check', 'Run', 'Test']);
  });
});

describe('disambiguateLabels', () => {
  const emptyIconMap: IconMap = new Map();

  it('does not modify labels when no duplicates', () => {
    const tasks = [
      mockTask('Build', 'Workspace', 'api'),
      mockTask('Test', 'Workspace', 'web'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);
    disambiguateLabels(result);

    expect(result.map(n => n.label)).toEqual(['Build', 'Test']);
  });

  it('appends folder suffix for duplicate labels from different folders', () => {
    const tasks = [
      mockTask('Build', 'Workspace', 'api'),
      mockTask('Build', 'Workspace', 'web'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);
    disambiguateLabels(result);

    const labels = result.map(n => n.label).sort();
    expect(labels).toEqual(['Build【api】', 'Build【web】']);
  });

  it('does not disambiguate same labels from same folder', () => {
    const tasks = [
      mockTask('Build', 'npm', 'api'),
      mockTask('Build', 'shell', 'api'),
    ];
    const result = buildHierarchy(tasks, emptyIconMap);
    disambiguateLabels(result);

    // These are different sources but same folder, so no disambiguation
    expect(result.every(n => n.label === 'Build')).toBe(true);
  });
});
