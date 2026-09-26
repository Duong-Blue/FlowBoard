import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { setProjects } from '@/store/slices/projectSlice';
import * as projectService from '@/services/projectService';
import { fullSearch } from '@/services/searchService';
import type {
  SearchEntityType,
  SearchIssueItem,
  SearchProjectItem,
  SearchUserItem,
  SearchQueryParams,
} from '@/store/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Loader2,
  ChevronRight,
  User as UserIcon,
  FolderKanban,
  FileText,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Bug,
  Sparkles,
  CheckSquare,
  Layers,
  Calendar,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

function getPriorityIcon(priority?: string) {
  switch (priority?.toUpperCase()) {
    case 'URGENT':
      return <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />;
    case 'HIGH':
      return <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    case 'MEDIUM':
      return <Minus className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    case 'LOW':
      return <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    default:
      return null;
  }
}

function getIssueTypeIcon(type?: string) {
  switch (type?.toUpperCase()) {
    case 'BUG':
      return <Bug className="w-4 h-4 text-rose-500 shrink-0" />;
    case 'FEATURE':
      return <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />;
    case 'TASK':
      return <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />;
    case 'EPIC':
      return <Layers className="w-4 h-4 text-purple-600 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  }
}

function renderStatusBadge(status?: { name: string; category?: string; color?: string | null }) {
  if (!status) return null;
  const color = status.color || '#64748b';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span>{status.name}</span>
    </span>
  );
}

export default function FullSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const orgList = useAppSelector((state) => state.org.list);
  const projectList = useAppSelector((state) => state.project.list);

  // URL Params state
  const qParam = searchParams.get('q') || '';
  const typeParam = (searchParams.get('type') as SearchEntityType) || 'ISSUE';
  const projectIdParam = searchParams.get('projectId') || '';
  const workflowStatusIdParam = searchParams.get('workflowStatusId') || '';
  const priorityParam = searchParams.get('priority') || '';
  const issueTypeParam = searchParams.get('issueType') || '';
  const sortByParam = searchParams.get('sortBy') || 'relevance';
  const sortOrderParam = searchParams.get('sortOrder') || 'desc';

  // Input state
  const [searchInput, setSearchInput] = useState(qParam);

  // Results & Pagination state
  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ limit: number; nextCursor: string | null; hasNextPage: boolean }>({
    limit: 20,
    nextCursor: null,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync search input when qParam changes externally
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  // Fetch available projects if projectList is empty
  useEffect(() => {
    const effectiveOrgId = activeOrgId || orgList[0]?.id;
    if (effectiveOrgId && projectList.length === 0) {
      projectService
        .getProjects(effectiveOrgId)
        .then((projects) => {
          dispatch(setProjects(projects));
        })
        .catch(() => {
          // Silent fallback
        });
    }
  }, [activeOrgId, orgList, projectList.length, dispatch]);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (val === null || val === undefined || val === '') {
              next.delete(key);
            } else {
              next.set(key, val);
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Perform search whenever parameters change
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    setLoading(true);

    const queryDto: SearchQueryParams = {
      q: qParam || undefined,
      type: typeParam,
      projectId: projectIdParam || undefined,
      limit: 20,
    };

    if (typeParam === 'ISSUE') {
      if (workflowStatusIdParam) queryDto.workflowStatusId = workflowStatusIdParam;
      if (priorityParam) queryDto.priority = priorityParam;
      if (issueTypeParam) queryDto.issueType = issueTypeParam;
      if (sortByParam) queryDto.sortBy = sortByParam as any;
      if (sortOrderParam) queryDto.sortOrder = sortOrderParam as any;
    }

    fullSearch(queryDto, controller.signal)
      .then((res) => {
        if (isMounted) {
          setResults(res.items || []);
          setMeta(res.meta || { limit: 20, nextCursor: null, hasNextPage: false });
        }
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Search failed:', err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    qParam,
    typeParam,
    projectIdParam,
    workflowStatusIdParam,
    priorityParam,
    issueTypeParam,
    sortByParam,
    sortOrderParam,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchInput.trim() });
  };

  const handleTabChange = (newType: SearchEntityType) => {
    if (newType === typeParam) return;
    if (newType !== 'ISSUE') {
      updateUrlParams({
        type: newType,
        workflowStatusId: null,
        priority: null,
        issueType: null,
        sortBy: null,
        sortOrder: null,
      });
    } else {
      updateUrlParams({ type: 'ISSUE' });
    }
  };

  const handleResetFilters = () => {
    updateUrlParams({
      projectId: null,
      workflowStatusId: null,
      priority: null,
      issueType: null,
      sortBy: null,
      sortOrder: null,
    });
  };

  const handleLoadMore = async () => {
    if (!meta.nextCursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const queryDto: SearchQueryParams = {
        q: qParam || undefined,
        type: typeParam,
        projectId: projectIdParam || undefined,
        cursor: meta.nextCursor,
        limit: 20,
      };

      if (typeParam === 'ISSUE') {
        if (workflowStatusIdParam) queryDto.workflowStatusId = workflowStatusIdParam;
        if (priorityParam) queryDto.priority = priorityParam;
        if (issueTypeParam) queryDto.issueType = issueTypeParam;
        if (sortByParam) queryDto.sortBy = sortByParam as any;
        if (sortOrderParam) queryDto.sortOrder = sortOrderParam as any;
      }

      const res = await fullSearch(queryDto);
      setResults((prev) => [...prev, ...(res.items || [])]);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load more search results:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleIssueClick = (item: SearchIssueItem) => {
    const targetOrgId = item.orgId || activeOrgId || orgList[0]?.id;
    const targetProjectKey =
      item.projectKey || projectList.find((p) => p.id === item.projectId)?.key;
    if (targetOrgId && targetProjectKey) {
      navigate(
        `/workspace/orgs/${targetOrgId}/projects/${targetProjectKey}/issues/${item.key || item.id}`
      );
    }
  };

  const handleProjectClick = (item: SearchProjectItem) => {
    const targetOrgId = item.organizationId || activeOrgId || orgList[0]?.id;
    if (targetOrgId) {
      navigate(`/workspace/orgs/${targetOrgId}/projects/${item.key || item.id}`);
    }
  };

  const hasActiveFilters =
    Boolean(projectIdParam) ||
    Boolean(workflowStatusIdParam) ||
    Boolean(priorityParam) ||
    Boolean(issueTypeParam) ||
    sortByParam !== 'relevance' ||
    sortOrderParam !== 'desc';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Header & Input */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Search Workspace</h1>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search issues by key, title, description, projects, or users..."
              className="pl-12 pr-10 h-13 text-base rounded-xl border-slate-200 shadow-sm focus-visible:ring-indigo-600 bg-white"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateUrlParams({ q: '' });
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="h-13 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base shadow-sm shrink-0"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Entity Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        {[
          { id: 'ISSUE', label: 'Issues', icon: FileText },
          { id: 'PROJECT', label: 'Projects', icon: FolderKanban },
          { id: 'USER', label: 'Users', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = typeParam === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as SearchEntityType)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 font-medium text-sm border-b-2 transition-colors -mb-px cursor-pointer',
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar for Issues Tab ONLY */}
      {typeParam === 'ISSUE' && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          {/* Project Dropdown */}
          <select
            value={projectIdParam}
            onChange={(e) => updateUrlParams({ projectId: e.target.value || null })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityParam}
            onChange={(e) => updateUrlParams({ priority: e.target.value || null })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Issue Type Dropdown */}
          <select
            value={issueTypeParam}
            onChange={(e) => updateUrlParams({ issueType: e.target.value || null })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="TASK">Task</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
            <option value="EPIC">Epic</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortByParam}
              onChange={(e) => updateUrlParams({ sortBy: e.target.value })}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="relevance">Relevance</option>
              <option value="updatedAt">Updated Date</option>
              <option value="createdAt">Created Date</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>

            {/* Sort Order Dropdown */}
            <select
              value={sortOrderParam}
              onChange={(e) => updateUrlParams({ sortOrder: e.target.value })}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="desc">DESC</option>
              <option value="asc">ASC</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-slate-500 hover:text-slate-800 text-xs font-medium ml-1"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 bg-white animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-28 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">No results found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            {qParam
              ? `We couldn't find anything matching "${qParam}". Try checking for spelling errors or adjusting your filters.`
              : 'No items match the selected criteria.'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {typeParam === 'ISSUE' &&
            results.map((issue: SearchIssueItem) => (
              <div
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getIssueTypeIcon(issue.type)}
                    <span className="font-mono font-semibold text-indigo-600">{issue.key}</span>
                    {issue.projectName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-600">{issue.projectName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(issue.workflowStatus || undefined)}
                    {issue.priority && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {getPriorityIcon(issue.priority)}
                        <span>{issue.priority}</span>
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {issue.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-2">
                    {issue.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={issue.assignee.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                            {(
                              issue.assignee.displayName?.[0] || issue.assignee.email[0]
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-700 font-medium">
                          {issue.assignee.displayName || issue.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {issue.dueDate && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(issue.dueDate)}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {formatDate(issue.updatedAt)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {typeParam === 'PROJECT' &&
            results.map((project: SearchProjectItem) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {project.key}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {project.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">Key: {project.key}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}

          {typeParam === 'USER' &&
            results.map((user: SearchUserItem) => (
              <div
                key={user.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
              >
                <Avatar className="w-10 h-10 border border-slate-200">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                    {(user.displayName?.[0] || user.email[0]).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{user.displayName}</h4>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            ))}

          {meta.hasNextPage && (
            <div className="mt-8 text-center pt-4">
              <Button
                variant="outline"
                size="lg"
                disabled={loadingMore}
                onClick={handleLoadMore}
                className="px-8 border-slate-300 font-medium"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                    Loading more...
                  </>
                ) : (
                  'Load More Results'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
