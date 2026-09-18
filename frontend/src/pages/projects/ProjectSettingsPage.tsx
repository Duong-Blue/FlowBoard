import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [currentOrgId, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !currentOrgId || !isAdmin) return;
    try {
      setSaving(true);
      const res = await updateProjectApi(currentOrgId, projectId, { name, description, status });
      dispatch(updateProject(res));
      toast.success('Project updated successfully');
    } catch {
      toast.error('Failed to update project');
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
      toast.success('Project archived');
    } catch {
      toast.error('Failed to archive project');
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
      toast.success('Project deleted');
      navigate(`/workspace/orgs/${currentOrgId}/projects`);
    } catch {
      toast.error('Failed to delete project');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (projectLoading || loading) return <PageLoader />;

  if (is404 || !project) return <NotFound />;

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only project administrators can view or modify settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
        <p className="text-muted-foreground">Manage project details and preferences.</p>
      </div>

      <Separator />

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">General</h3>
          <p className="text-sm text-muted-foreground mb-4">Basic project information.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={saving}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">Irreversible actions for this project.</p>
        </div>
        
        <div className="border border-red-200 bg-red-50/50 rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Archive Project</p>
              <p className="text-sm text-muted-foreground">Mark this project as read-only.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleArchive} disabled={saving || status === 'ARCHIVED'}>
              {status === 'ARCHIVED' ? 'Archived' : 'Archive'}
            </Button>
          </div>
          <Separator className="bg-red-200/50" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Project</p>
              <p className="text-sm text-muted-foreground">Permanently delete this project and all its data.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{name}" and remove all associated data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, delete project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
