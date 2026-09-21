import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Globe, BookmarkPlus } from 'lucide-react';

interface SaveViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, isShared: boolean) => Promise<void>;
  isAdmin: boolean;
  isSaving?: boolean;
}

export const SaveViewModal: React.FC<SaveViewModalProps> = ({
  open,
  onOpenChange,
  onSave,
  isAdmin,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setIsShared(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('View name is required');
      return;
    }

    try {
      setError('');
      await onSave(trimmedName, isShared);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save view');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <BookmarkPlus className="h-5 w-5 text-indigo-600" />
            Save Current View
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs">
            Save your current filters so you can quickly switch back to them later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="view-name" className="text-sm font-medium text-slate-700">
              View Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="view-name"
              placeholder="e.g. My High Priority Bugs"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>

          <div className="space-y-2 pt-1">
            <Label className="text-sm font-medium text-slate-700">Visibility</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsShared(false)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  !isShared
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                  <Lock className="h-3.5 w-3.5 text-indigo-600" />
                  Private View
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Only visible to you
                </span>
              </button>

              <button
                type="button"
                disabled={!isAdmin}
                onClick={() => isAdmin && setIsShared(true)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  !isAdmin
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : isShared
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                title={!isAdmin ? 'Only project admins can create shared views' : undefined}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                  <Globe className={`h-3.5 w-3.5 ${isShared ? 'text-indigo-600' : 'text-slate-500'}`} />
                  Shared View
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {isAdmin ? 'Visible to all project members' : 'Requires Admin role'}
                </span>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? 'Saving...' : 'Save View'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
