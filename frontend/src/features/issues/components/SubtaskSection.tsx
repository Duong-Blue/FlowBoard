import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { CheckSquare, Plus, Check, Square, User, Trash2 } from 'lucide-react';
import type { AppDispatch, RootState } from '@/store/types';
import type { Issue } from '@/store/types';
import { createSubtask, updateIssueStatus, deleteSubtask } from '@/store/slices/issueSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProjectWorkflow } from '@/hooks/useProjectWorkflow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface SubtaskSectionProps {
  projectId: string;
  issueId: string;
  subtasks?: Issue[];
}

export function SubtaskSection({ projectId, issueId, subtasks: propSubtasks }: SubtaskSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();
  const { getStatusById, getDefaultStatusId } = useProjectWorkflow(projectId);
  const [newTitle, setNewTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = React.useState<Issue | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const issueFromStore = useSelector((state: RootState) =>
    state.issue.list.find((i) => i.id === issueId)
  );

  const subtasks = propSubtasks ?? issueFromStore?.subtasks ?? [];

  const isSubtaskDone = React.useCallback((s: Issue) => {
    if (s.workflowStatusId) {
      const wfStatus = getStatusById(s.workflowStatusId);
      if (wfStatus) return wfStatus.category === 'DONE';
    }
    if (s.workflowStatus?.category) {
      return s.workflowStatus.category === 'DONE';
    }
    return s.status === 'DONE' || s.status === 'COMPLETED';
  }, [getStatusById]);

  const total = subtasks.length;
  const completed = subtasks.filter(isSubtaskDone).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleCreateSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const titleTrimmed = newTitle.trim();
    if (!titleTrimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const defaultTodoStatusId = getDefaultStatusId('TODO');
      await dispatch(
        createSubtask({
          projectId,
          issueId,
          data: {
            title: titleTrimmed,
            status: 'TODO',
            workflowStatusId: defaultTodoStatusId,
          },
        })
      ).unwrap();
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create subtask:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (subtask: Issue) => {
    const isDone = isSubtaskDone(subtask);
    const newStatus = isDone ? 'TODO' : 'DONE';
    const newWfStatusId = getDefaultStatusId(newStatus);
    try {
      await dispatch(
        updateIssueStatus({
          projectId,
          issueId: subtask.id,
          status: newStatus,
          workflowStatusId: newWfStatusId,
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to update subtask status:', err);
    }
  };

  const handleDeleteSubtask = async (targetSubtask: Issue, force = false) => {
    try {
      setIsDeleting(true);
      await dispatch(
        deleteSubtask({
          projectId,
          issueId,
          subtaskId: targetSubtask.id,
          force,
        })
      ).unwrap();
      setSubtaskToDelete(null);
    } catch (err: unknown) {
      const error = err as any;
      if (error?.status === 409 || error?.data?.requiresConfirmation) {
        setSubtaskToDelete(targetSubtask);
      } else {
        console.error('Failed to delete subtask:', error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span>Subtasks</span>
          </div>
          {total > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              {completed} of {total} ({percentage}%)
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>

      {/* Checklist */}
      {subtasks.length > 0 && (
        <ul className="space-y-1 divide-y divide-border/40 rounded-md border border-border/50 bg-card p-1">
          {subtasks.map((subtask) => {
            const isDone = isSubtaskDone(subtask);
            const assigneeName = subtask.assignee?.displayName || 
              (subtask.assignee?.firstName ? `${subtask.assignee.firstName} ${subtask.assignee.lastName || ''}`.trim() : subtask.assignee?.email);
            const initials = assigneeName
              ? assigneeName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
              : '?';

            const issueLink = orgId && (projectKey || projectId)
              ? `/workspace/orgs/${orgId}/projects/${projectKey || projectId}/issues/${subtask.id}`
              : '#';

            return (
              <li
                key={subtask.id}
                className="group flex items-center justify-between gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(subtask)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors hover:border-primary cursor-pointer"
                    aria-label={`Mark "${subtask.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-transparent" />
                    )}
                  </button>

                  {issueLink !== '#' ? (
                    <Link
                      to={issueLink}
                      className={`text-sm truncate hover:underline ${
                        isDone
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground font-medium'
                      }`}
                    >
                      {subtask.title}
                    </Link>
                  ) : (
                    <span
                      className={`text-sm truncate ${
                        isDone
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground font-medium'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Assignee indicator / avatar */}
                  {subtask.assignee && (
                    <div className="flex items-center shrink-0" title={assigneeName}>
                      <Avatar className="h-6 w-6">
                        {subtask.assignee.avatarUrl ? (
                          <AvatarImage src={subtask.assignee.avatarUrl} alt={assigneeName} />
                        ) : null}
                        <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700">
                          {initials !== '?' ? initials : <User className="h-3 w-3" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSubtask(subtask, false)}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label={`Delete "${subtask.title}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Inline Creation Form */}
      <form onSubmit={handleCreateSubtask} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Add a subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isSubmitting}
          className="h-8 text-sm flex-1"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={!newTitle.trim() || isSubmitting}
          className="h-8 px-3 gap-1 shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </form>

      <Dialog open={!!subtaskToDelete} onOpenChange={(open) => !open && setSubtaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Issue with Subtasks</DialogTitle>
            <DialogDescription>
              This issue has subtasks. Deleting it will permanently remove all of its subtasks as well.
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubtaskToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => subtaskToDelete && handleDeleteSubtask(subtaskToDelete, true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
