import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, Archive, RefreshCw } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { updateProject as updateProjectAction, removeProject } from '@/store/slices/projectSlice';
import { updateProject as updateProjectApi, deleteProject as deleteProjectApi } from '@/services/projectService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Project } from '@/store/types';

interface DangerZoneTabProps {
  project: Project;
  currentOrgId: string;
  isAdmin: boolean;
  onProjectUpdated?: (updated: Project) => void;
}

export const DangerZoneTab: React.FC<DangerZoneTabProps> = ({
  project,
  currentOrgId,
  isAdmin,
  onProjectUpdated,
}) => {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isArchived = project.status === 'ARCHIVED';
  const [archiving, setArchiving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleToggleArchive = async () => {
    if (!isAdmin || archiving) return;
    const nextStatus = isArchived ? 'ACTIVE' : 'ARCHIVED';
    try {
      setArchiving(true);
      const updated = await updateProjectApi(currentOrgId, project.id, {
        name: project.name,
        description: project.description,
        status: nextStatus,
      });
      dispatch(updateProjectAction(updated));
      if (onProjectUpdated) {
        onProjectUpdated(updated);
      }
      toast.success(
        nextStatus === 'ARCHIVED'
          ? t('projects.archiveSuccess', { defaultValue: 'Project archived successfully.' })
          : t('projects.unarchiveSuccess', { defaultValue: 'Project reactivated successfully.' })
      );
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
      toast.error(t('projects.updateFailed'));
    } finally {
      setArchiving(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setDeleteConfirmName('');
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = (open: boolean) => {
    if (!open) {
      setDeleteConfirmName('');
    }
    setShowDeleteModal(open);
  };

  const handleDelete = async () => {
    if (!isAdmin || deleting || deleteConfirmName !== project.name) return;

    try {
      setDeleting(true);
      await deleteProjectApi(currentOrgId, project.id);
      dispatch(removeProject(project.id));
      toast.success(t('projects.deleteSuccess'));
      navigate(`/workspace/orgs/${currentOrgId}/projects`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('projects.deleteFailed'));
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isDeleteEnabled = deleteConfirmName === project.name && !deleting;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{t('projects.viewOnlyNotice', { defaultValue: 'Only project administrators can perform destructive actions.' })}</span>
        </div>
      )}

      {/* Danger Zone Main Card */}
      <Card className="border border-red-200 bg-red-50/20 dark:bg-red-950/20 dark:border-red-900/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-xl font-semibold text-red-700 dark:text-red-400">
              {t('projects.dangerZone', { defaultValue: 'Danger Zone' })}
            </CardTitle>
          </div>
          <CardDescription className="text-red-600/80 dark:text-red-400/80 mt-1">
            {t('projects.dangerZoneDesc', { defaultValue: 'Irreversible and destructive actions for this project.' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Archive / Reactivate Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Archive className="h-4 w-4 text-amber-500" />
                {isArchived
                  ? t('projects.reactivateProject', { defaultValue: 'Reactivate Project' })
                  : t('projects.archiveProject', { defaultValue: 'Archive Project' })}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArchived
                  ? t('projects.reactivateProjectDesc', { defaultValue: 'Restore this project to active state to allow further edits and issue creation.' })
                  : t('projects.archiveProjectDesc', { defaultValue: 'Mark this project as read-only. Members can view issues but cannot add or update items.' })}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleToggleArchive}
              disabled={!isAdmin || archiving}
              className="shrink-0 flex items-center gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300"
            >
              {archiving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              {isArchived
                ? t('projects.reactivate', { defaultValue: 'Reactivate' })
                : t('projects.archive', { defaultValue: 'Archive' })}
            </Button>
          </div>

          <Separator className="bg-red-200/60 dark:bg-red-900/40" />

          {/* Delete Project Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                {t('projects.deleteProject')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('projects.deleteProjectDesc')}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleOpenDeleteModal}
              disabled={!isAdmin || deleting}
              className="shrink-0 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('projects.deleteProjectButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={handleCloseDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {t('projects.deleteProjectTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600 dark:text-slate-400">
              {t('projects.deleteConfirmDesc', { name: project.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="confirm-project-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('projects.typeToConfirm', { name: project.name })}
            </Label>
            <Input
              id="confirm-project-name"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={t('projects.typeProjectNamePlaceholder')}
              disabled={deleting}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleCloseDeleteModal(false)}
              disabled={deleting}
            >
              {t('projects.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isDeleteEnabled}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? t('projects.deleting') : t('projects.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DangerZoneTab;
