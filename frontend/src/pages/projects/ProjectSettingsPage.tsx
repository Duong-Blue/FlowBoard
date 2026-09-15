import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateProject, removeProject } from '../../store/slices/projectSlice';
import { getProject, updateProject as updateProjectApi, deleteProject } from '../../services/projectService';
import { getOrgMembers } from '../../services/memberService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
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
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orgId || !projectId || !user) return;
      try {
        setLoading(true);
        const p = await getProject(projectId);
        setName(p.name);
        setDescription(p.description || '');
        setStatus(p.status || 'ACTIVE');

        const members = await getOrgMembers(orgId);
        const me = members.find((m: ProjectMember) => m.userId === user.id);
        setIsAdmin(me?.role === 'ADMIN' || me?.role === 'OWNER');
      } catch (err) {
        console.error(err);
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgId, projectId, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !isAdmin) return;
    try {
      setSaving(true);
      const res = await updateProjectApi(projectId, { name, description, status });
      dispatch(updateProject(res));
      toast.success('Project updated successfully');
    } catch {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!projectId || !isAdmin) return;
    try {
      setSaving(true);
      const res = await updateProjectApi(projectId, { status: 'ARCHIVED' });
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
    if (!projectId || !isAdmin || !orgId) return;
    try {
      setDeleting(true);
      await deleteProject(projectId);
      dispatch(removeProject(projectId));
      toast.success('Project deleted');
      navigate(`/orgs/${orgId}/projects`);
    } catch {
      toast.error('Failed to delete project');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

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
