import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStatus, WorkflowTransition, TransitionItemPayload } from '@/store/api/workflowsApi';
import { ArrowRight, Save, Info, X, CheckCircle2 } from 'lucide-react';

interface TransitionMatrixProps {
  statuses: WorkflowStatus[];
  initialTransitions: WorkflowTransition[];
  onSave: (transitions: TransitionItemPayload[]) => Promise<void>;
  isSaving: boolean;
}

export const TransitionMatrix: React.FC<TransitionMatrixProps> = ({
  statuses,
  initialTransitions,
  onSave,
  isSaving,
}) => {
  // Key format: "fromStatusId->toStatusId"
  const [allowedTransitions, setAllowedTransitions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (fromId === toId) return; // Prevent self transitions

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
    setAllowedTransitions(new Set());
    setHasChanges(true);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: TransitionItemPayload[] = Array.from(allowedTransitions).map((key) => {
      const [fromStatusId, toStatusId] = key.split('->');
      return { fromStatusId, toStatusId };
    });

    try {
      await onSave(payload);
      setHasChanges(false);
      setSuccessMessage('Transition matrix saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || err?.data?.message || 'Failed to save transition matrix.');
    }
  };

  if (!statuses || statuses.length === 0) {
    return (
      <Card className="border border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          No workflow statuses defined yet. Add statuses above before configuring transition rules.
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
                Transition Rules Matrix
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 mt-1">
              Configure allowed status changes for issues. Checked cells represent valid status movements.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAllowAll}
              disabled={isSaving}
              className="text-xs"
            >
              Allow All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isSaving}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Matrix'}
            </Button>
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
            <span>
              Currently, no explicit restriction rules are saved in the matrix (all status transitions are permitted by default). Customize below and save to enforce specific transition paths.
            </span>
          </div>
        )}

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-semibold text-slate-700 bg-slate-100 min-w-[150px]">
                  From \ To Status
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
                  <td className="p-3 font-medium text-slate-900 bg-slate-50 border-r border-slate-200">
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
                          isSame ? 'bg-slate-100/60 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50/50'
                        }`}
                        onClick={() => !isSame && toggleTransition(fromStatus.id, toStatus.id)}
                      >
                        {isSame ? (
                          <span className="text-slate-300 font-mono text-[10px]">—</span>
                        ) : (
                          <div className="flex justify-center items-center">
                            <input
                              type="checkbox"
                              checked={isAllowed}
                              onChange={() => toggleTransition(fromStatus.id, toStatus.id)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-mono">
            Active transition pairs: {allowedTransitions.size}
          </span>
          {hasChanges && (
            <span className="text-amber-600 font-medium animate-pulse">
              Unsaved changes in matrix
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
