import React, { useState } from 'react';
import { Workflow, Plus, Edit2, Trash2, ListTodo, Clock, Eye, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import {
  useGetWorkflowQuery,
  useCreateStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useUpdateTransitionsMatrixMutation,
  type WorkflowStatus,
  type CreateStatusPayload,
  type UpdateStatusPayload,
  type TransitionItemPayload,
} from '@/store/api/workflowsApi';
import { CreateStatusDialog, DeleteStatusDialog } from './CreateStatusDialog';
import { TransitionMatrix } from './TransitionMatrix';

interface WorkflowSettingsTabProps {
  projectId?: string;
  isAdmin?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  TODO: ListTodo,
  IN_PROGRESS: Clock,
  IN_PREVIEW: Eye,
  DONE: CheckCircle2,
};

const CATEGORY_STYLES: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PREVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const WorkflowSettingsTab: React.FC<WorkflowSettingsTabProps> = ({
  projectId: propProjectId,
  isAdmin = true,
}) => {
  const { projectId: resolvedProjectId, loading: projectLoading } = useResolvedProject();
  const projectId = propProjectId || resolvedProjectId;

  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    error: workflowError,
    refetch,
  } = useGetWorkflowQuery(projectId || '', {
    skip: !projectId,
  });

  const [createStatus] = useCreateStatusMutation();
  const [updateStatus] = useUpdateStatusMutation();
  const [deleteStatus] = useDeleteStatusMutation();
  const [updateTransitionsMatrix, { isLoading: isSavingMatrix }] = useUpdateTransitionsMatrixMutation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<WorkflowStatus | null>(null);

  if (projectLoading || (projectId && isWorkflowLoading)) {
    return <PageLoader text="Loading workflow configuration..." />;
  }

  if (!projectId || workflowError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Failed to load workflow configuration. Please try again.</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const statuses = workflow?.statuses || [];
  const transitions = workflow?.transitions || [];

  const handleCreateStatus = async (data: CreateStatusPayload) => {
    if (!projectId) return;
    await createStatus({ projectId, data }).unwrap();
  };

  const handleUpdateStatus = async (statusId: string, data: UpdateStatusPayload) => {
    if (!projectId) return;
    await updateStatus({ projectId, statusId, data }).unwrap();
  };

  const handleDeleteStatus = async (statusId: string, fallbackStatusId: string) => {
    if (!projectId) return;
    await deleteStatus({ projectId, statusId, fallbackStatusId }).unwrap();
  };

  const handleSaveMatrix = async (newTransitions: TransitionItemPayload[]) => {
    if (!projectId) return;
    await updateTransitionsMatrix({ projectId, transitions: newTransitions }).unwrap();
  };

  const handleOpenEdit = (statusItem: WorkflowStatus) => {
    setEditingStatus(statusItem);
    setCreateDialogOpen(true);
  };

  const handleOpenDelete = (statusItem: WorkflowStatus) => {
    setStatusToDelete(statusItem);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Statuses Section */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Workflow Statuses
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500 mt-1">
                Manage issue lifecycle statuses, categories, and colors for this project.
              </CardDescription>
            </div>

            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingStatus(null);
                  setCreateDialogOpen(true);
                }}
                className="gap-2 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Add Custom Status
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map((statusItem) => {
              const IconComponent = CATEGORY_ICONS[statusItem.category] || Layers;
              const badgeStyle = CATEGORY_STYLES[statusItem.category] || 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={statusItem.id}
                  className="flex flex-col p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-slate-200 shadow-xs"
                        style={{ backgroundColor: statusItem.color || '#3b82f6' }}
                      />
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-slate-900">{statusItem.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={badgeStyle}>
                        {statusItem.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px]">Order: #{statusItem.order}</span>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-slate-900"
                          onClick={() => handleOpenEdit(statusItem)}
                          title="Edit Status"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleOpenDelete(statusItem)}
                          disabled={statuses.length <= 1}
                          title={statuses.length <= 1 ? 'Cannot delete last remaining status' : 'Delete Status'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transition Rules Matrix */}
      <TransitionMatrix
        statuses={statuses}
        initialTransitions={transitions}
        onSave={handleSaveMatrix}
        isSaving={isSavingMatrix}
      />

      {/* Dialog Modals */}
      <CreateStatusDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        editingStatus={editingStatus}
        onSubmitCreate={handleCreateStatus}
        onSubmitUpdate={handleUpdateStatus}
        nextOrder={statuses.length}
      />

      <DeleteStatusDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        statusToDelete={statusToDelete}
        availableStatuses={statuses}
        onConfirmDelete={handleDeleteStatus}
      />
    </div>
  );
};

export default WorkflowSettingsTab;
