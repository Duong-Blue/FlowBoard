import { useEffect, useState } from 'react';
import { useOutletContext, Link, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, AlertCircle, CheckCircle2, TrendingUp, 
  Activity, Clock, ChevronRight, Flag, Calendar, Hash, Target
} from 'lucide-react';

import NotFound from '../NotFound';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { getProjectSummary } from '@/services/projectService';
import { formatDate, formatTimeAgo } from '@/lib/dateUtils';
import type { Project } from '@/store/types';

export function ProjectOverviewPage() {
  const { orgId, projectKey } = useParams<{ orgId: string, projectKey: string }>();
  const { project } = useOutletContext<{ project: Project }>();
  
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    if (project?.id && project?.organizationId) {
        setSummaryLoading(true);
        getProjectSummary(project.organizationId, project.id)
            .then(res => setSummary(res))
            .catch((err) => console.error('Failed to load project summary', err))
            .finally(() => setSummaryLoading(false));
    }
  }, [project?.id, project?.organizationId]);

  if (!project) return <NotFound />;

  // Destructure with fallbacks
  const metrics = summary?.metrics || { totalIssues: 0, completedIssues: 0, inProgressIssues: 0, overdueIssues: 0, progressPercentage: 0 };
  const currentMilestone = summary?.currentMilestone;
  const statusBreakdown = summary?.statusBreakdown || [];
  const recentlyUpdatedIssues = summary?.recentlyUpdatedIssues || [];
  const recentActivities = summary?.recentActivities || [];

  return (
    <div className="p-6 md:p-8 space-y-8 w-full">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl uppercase shadow-sm shrink-0">
              {project.key?.substring(0, 1) || project.name.substring(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-mono text-xs">{project.key}</Badge>
                {project.createdAt && (
                  <span className="text-xs text-slate-500">
                    Created {formatDate(project.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 mt-3 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2 md:mt-0">
          <Link to={`/workspace/orgs/${orgId}/projects/${projectKey}/issues`}>
            <Button variant="outline" className="h-9">Go to Board</Button>
          </Link>
          <Link to={`/workspace/orgs/${orgId}/projects/${projectKey}/settings`}>
            <Button variant="ghost" className="h-9">Settings</Button>
          </Link>
        </div>
      </div>

      {summaryLoading ? (
        <OverviewSkeleton />
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">Total Issues</CardTitle>
                <div className="p-2 bg-slate-50 rounded-md text-slate-500">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.totalIssues}</div>
                <p className="text-xs text-slate-500 mt-1">In this project</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
                <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.completedIssues}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.totalIssues > 0 ? Math.round((metrics.completedIssues / metrics.totalIssues) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metrics.inProgressIssues}</div>
                <p className="text-xs text-slate-500 mt-1">Actively worked on</p>
              </CardContent>
            </Card>
            <Card className={`border-slate-200/60 shadow-sm ${metrics.overdueIssues > 0 ? 'bg-red-50/30' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
                <div className={`p-2 rounded-md ${metrics.overdueIssues > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                  <AlertCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.overdueIssues > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {metrics.overdueIssues}
                </div>
                <p className="text-xs text-slate-500 mt-1">Past due date</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid: 2 cols */}
          <div className="grid gap-6 xl:grid-cols-12">
            
            {/* Left Column (Span 7) */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* Status Breakdown & Progress */}
              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Progress Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">{Math.round(metrics.progressPercentage)}%</span>
                    <span className="text-sm text-slate-500">Done</span>
                  </div>
                  
                  {/* Visual Stacked Bar */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex mb-5">
                    {statusBreakdown.map((status: any) => {
                      if (metrics.totalIssues === 0) return null;
                      const width = `${(status.count / metrics.totalIssues) * 100}%`;
                      return (
                        <div 
                          key={status.id} 
                          style={{ width, backgroundColor: status.color || '#94a3b8' }} 
                          className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:brightness-110 cursor-pointer"
                          title={`${status.name}: ${status.count}`}
                        />
                      );
                    })}
                    {metrics.totalIssues === 0 && (
                      <div className="w-full bg-slate-200 h-full"></div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                    {statusBreakdown.map((status: any) => (
                      <div key={status.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color || '#94a3b8' }} />
                        <span>{status.name}</span>
                        <span className="font-semibold text-slate-900 ml-1">{status.count}</span>
                      </div>
                    ))}
                    {statusBreakdown.length === 0 && (
                      <div className="text-sm text-slate-500 italic">No issues yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recently Updated Issues */}
              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Recently Updated
                  </CardTitle>
                  <Link to={`/workspace/orgs/${orgId}/projects/${projectKey}/issues?view=list`} className="text-xs text-indigo-600 hover:underline flex items-center">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {recentlyUpdatedIssues.length > 0 ? (
                      recentlyUpdatedIssues.map((issue: any) => (
                        <Link 
                          key={issue.id} 
                          to={`/workspace/orgs/${orgId}/projects/${projectKey}/issues?issueId=${issue.key}`}
                          className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              <div className={`w-2 h-2 mt-1.5 rounded-full ${
                                issue.priority === 'URGENT' ? 'bg-red-500' :
                                issue.priority === 'HIGH' ? 'bg-orange-500' :
                                issue.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                'bg-blue-400'
                              }`} title={issue.priority} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate pr-4">{issue.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span className="font-mono text-[10px] uppercase text-slate-400">{issue.key}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(issue.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {issue.workflowStatus && (
                              <Badge variant="outline" style={{ 
                                borderColor: issue.workflowStatus.color + '40', 
                                color: issue.workflowStatus.color,
                                backgroundColor: issue.workflowStatus.color + '10'
                              }} className="hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border shadow-none">
                                {issue.workflowStatus.name}
                              </Badge>
                            )}
                            <Avatar className="h-6 w-6 ring-2 ring-white">
                              {issue.assignee ? (
                                <>
                                  <AvatarImage src={issue.assignee.avatarUrl} />
                                  <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                                    {issue.assignee.firstName?.charAt(0)}{issue.assignee.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </>
                              ) : (
                                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-400 border border-dashed border-slate-300">?</AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No recent issues found.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column (Span 5) */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Active Milestone */}
              <Card className="border-slate-200/60 shadow-sm bg-gradient-to-b from-white to-slate-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Current Milestone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentMilestone ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{currentMilestone.name}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                            <Calendar className="w-3 h-3" /> {formatDate(currentMilestone.targetDate, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                            <Hash className="w-3 h-3" /> {currentMilestone._count?.issues || 0} Issues
                          </span>
                        </div>
                      </div>
                      
                      {/* Simple placeholder progress */}
                      <div className="pt-2">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                           <div className="bg-indigo-500 h-full rounded-full w-[45%]" /> 
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">In Progress</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Flag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No active milestone</p>
                      <Link to={`/workspace/orgs/${orgId}/projects/${projectKey}/settings?tab=milestones`}>
                        <Button variant="link" className="text-xs mt-1 h-auto p-0 text-indigo-600">Create a Milestone</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Feed */}
              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-500" />
                    Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length > 0 ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                      {recentActivities.slice(0, 6).map((activity: any) => (
                        <div key={activity.id} className="relative flex items-start justify-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center z-10 text-[10px] text-slate-500">
                            {activity.type.includes('CREATE') ? '+' : activity.type.includes('DELETE') ? '-' : '•'}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5 pb-2">
                            <p className="text-sm text-slate-700">
                              <span className="font-medium text-slate-900">{activity.metadata?.actorName || 'Someone'}</span>{' '}
                              {formatActivityType(activity.type)}{' '}
                              {activity.metadata?.issueKey && (
                                <span className="font-mono text-xs font-medium text-slate-900">{activity.metadata.issueKey}</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-500">No recent activity.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helpers

function formatActivityType(type: string): string {
  const parts = type.split('_');
  if (parts.length < 2) return type.toLowerCase();
  
  const action = parts.pop()?.toLowerCase();
  const entity = parts.join(' ').toLowerCase();
  
  if (action === 'created') return `created ${entity}`;
  if (action === 'updated') return `updated ${entity}`;
  if (action === 'deleted') return `deleted ${entity}`;
  if (action === 'changed') return `changed ${entity}`;
  
  return type.toLowerCase().replace(/_/g, ' ');
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-slate-200/60 shadow-sm">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-5 space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProjectOverviewPage;
