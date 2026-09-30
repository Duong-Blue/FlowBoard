import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Bug, Sparkles, TrendingUp, Tag, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IssueTypeDefinition {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  badgeVariant: 'outline' | 'default' | 'secondary' | 'destructive';
}

export const IssueTypesTab: React.FC = () => {
  const { t } = useTranslation(['workspace', 'common']);

  const issueTypes: IssueTypeDefinition[] = [
    {
      key: 'TASK',
      name: 'Task',
      description: t('projects.issueTypes.taskDesc', { defaultValue: 'Standard work items, user stories, or actionable tasks to be completed.' }),
      icon: CheckSquare,
      colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      badgeVariant: 'outline',
    },
    {
      key: 'BUG',
      name: 'Bug',
      description: t('projects.issueTypes.bugDesc', { defaultValue: 'Defects, errors, or unexpected behavior that requires a fix.' }),
      icon: Bug,
      colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
      badgeVariant: 'destructive',
    },
    {
      key: 'FEATURE',
      name: 'Feature',
      description: t('projects.issueTypes.featureDesc', { defaultValue: 'New capabilities, major functionality additions, or product epics.' }),
      icon: Sparkles,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      badgeVariant: 'default',
    },
    {
      key: 'IMPROVEMENT',
      name: 'Improvement',
      description: t('projects.issueTypes.improvementDesc', { defaultValue: 'Optimizations, refinements, or minor enhancements to existing features.' }),
      icon: TrendingUp,
      colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
      badgeVariant: 'secondary',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {t('projects.issueTypesTitle', { defaultValue: 'Issue Types' })}
            </CardTitle>
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
            {t('projects.issueTypesSubtitle', { defaultValue: 'Configure and view issue types available for work tracking in this project.' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issueTypes.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex flex-col p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${item.colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.name}
                        </h4>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {item.key}
                        </span>
                      </div>
                    </div>

                    <Badge variant={item.badgeVariant} className="uppercase text-[10px] tracking-wider font-semibold">
                      {t('common:status.active', { defaultValue: 'Active' })}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {t('projects.defaultWorkflow', { defaultValue: 'Standard Workflow' })}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">System Default</span>
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

export default IssueTypesTab;
