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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(project.name || '');
    setDescription(project.description || '');
    setStatus(project.status || 'ACTIVE');
  }, [project]);

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
      toast.success(t('common:status.success', 'Project settings updated successfully'));
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error(t('common:status.error', 'Failed to update project settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || deleting) return;

    try {
      setDeleting(true);
      await deleteProjectApi(currentOrgId, project.id);
      dispatch(removeProject(project.id));
      toast.success(t('common:status.success', 'Project deleted successfully'));
      navigate(`/workspace/orgs/${currentOrgId}/projects`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('common:status.error', 'Failed to delete project'));
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-sm">
          <Lock className="h-4 w-4 shrink-0" />
          <span>You have view-only access to project settings. Only project or organization administrators can make changes.</span>
        </div>
      )}

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">General Information</CardTitle>
          <CardDescription className="text-slate-500">
            Update your project details and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="general-settings-form" onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium text-slate-700">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin || saving}
                  placeholder="e.g. Frontend Redesign"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="projectKey" className="text-sm font-medium text-slate-700">
                    Project Key
                  </Label>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Read-only
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
                Description
              </Label>
              <textarea
                id="projectDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || saving}
                placeholder="Brief summary of what this project covers..."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <Label htmlFor="projectStatus" className="text-sm font-medium text-slate-700">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val)}
                disabled={!isAdmin || saving}
              >
                <SelectTrigger id="projectStatus" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        )}
      </Card>

      {isAdmin && (
        <Card className="border border-red-200 bg-red-50/30 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold text-red-700">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-600/80">
              Irreversible actions for this project. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator className="bg-red-200/60" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium text-slate-900">Delete Project</h4>
                <p className="text-xs text-slate-500">
                  Permanently remove this project and all associated issues, tasks, and data.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="shrink-0 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{project.name}</span>? This action is permanent and cannot be undone. All issues and project data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralSettingsTab;
