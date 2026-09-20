import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['workspace', 'common']);
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
        toast.error(t('common:status.error'));
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) {
      loadData();
    }
  }, [orgId, user?.id, t]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      const updated = await updateOrgApi(orgId, { name, description, logoUrl });
      dispatch(updateOrg(updated));
      toast.success(t('orgSettings.successMessage'));
    } catch (error) {
      console.error('Update failed', error);
      toast.error(t('common:status.error'));
    }
  };

  const handleDelete = async () => {
    if (!orgId) return;
    try {
      await deleteOrgApi(orgId);
      dispatch(removeOrg(orgId));
      navigate('/workspace');
    } catch (error) {
      console.error('Delete failed', error);
      toast.error(t('orgSettings.cannotDeleteWithProjects'));
    }
  };

  if (loading) return <div>{t('common:status.loading')}</div>;
  if (!org) return <div>{t('sidebar.noOrganizations')}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('orgSettings.title')}</h2>
        <p className="text-muted-foreground">{t('orgSettings.subtitle')}</p>
      </div>

      <Separator />

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t('orgSettings.generalSettings')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('orgSettings.subtitle')}</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('orgSettings.nameLabel')}</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t('orgSettings.descriptionLabel')}</Label>
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
          {t('common:buttons.save')}
        </Button>
      </form>

      {currentUserRole === 'OWNER' && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-destructive">{t('orgSettings.dangerZone')}</h3>
              <p className="text-sm text-muted-foreground">{t('orgSettings.deleteOrgDescription')}</p>
            </div>
            
            <div className="border border-red-200 bg-red-50/50 rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">{t('orgSettings.deleteOrgTitle')}</p>
                  <p className="text-sm text-muted-foreground">{t('orgSettings.deleteOrgDescription')}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  {t('common:buttons.delete')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orgSettings.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('orgSettings.deleteConfirmDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common:buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('orgSettings.deleteOrgButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
