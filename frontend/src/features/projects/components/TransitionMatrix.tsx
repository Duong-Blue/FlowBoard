import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStatus, WorkflowTransition, TransitionItemPayload } from '@/store/api/workflowsApi';
import { ArrowRight, Save, Info, X, CheckCircle2, LayoutGrid, List } from 'lucide-react';

interface TransitionMatrixProps {
  statuses: WorkflowStatus[];
  initialTransitions: WorkflowTransition[];
  onSave: (transitions: TransitionItemPayload[]) => Promise<void>;
  isSaving: boolean;
  isAdmin?: boolean;
}

export const TransitionMatrix: React.FC<TransitionMatrixProps> = ({
  statuses,
  initialTransitions,
  onSave,
  isSaving,
  isAdmin = true,
}) => {
  const { t } = useTranslation(['workspace', 'common']);
  // Key format: "fromStatusId->toStatusId"
  const [allowedTransitions, setAllowedTransitions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  useEffect(() => {
    const initialSet = new Set<string>();
    initialTransitions.forEach((t) => {
      if (t.fromStatusId && t.toStatusId) {
        initialSet.add(`${t.fromStatusId}->${t.toStatusId}`);
      }
    });
    setAllowedTransitions(initialSet);
    setHasChanges(false);
  }, [initialTransitions, statuses]);

  const toggleTransition = (fromId: string, toId: string) => {
    if (!isAdmin || fromId === toId) return;

    const key = `${fromId}->${toId}`;
    setAllowedTransitions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setHasChanges(true);
    setSuccessMessage(null);
  };

  const handleAllowAll = () => {
    if (!isAdmin) return;
    const allSet = new Set<string>();
    statuses.forEach((from) => {
      statuses.forEach((to) => {
        if (from.id !== to.id) {
          allSet.add(`${from.id}->${to.id}`);
        }
      });
    });
    setAllowedTransitions(allSet);
    setHasChanges(true);
  };

  const handleClearAll = () => {
    if (!isAdmin) return;
    setAllowedTransitions(new Set());
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: TransitionItemPayload[] = Array.from(allowedTransitions).map((key) => {
      const [fromStatusId, toStatusId] = key.split('->');
      return { fromStatusId, toStatusId };
    });

    try {
      await onSave(payload);
      setHasChanges(false);
      setSuccessMessage(t('workflow.matrix.saveSuccess'));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || err?.data?.message || t('workflow.matrix.saveFailed'));
    }
  };

  if (!statuses || statuses.length === 0) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          {t('workflow.matrix.emptyStatuses')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-xl font-semibold text-slate-900">
                {t('workflow.matrix.title')}
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 mt-1">
              {t('workflow.matrix.desc')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 sm:hidden">
              <Button
                variant={viewMode === 'matrix' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs rounded-none"
                onClick={() => setViewMode('matrix')}
                title={t('workflow.matrix.matrixView')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs rounded-none"
                onClick={() => setViewMode('cards')}
                title={t('workflow.matrix.cardView')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>

            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAllowAll}
                  disabled={isSaving}
                  className="text-xs"
                >
                  {t('workflow.matrix.allowAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isSaving}
                  className="text-xs"
                >
                  {t('workflow.matrix.clearAll')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('workflow.matrix.saving') : t('workflow.matrix.saveMatrix')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
            <X className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {initialTransitions.length === 0 && !hasChanges && (
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{t('workflow.matrix.defaultNotice')}</span>
          </div>
        )}

        <div
          className={`overflow-x-auto relative border border-slate-200 rounded-lg ${
            viewMode === 'cards' ? 'hidden sm:block' : 'block'
          }`}
        >
          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-semibold text-slate-700 bg-slate-100 min-w-[150px] sticky left-0 z-20 shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                  {t('workflow.matrix.fromTo')}
                </th>
                {statuses.map((toStatus) => (
                  <th
                    key={toStatus.id}
                    className="p-3 font-semibold text-slate-700 text-center min-w-[120px] border-l border-slate-200"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full inline-block"
                          style={{ backgroundColor: toStatus.color || '#3b82f6' }}
                        />
                        <span>{toStatus.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                        {toStatus.category}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((fromStatus) => (
                <tr key={fromStatus.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-900 bg-slate-50 border-r border-slate-200 sticky left-0 z-10 shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: fromStatus.color || '#3b82f6' }}
                      />
                      <div>
                        <div className="font-semibold">{fromStatus.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {fromStatus.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {statuses.map((toStatus) => {
                    const isSame = fromStatus.id === toStatus.id;
                    const isAllowed = allowedTransitions.has(`${fromStatus.id}->${toStatus.id}`);

                    return (
                      <td
                        key={toStatus.id}
                        className={`p-3 text-center border-l border-slate-200 transition-colors ${
                          isSame || !isAdmin
                            ? 'bg-slate-100/60 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-indigo-50/50'
                        }`}
                        onClick={() => isAdmin && !isSame && toggleTransition(fromStatus.id, toStatus.id)}
                      >
                        {isSame ? (
                          <span className="text-slate-300 font-mono text-[10px]">—</span>
                        ) : (
                          <div className="flex justify-center items-center">
                            <input
                              type="checkbox"
                              checked={isAllowed}
                              disabled={!isAdmin}
                              onChange={() => isAdmin && toggleTransition(fromStatus.id, toStatus.id)}
                              aria-label={`Allow transition from ${fromStatus.name} to ${toStatus.name}`}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={`space-y-4 ${
            viewMode === 'cards' ? 'block' : 'block sm:hidden'
          }`}
        >
          {statuses.map((fromStatus) => {
            const validTargets = statuses.filter((s) => s.id !== fromStatus.id);
            return (
              <div
                key={fromStatus.id}
                className="p-4 rounded-lg border border-slate-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: fromStatus.color || '#3b82f6' }}
                    />
                    <span className="font-semibold text-sm text-slate-900">{fromStatus.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {fromStatus.category}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-500">
                    {t('workflow.matrix.allowedTransitions')}:
                  </span>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {validTargets.map((toStatus) => {
                      const isAllowed = allowedTransitions.has(`${fromStatus.id}->${toStatus.id}`);
                      return (
                        <label
                          key={toStatus.id}
                          className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            isAllowed
                              ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-medium'
                              : 'bg-slate-50/50 border-slate-200 text-slate-600'
                          } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: toStatus.color || '#3b82f6' }}
                            />
                            <span>{toStatus.name}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            disabled={!isAdmin}
                            onChange={() => isAdmin && toggleTransition(fromStatus.id, toStatus.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-mono">
            {t('workflow.matrix.activePairs', { count: allowedTransitions.size })}
          </span>
          {hasChanges && (
            <span className="text-amber-600 font-medium animate-pulse">
              {t('workflow.matrix.unsavedChanges')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
