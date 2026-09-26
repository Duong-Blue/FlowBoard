import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Clock,
  Folder,
  User,
  ChevronRight,
  CornerDownLeft,
  Trash2,
  Loader2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  setModalOpen,
  toggleModal,
  addRecentQuery,
  clearRecentQueries,
} from '@/store/slices/searchSlice';
import { getSuggestions } from '@/services/searchService';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type {
  SearchIssueItem,
  SearchProjectItem,
  SearchUserItem,
  SearchSuggestionsResponse,
} from '@/store/types';

interface FlatItem {
  id: string;
  group: 'exact' | 'issue' | 'project' | 'user' | 'recent' | 'action';
  data: any;
}

export function GlobalSearchModal() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isModalOpen = useAppSelector((state) => state.search.isModalOpen);
  const recentQueries = useAppSelector((state) => state.search.recentQueries);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const orgs = useAppSelector((state) => state.org.list);
  const activeProjectId = useAppSelector((state) => state.project.activeProjectId);
  const projects = useAppSelector((state) => state.project.list);

  const [query, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // 1. Listen for Ctrl+K / Cmd+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        dispatch(toggleModal());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  // Focus input when modal opens & reset state, abort on close
  useEffect(() => {
    if (isModalOpen) {
      setQueryText('');
      setSuggestions(null);
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isModalOpen]);

  // 2. Debounced search with AbortController cancellation & sequence guard
  useEffect(() => {
    const trimmed = query.trim();

    // 0 or 1-character queries MUST NOT trigger search request
    if (trimmed.length <= 1) {
      setSuggestions(null);
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentRequestId = ++requestIdRef.current;

      try {
        const res = await getSuggestions(
          {
            q: trimmed,
            orgId: activeOrgId || undefined,
            projectId: activeProjectId || undefined,
            limit: 5,
          },
          controller.signal,
        );
        if (currentRequestId === requestIdRef.current) {
          setSuggestions(res);
        }
      } catch (err: any) {
        if (
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED' ||
          err?.message === 'canceled'
        ) {
          return;
        }
        console.error('Failed to fetch suggestions:', err);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [query, activeOrgId, activeProjectId]);

  // 3. Flatten selectable items for keyboard navigation
  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    const trimmed = query.trim();

    if (!trimmed) {
      recentQueries.forEach((q, idx) => {
        items.push({ id: `recent-${idx}-${q}`, group: 'recent', data: q });
      });
      return items;
    }

    if (trimmed.length === 1) {
      return items;
    }

    if (suggestions) {
      if (suggestions.exactMatch) {
        items.push({
          id: `exact-${suggestions.exactMatch.id}`,
          group: 'exact',
          data: suggestions.exactMatch,
        });
      }

      suggestions.issues.forEach((issue) => {
        if (!suggestions.exactMatch || suggestions.exactMatch.id !== issue.id) {
          items.push({ id: `issue-${issue.id}`, group: 'issue', data: issue });
        }
      });

      suggestions.projects.forEach((proj) => {
        items.push({ id: `project-${proj.id}`, group: 'project', data: proj });
      });

      suggestions.users.forEach((u) => {
        items.push({ id: `user-${u.id}`, group: 'user', data: u });
      });

      items.push({ id: 'action-view-all', group: 'action', data: trimmed });
    }

    return items;
  }, [query, suggestions, recentQueries]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems]);

  const handleViewAll = useCallback(
    (q: string) => {
      if (!q.trim()) return;
      dispatch(addRecentQuery(q.trim()));
      navigate(`/workspace/search?q=${encodeURIComponent(q.trim())}`);
      dispatch(setModalOpen(false));
    },
    [dispatch, navigate],
  );

  const handleSelect = useCallback(
    (item: FlatItem) => {
      if (item.group === 'recent') {
        setQueryText(item.data);
        return;
      }

      if (item.group === 'exact' || item.group === 'issue') {
        const issue: SearchIssueItem = item.data;
        dispatch(addRecentQuery(query.trim() || issue.key || issue.title));
        const targetOrgId = issue.orgId || activeOrgId || (orgs.length > 0 ? orgs[0].id : '');
        const targetProjKey =
          issue.projectKey || projects.find((p) => p.id === issue.projectId)?.key || '';

        if (targetOrgId && targetProjKey) {
          navigate(
            `/workspace/orgs/${targetOrgId}/projects/${targetProjKey}/issues/${issue.key || issue.id}`,
          );
        } else {
          navigate(`/workspace/search?q=${encodeURIComponent(issue.key || issue.title)}`);
        }
        dispatch(setModalOpen(false));
        return;
      }

      if (item.group === 'project') {
        const proj: SearchProjectItem = item.data;
        dispatch(addRecentQuery(query.trim() || proj.name));
        const targetOrgId = proj.organizationId || activeOrgId || (orgs.length > 0 ? orgs[0].id : '');
        if (targetOrgId && proj.key) {
          navigate(`/workspace/orgs/${targetOrgId}/projects/${proj.key}`);
        }
        dispatch(setModalOpen(false));
        return;
      }

      if (item.group === 'user') {
        const u: SearchUserItem = item.data;
        dispatch(addRecentQuery(query.trim() || u.displayName));
        const targetOrgId = activeOrgId || (orgs.length > 0 ? orgs[0].id : '');
        if (targetOrgId) {
          navigate(`/workspace/orgs/${targetOrgId}/members`);
        }
        dispatch(setModalOpen(false));
        return;
      }

      if (item.group === 'action') {
        handleViewAll(item.data);
        return;
      }
    },
    [query, activeOrgId, orgs, projects, dispatch, navigate, handleViewAll],
  );

  const handleKeyDownModal = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        } else if (query.trim()) {
          handleViewAll(query);
        }
      } else if (e.key === 'Escape') {
        dispatch(setModalOpen(false));
      }
    },
    [flatItems, selectedIndex, handleSelect, query, handleViewAll, dispatch],
  );

  const getItemIndex = useCallback(
    (id: string) => flatItems.findIndex((item) => item.id === id),
    [flatItems],
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => dispatch(setModalOpen(open))}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-xl"
        onKeyDown={handleKeyDownModal}
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>

        {/* Input Bar */}
        <div className="relative flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 bg-transparent text-slate-900 placeholder-slate-400 text-base outline-none font-medium"
            placeholder="Search issues, projects, users... (e.g. PROJ-123 or #12)"
            value={query}
            onChange={(e) => setQueryText(e.target.value)}
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0 ml-2" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQueryText('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4 text-slate-900">
          {/* 1. Empty Query State -> Recent Queries */}
          {!query.trim() && (
            <div className="py-2 px-2">
              <div className="flex items-center justify-between pb-2 mb-1 px-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Recent Searches
                </span>
                {recentQueries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(clearRecentQueries())}
                    className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              {recentQueries.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No recent searches yet
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentQueries.map((rq, rqIdx) => {
                    const idx = getItemIndex(`recent-${rqIdx}-${rq}`);
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${rq}-${rqIdx}`}
                        onClick={() => handleSelect({ id: '', group: 'recent', data: rq })}
                        onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          {rq}
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Single Character Hint */}
          {query.trim().length === 1 && (
            <div className="py-8 text-center text-slate-400 text-sm">
              Type at least 2 characters to search...
            </div>
          )}

          {/* 3. Search Results */}
          {query.trim().length > 1 && suggestions && (
            <>
              {/* No results */}
              {!suggestions.exactMatch &&
                suggestions.issues.length === 0 &&
                suggestions.projects.length === 0 &&
                suggestions.users.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-slate-500 font-medium">No results found for "{query}"</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Try searching with different keywords or check spelling.
                    </p>
                  </div>
                )}

              {/* Exact Match */}
              {suggestions.exactMatch && (
                <div className="px-2">
                  <div className="px-2 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Exact Match
                  </div>
                  {(() => {
                    const exact = suggestions.exactMatch!;
                    const idx = getItemIndex(`exact-${exact.id}`);
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        onClick={() => handleSelect({ id: '', group: 'exact', data: exact })}
                        onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
                              {exact.key}
                            </span>
                            <span className="font-semibold text-slate-900 truncate">
                              {exact.title}
                            </span>
                          </div>
                          {exact.workflowStatus && (
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-medium border shrink-0"
                              style={{
                                backgroundColor: exact.workflowStatus.color
                                  ? `${exact.workflowStatus.color}15`
                                  : '#f1f5f9',
                                color: exact.workflowStatus.color || '#475569',
                                borderColor: exact.workflowStatus.color
                                  ? `${exact.workflowStatus.color}40`
                                  : '#e2e8f0',
                              }}
                            >
                              {exact.workflowStatus.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Issues */}
              {suggestions.issues.length > 0 && (
                <div className="px-2">
                  <div className="px-2 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" /> Issues
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.issues.map((issue) => {
                      if (suggestions.exactMatch && suggestions.exactMatch.id === issue.id) {
                        return null;
                      }
                      const idx = getItemIndex(`issue-${issue.id}`);
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={issue.id}
                          onClick={() => handleSelect({ id: '', group: 'issue', data: issue })}
                          onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono font-semibold text-slate-500 shrink-0">
                              {issue.key}
                            </span>
                            <span className="truncate">{issue.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {issue.projectName && (
                              <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[120px]">
                                {issue.projectName}
                              </span>
                            )}
                            {issue.workflowStatus && (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-medium border"
                                style={{
                                  backgroundColor: issue.workflowStatus.color
                                    ? `${issue.workflowStatus.color}15`
                                    : '#f1f5f9',
                                  color: issue.workflowStatus.color || '#475569',
                                  borderColor: issue.workflowStatus.color
                                    ? `${issue.workflowStatus.color}40`
                                    : '#e2e8f0',
                                }}
                              >
                                {issue.workflowStatus.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Projects */}
              {suggestions.projects.length > 0 && (
                <div className="px-2">
                  <div className="px-2 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-indigo-500" /> Projects
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.projects.map((proj) => {
                      const idx = getItemIndex(`project-${proj.id}`);
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleSelect({ id: '', group: 'project', data: proj })}
                          onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Folder className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span className="truncate">{proj.name}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-400 shrink-0">
                            {proj.key}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Users */}
              {suggestions.users.length > 0 && (
                <div className="px-2">
                  <div className="px-2 pb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" /> Users
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.users.map((u) => {
                      const idx = getItemIndex(`user-${u.id}`);
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleSelect({ id: '', group: 'user', data: u })}
                          onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-medium'
                              : 'text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.displayName}
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <User className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate">{u.displayName}</span>
                          </div>
                          <span className="text-xs text-slate-400 truncate max-w-[180px]">
                            {u.email}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View All Results Button */}
              <div className="p-2 border-t border-slate-100">
                {(() => {
                  const idx = getItemIndex('action-view-all');
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      type="button"
                      onClick={() => handleViewAll(query)}
                      onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>View all results for "{query}"</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↵
              </kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
              ESC
            </kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
