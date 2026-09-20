import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateProject, removeProject } from '../../store/slices/projectSlice';
import { updateProject as updateProjectApi, deleteProject } from '../../services/projectService';
import { getOrgMembers } from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { PageLoader } from '../../components/shared/PageLoader';
import NotFound from '../NotFound';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import type { Member as ProjectMember } from '../../store/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function ProjectSettingsPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status || 'ACTIVE');
  }, [project]);

  useEffect(() => {
    async function loadMembers() {
      if (!currentOrgId || !user) return;
      try {
        setLoading(true);
        const members = await getOrgMembers(currentOrgId);
        const me = members.find((m: ProjectMember) => m.userId === user.id);
        setIsAdmin(me?.role === 'ADMIN' || me?.role === 'OWNER');
      } catch (err) {
        console.error(err);
        toast.error(t('common:status.error'));
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [currentOrgId, user, t]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !currentOrgId || !isAdmin) return;
    try {
      setSaving(true);
      const res = await updateProjectApi(currentOrgId, projectId, { name, description, status });
      dispatch(updateProject(res));
      toast.success(t('common:status.success'));
    } catch {
      toast.error(t('common:status.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!projectId || !currentOrgId || !isAdmin) return;
    try {
      setSaving(true);
      const res = await updateProjectApi(currentOrgId, projectId, { status: 'ARCHIVED' });
      dispatch(updateProject(res));
      setStatus('ARCHIVED');
      toast.success(t('common:status.success'));
    } catch {
      toast.error(t('common:status.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !isAdmin || !currentOrgId) return;
    try {
      setDeleting(true);
      await deleteProject(currentOrgId, projectId);
      dispatch(removeProject(projectId));
      toast.success(t('common:status.success'));
      navigate(`/workspace/orgs/${currentOrgId}/projects`);
    } catch {
      toast.error(t('common:status.error'));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (projectLoading || loading) return <PageLoader text={t('common:status.loading')} />;

  if (is404 || !project) return <NotFound />;

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-2">{t('common:status.error')}</h2>
        <p className="text-muted-foreground">{t('orgSettings.cannotDeleteWithProjects')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('projects.settingsTitle')}</h2>
        <p className="text-muted-foreground">{t('projects.settingsSubtitle')}</p>
      </div>

      <Separator />

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t('orgSettings.generalSettings')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('projects.settingsSubtitle')}</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('projects.nameLabel')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('projects.descriptionLabel')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('common:labels.role')}</Label>
              <Select value={status} onValueChange={setStatus} disabled={saving}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('common:labels.role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('common:status.active')}</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? t('common:buttons.saving') : t('common:buttons.save')}
        </Button>
      </form>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-destructive">{t('orgSettings.dangerZone')}</h3>
          <p className="text-sm text-muted-foreground">{t('orgSettings.deleteOrgDescription')}</p>
        </div>
        
        <div className="border border-red-200 bg-red-50/50 rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Archive Project</p>
              <p className="text-sm text-muted-foreground">{t('projects.settingsSubtitle')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleArchive} disabled={saving || status === 'ARCHIVED'}>
              {status === 'ARCHIVED' ? 'Archived' : 'Archive'}
            </Button>
          </div>
          <Separator className="bg-red-200/50" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">{t('orgSettings.deleteOrgTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('orgSettings.deleteOrgDescription')}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
              {t('common:buttons.delete')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orgSettings.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('orgSettings.deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              {t('common:buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('common:buttons.submitting') : t('common:buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
