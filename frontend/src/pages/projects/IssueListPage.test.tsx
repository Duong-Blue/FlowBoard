import { describe, it, expect } from 'vitest';
import { buildIssueTree } from './IssueListPage';
import type { Issue } from '../../store/types';

describe('buildIssueTree', () => {
  const createMockIssue = (id: string, parentId: string | null = null): Issue => ({
    id,
    parentId,
    projectId: 'p1',
    key: `TEST-${id}`,
    title: `Issue ${id}`,
    status: 'TODO',
    priority: 'MEDIUM',
    reporterId: 'u1',
    createdAt: '2026-09-21T12:00:00Z',
    updatedAt: '2026-09-21T12:00:00Z',
  });

  it('handles an empty array', () => {
    expect(buildIssueTree([])).toEqual([]);
  });

  it('returns flat issues with depth 0 when there is no hierarchy', () => {
    const issues = [
      createMockIssue('1'),
      createMockIssue('2'),
    ];

    const tree = buildIssueTree(issues);

    expect(tree).toHaveLength(2);
    expect(tree[0].issue.id).toBe('1');
    expect(tree[0].depth).toBe(0);
    expect(tree[1].issue.id).toBe('2');
    expect(tree[1].depth).toBe(0);
  });

  it('builds a hierarchy with correct indentation depth', () => {
    const issues = [
      createMockIssue('1'), // Root
      createMockIssue('2', '1'), // Child of 1
      createMockIssue('3', '2'), // Child of 2 (grandchild of 1)
      createMockIssue('4'), // Another root
    ];

    const tree = buildIssueTree(issues);

    expect(tree).toHaveLength(4);
    
    // Order should be DFS: 1 -> 2 -> 3 -> 4
    expect(tree[0]).toEqual({ issue: issues[0], depth: 0 }); // 1
    expect(tree[1]).toEqual({ issue: issues[1], depth: 1 }); // 2
    expect(tree[2]).toEqual({ issue: issues[2], depth: 2 }); // 3
    expect(tree[3]).toEqual({ issue: issues[3], depth: 0 }); // 4
  });

  it('does not duplicate subtasks at the root level', () => {
    const issues = [
      createMockIssue('child', 'root'), 
      createMockIssue('root'), 
    ];

    const tree = buildIssueTree(issues);

    expect(tree).toHaveLength(2);
    
    expect(tree[0].issue.id).toBe('root');
    expect(tree[0].depth).toBe(0);
    expect(tree[1].issue.id).toBe('child');
    expect(tree[1].depth).toBe(1);
  });

  it('treats items as root if their parentId is not in the issues array (orphans)', () => {
    const issues = [
      createMockIssue('1', 'missing-parent'),
    ];

    const tree = buildIssueTree(issues);

    expect(tree).toHaveLength(1);
    expect(tree[0].issue.id).toBe('1');
    expect(tree[0].depth).toBe(0);
  });
});
