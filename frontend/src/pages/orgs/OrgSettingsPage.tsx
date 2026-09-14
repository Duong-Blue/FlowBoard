import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getOrg, updateOrg as updateOrgApi, deleteOrg as deleteOrgApi } from '../../services/orgService';
import { getOrgMembers } from '../../services/memberService';
import { updateOrg, removeOrg } from '../../store/slices/orgSlice';
import { useAppDispatch, useAppSelector } from '../../store';
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
      
      <form onSubmit={handleUpdate} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Logo URL</label>
          <input
            type="text"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Save Changes
        </button>
      </form>

      {currentUserRole === 'OWNER' && (
        <div className="border border-red-200 rounded p-4 bg-red-50">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting an organization is irreversible. All projects and tasks will be permanently removed.
          </p>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Organization
          </button>
        </div>
      )}

      {isDeleteDialogOpen && currentUserRole === 'OWNER' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the <strong>{org.name}</strong> organization.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
