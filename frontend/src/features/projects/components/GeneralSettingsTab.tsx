import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, Lock, AlertTriangle, Info } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { updateProject as updateProjectAction, removeProject } from '@/store/slices/projectSlice';
import { updateProject as updateProjectApi, deleteProject as deleteProjectApi } from '@/services/projectService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface GeneralSettingsTabProps {
  project: Project;
  currentOrgId: string;
  isAdmin: boolean;
  onProjectUpdated?: (updated: Project) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  project,
  currentOrgId,
  isAdmin,
  onProjectUpdated,
}) => {
  const { t } = useTranslation(['workspace', 'common']);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [name, setName] = useState(project.name || '');
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'ACTIVE');
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(project.name || '');
    setDescription(project.description || '');
    setStatus(project.status || 'ACTIVE');
  }, [project]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || saving) return;

    try {
      setSaving(true);
      const updated = await updateProjectApi(currentOrgId, project.id, {
        name,
        description,
        status: status as 'ACTIVE' | 'ARCHIVED',
      });
      dispatch(updateProjectAction(updated));
      if (onProjectUpdated) {
        onProjectUpdated(updated);
      }
      toast.success(t('projects.updateSuccess'));
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error(t('projects.updateFailed'));
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-sm">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{t('projects.viewOnlyNotice')}</span>
        </div>
      )}

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">{t('projects.generalInfo')}</CardTitle>
          <CardDescription className="text-slate-500">
            {t('projects.generalDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="general-settings-form" onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium text-slate-700">
                  {t('projects.projectName')}
                </Label>
                <Input
                  id="projectName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder={t('projects.projectNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="projectKey" className="text-sm font-medium text-slate-700">
                    {t('projects.keyLabel')}
                  </Label>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3" /> {t('projects.readOnly')}
                  </span>
                </div>
                <Input
                  id="projectKey"
                  value={project.key || ''}
                  disabled
                  className="bg-slate-100 text-slate-600 font-mono text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-sm font-medium text-slate-700">
                {t('projects.descriptionLabel')}
              </Label>
              <textarea
                id="projectDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || saving}
                placeholder={t('projects.descriptionPlaceholder')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <Label htmlFor="projectStatus" className="text-sm font-medium text-slate-700">
                {t('projects.statusLabel', { defaultValue: 'Status' })}
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val)}
                disabled={!isAdmin || saving}
              >
                <SelectTrigger id="projectStatus" className="w-full">
                  <SelectValue placeholder={t('projects.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('projects.statusActive')}</SelectItem>
                  <SelectItem value="ARCHIVED">{t('projects.statusArchived')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        {isAdmin && (
          <CardFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
            <Button
              type="submit"
              form="general-settings-form"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? t('projects.saving') : t('projects.saveChanges')}
            </Button>
          </CardFooter>
        )}
      </Card>

      {isAdmin && (
        <Card className="border border-red-200 bg-red-50/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold text-red-700">{t('projects.dangerZone')}</CardTitle>
            </div>
            <CardDescription className="text-red-600/80">
              {t('projects.dangerZoneDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator className="bg-red-200/60" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-slate-900">{t('projects.deleteProject')}</h4>
                <p className="text-xs text-slate-500">
                  {t('projects.deleteProjectDesc')}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleOpenDeleteModal}
                disabled={deleting}
                className="shrink-0 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('projects.deleteProjectButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={handleCloseDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('projects.deleteProjectTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600">
              {t('projects.deleteConfirmDesc', { name: project.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="confirm-project-name" className="text-xs font-semibold text-slate-700">
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

export default GeneralSettingsTab;
