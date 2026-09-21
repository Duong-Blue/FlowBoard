import React from 'react';
import { Workflow, Info, ListTodo, Clock, Eye, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { IssueStatus } from '@/store/types';

interface StatusDefinition {
  id: IssueStatus;
  label: string;
  category: string;
  badgeStyle: string;
  icon: React.ElementType;
  description: string;
}

const DEFAULT_STATUSES: StatusDefinition[] = [
  {
    id: 'TODO',
    label: 'To Do',
    category: 'Backlog / Open',
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: ListTodo,
    description: 'Work items queued and waiting to be picked up by team members.',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    category: 'Active Work',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    description: 'Work items currently being actively developed or executed.',
  },
  {
    id: 'IN_PREVIEW',
    label: 'In Preview',
    category: 'Review & QA',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Eye,
    description: 'Work items awaiting peer code review, design QA, or preview testing.',
  },
  {
    id: 'DONE',
    label: 'Done',
    category: 'Completed',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    description: 'Work items successfully finished, verified, and closed.',
  },
];

export const WorkflowSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Informative Notice Banner */}
      <div className="flex items-start gap-3.5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-900 text-sm">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-blue-950">Default Project Workflow Active</h4>
          <p className="text-blue-800 text-xs leading-relaxed">
            This project uses the standard FlowBoard issue lifecycle. Custom status creation, column transitions, and workflow rule editing will be configurable in an upcoming release.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-slate-700" />
            <CardTitle className="text-xl font-semibold text-slate-900">Active Workflow Statuses</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            The status steps available to issues in this project workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_STATUSES.map((statusItem) => {
              const IconComponent = statusItem.icon;
              return (
                <div
                  key={statusItem.id}
                  className="flex flex-col p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">{statusItem.label}</span>
                    </div>
                    <Badge variant="outline" className={statusItem.badgeStyle}>
                      {statusItem.id}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal flex-1">
                    {statusItem.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Category: {statusItem.category}</span>
                    <span>System Built-in</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowSettingsTab;
