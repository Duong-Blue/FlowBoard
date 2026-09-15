import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getOrg, updateOrg as updateOrgApi, deleteOrg as deleteOrgApi } from '../../services/orgService';
import { getOrgMembers } from '../../services/memberService';
import { updateOrg, removeOrg } from '../../store/slices/orgSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import type { Organization, Member as OrgMember, RootState } from '../../store/types';

export default function OrgSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: RootState) => state.auth.user);

  const [org, setOrg] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orgId) return;
      try {
        const orgData = await getOrg(orgId);
        setOrg(orgData);
        setName(orgData.name);
        setDescription(orgData.description || '');
        setLogoUrl(orgData.logoUrl || '');

        const members = await getOrgMembers(orgId);
        const currentUserMember = members.find((m: OrgMember) => m.userId === user?.id);
        if (currentUserMember) {
          setCurrentUserRole(currentUserMember.role);
        }
      } catch (error) {
        console.error('Error loading org', error);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) {
      loadData();
    }
  }, [orgId, user?.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      const updated = await updateOrgApi(orgId, { name, description, logoUrl });
      dispatch(updateOrg(updated));
      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Update failed', error);
      toast.error('Failed to update organization');
    }
  };

  const handleDelete = async () => {
    if (!orgId) return;
    try {
      await deleteOrgApi(orgId);
      dispatch(removeOrg(orgId));
      navigate('/');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error('Failed to delete organization');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!org) return <div>Organization not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-muted-foreground">Manage organization details and preferences.</p>
      </div>

      <Separator />

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">General</h3>
          <p className="text-sm text-muted-foreground mb-4">Basic organization information.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button type="submit">
          Save Changes
        </Button>
      </form>

      {currentUserRole === 'OWNER' && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Irreversible actions for this organization.</p>
            </div>
            
            <div className="border border-red-200 bg-red-50/50 rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Organization</p>
                  <p className="text-sm text-muted-foreground">Permanently delete this organization and all its projects.</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the 
              <strong> {org.name}</strong> organization and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Yes, delete organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
