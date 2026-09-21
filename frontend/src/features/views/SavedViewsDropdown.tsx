import React, { useEffect, useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bookmark, Lock, Globe, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSavedViews,
  createSavedView,
  deleteSavedView,
  type SavedView,
} from '@/services/savedViewService';
import { SaveViewModal } from './SaveViewModal';

interface SavedViewsDropdownProps {
  projectId: string;
  currentFilters: Record<string, any>;
  onApplyView: (filters: Record<string, any>, view?: SavedView) => void;
  userRole?: string;
  currentUserId?: string;
}

export const SavedViewsDropdown: React.FC<SavedViewsDropdownProps> = ({
  projectId,
  currentFilters,
  onApplyView,
  userRole,
  currentUserId,
}) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  const loadSavedViews = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getSavedViews(projectId);
      setViews(data);
    } catch (err: any) {
      console.error('Failed to load saved views:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSavedViews();
  }, [loadSavedViews]);

  const handleSelectView = (view: SavedView) => {
    setActiveViewId(view.id);
    onApplyView(view.filterJson, view);
    toast.success(`Applied view "${view.name}"`);
  };

  const handleClearActiveView = () => {
    setActiveViewId(null);
    onApplyView({});
    toast.info('Cleared view filters');
  };

  const handleSaveView = async (name: string, isShared: boolean) => {
    if (!projectId) return;
    try {
      setIsSaving(true);
      // Clean filter object: exclude pagination defaults if needed, or pass currentFilters directly
      const cleanFilters: Record<string, any> = {};
      Object.entries(currentFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
          cleanFilters[key] = val;
        }
      });

      const newView = await createSavedView(projectId, {
        name,
        filterJson: cleanFilters,
        isShared,
      });

      toast.success(`Saved view "${name}"`);
      await loadSavedViews();
      setActiveViewId(newView.id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save view');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteView = async (e: React.MouseEvent, view: SavedView) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!confirm(`Are you sure you want to delete "${view.name}"?`)) return;

    try {
      await deleteSavedView(projectId, view.id);
      toast.success(`Deleted view "${view.name}"`);
      if (activeViewId === view.id) {
        setActiveViewId(null);
      }
      setViews((prev) => prev.filter((v) => v.id !== view.id));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete view');
    }
  };

  const canDeleteView = (view: SavedView) => {
    if (view.isShared) {
      return isAdmin;
    }
    return view.createdById === currentUserId;
  };

  const activeView = views.find((v) => v.id === activeViewId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium border-slate-200">
            <Bookmark className={`h-3.5 w-3.5 ${activeView ? 'fill-indigo-600 text-indigo-600' : 'text-slate-500'}`} />
            <span className="max-w-[120px] truncate">
              {activeView ? activeView.name : 'Saved Views'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-2 py-1.5">
            Saved Views
          </DropdownMenuLabel>

          {loading ? (
            <div className="p-3 text-xs text-center text-slate-400">Loading views...</div>
          ) : views.length === 0 ? (
            <div className="p-3 text-xs text-center text-slate-400">No saved views yet</div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {views.map((view) => {
                const isActive = activeViewId === view.id;
                const deletable = canDeleteView(view);
                return (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => handleSelectView(view)}
                    className={`flex items-center justify-between group px-2 py-1.5 text-xs cursor-pointer ${
                      isActive ? 'bg-indigo-50 font-medium text-indigo-900' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {view.isShared ? (
                        <span title="Shared View"><Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" /></span>
                      ) : (
                        <span title="Private View"><Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" /></span>
                      )}
                      <span className="truncate">{view.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      {deletable && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteView(e, view)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-600 text-slate-400 transition-opacity p-0.5"
                          title="Delete view"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}

          <DropdownMenuSeparator />

          {activeViewId && (
            <DropdownMenuItem
              onClick={handleClearActiveView}
              className="text-xs text-slate-600 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reset to Default View
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setSaveModalOpen(true)}
            className="text-xs text-indigo-600 font-medium cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Save Current Filters as View...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SaveViewModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveView}
        isAdmin={isAdmin}
        isSaving={isSaving}
      />
    </>
  );
};
