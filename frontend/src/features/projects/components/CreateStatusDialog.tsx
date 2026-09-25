import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IssueStatus } from '@/store/types';
import type { WorkflowStatus, CreateStatusPayload, UpdateStatusPayload } from '@/store/api/workflowsApi';
import { AlertCircle, Trash2 } from 'lucide-react';

const CATEGORY_OPTIONS: { label: string; value: IssueStatus }[] = [
  { label: 'To Do (Backlog / Open)', value: 'TODO' },
  { label: 'In Progress (Active Work)', value: 'IN_PROGRESS' },
  { label: 'In Preview (Review / QA)', value: 'IN_PREVIEW' },
  { label: 'Done (Completed)', value: 'DONE' },
];

const PRESET_COLORS = [
  '#64748b', // Slate
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStatus?: WorkflowStatus | null;
  onSubmitCreate: (data: CreateStatusPayload) => Promise<void>;
  onSubmitUpdate: (statusId: string, data: UpdateStatusPayload) => Promise<void>;
  nextOrder?: number;
}

export const CreateStatusDialog: React.FC<CreateStatusDialogProps> = ({
  open,
  onOpenChange,
  editingStatus,
  onSubmitCreate,
  onSubmitUpdate,
  nextOrder = 0,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IssueStatus>('TODO');
  const [color, setColor] = useState('#3b82f6');
  const [order, setOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStatus) {
      setName(editingStatus.name);
      setCategory(editingStatus.category);
      setColor(editingStatus.color || '#3b82f6');
      setOrder(editingStatus.order);
    } else {
      setName('');
      setCategory('TODO');
      setColor('#3b82f6');
      setOrder(nextOrder);
    }
    setError(null);
  }, [editingStatus, open, nextOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Status name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingStatus) {
        await onSubmitUpdate(editingStatus.id, {
          name: name.trim(),
          color,
          order: Number(order),
        });
      } else {
        await onSubmitCreate({
          name: name.trim(),
          category,
          color,
          order: Number(order),
        });
      }
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Failed to save status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingStatus ? 'Edit Status' : 'Create Custom Status'}</DialogTitle>
          <DialogDescription>
            {editingStatus
              ? 'Update the status properties for your project workflow.'
              : 'Add a new workflow status step for tracking issues.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status-name" className="text-xs font-semibold text-slate-700">
              Status Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="status-name"
              placeholder="e.g. In Code Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {!editingStatus && (
            <div className="space-y-2">
              <Label htmlFor="status-category" className="text-xs font-semibold text-slate-700">
                Category Group <span className="text-red-500">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as IssueStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-order" className="text-xs font-semibold text-slate-700">
                Display Order
              </Label>
              <Input
                id="status-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-color" className="text-xs font-semibold text-slate-700">
                Color Tag
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="status-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-10 p-1 rounded border border-slate-200 cursor-pointer bg-white"
                  disabled={isSubmitting}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono text-xs uppercase"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-slate-500">Color Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-slate-900 ring-2 ring-indigo-500 ring-offset-1' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingStatus ? 'Update Status' : 'Create Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusToDelete: WorkflowStatus | null;
  availableStatuses: WorkflowStatus[];
  onConfirmDelete: (statusId: string, fallbackStatusId: string) => Promise<void>;
}

export const DeleteStatusDialog: React.FC<DeleteStatusDialogProps> = ({
  open,
  onOpenChange,
  statusToDelete,
  availableStatuses,
  onConfirmDelete,
}) => {
  const [fallbackStatusId, setFallbackStatusId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validFallbacks = availableStatuses.filter((s) => s.id !== statusToDelete?.id);

  useEffect(() => {
    if (validFallbacks.length > 0) {
      setFallbackStatusId(validFallbacks[0].id);
    } else {
      setFallbackStatusId('');
    }
    setError(null);
  }, [statusToDelete, open]);

  const handleDelete = async () => {
    if (!statusToDelete || !fallbackStatusId) {
      setError('Please select a valid fallback status.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirmDelete(statusToDelete.id, fallbackStatusId);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Failed to delete status');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <DialogTitle className="text-red-950">Delete Status</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Are you sure you want to delete status{' '}
            <span className="font-semibold text-slate-900">"{statusToDelete?.name}"</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed space-y-1">
            <p className="font-semibold">Reassignment Required</p>
            <p className="text-amber-800">
              Any issues currently assigned to this status must be reassigned to a replacement fallback status.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback-status" className="text-xs font-semibold text-slate-700">
              Select Fallback Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={fallbackStatusId}
              onValueChange={setFallbackStatusId}
              disabled={isDeleting || validFallbacks.length === 0}
            >
              <SelectTrigger id="fallback-status">
                <SelectValue placeholder="Select fallback status" />
              </SelectTrigger>
              <SelectContent>
                {validFallbacks.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name} ({status.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !fallbackStatusId}
          >
            {isDeleting ? 'Deleting...' : 'Delete & Reassign Issues'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
