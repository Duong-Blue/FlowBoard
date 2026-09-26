import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, Loader2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember, getOrgMembers } from '../../services/memberService';
import type { Member } from '../../store/types';
import { useAppSelector } from '../../store';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import NotFound from '../NotFound';

export default function ProjectMembersPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('VIEWER');
  
  const [adding, setAdding] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  useEffect(() => {
    if (!currentOrgId || !projectId) return;
    let isMounted = true;
    
    const loadMembers = async () => {
      try {
        const [projRes, orgRes] = await Promise.all([
          getProjectMembers(projectId),
          getOrgMembers(currentOrgId),
        ]);
        if (isMounted) {
          setProjectMembers(projRes);
          setOrgMembers(orgRes);
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast.error(err instanceof Error ? err.message : t('common:status.error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [currentOrgId, projectId, t]);

  const handleAddMember = async () => {
    if (!projectId || !selectedUserId || adding) return;
    const targetOrgMember = orgMembers.find(m => m.userId === selectedUserId);
    if (!targetOrgMember) return;

    const optimisticMember: Member = {
      userId: targetOrgMember.userId,
      name: targetOrgMember.name,
      email: targetOrgMember.email,
      role: selectedRole,
    };

    setAdding(true);
    setProjectMembers(prev => [...prev, optimisticMember]);
    setSelectedUserId('');

    try {
      await addProjectMember(projectId, { userId: optimisticMember.userId, role: optimisticMember.role });
      const projRes = await getProjectMembers(projectId);
      setProjectMembers(projRes);
      toast.success(t('common:status.success'));
    } catch (err: unknown) {
      setProjectMembers(prev => prev.filter(m => m.userId !== optimisticMember.userId));
      setSelectedUserId(optimisticMember.userId);
      toast.error(err instanceof Error ? err.message : t('common:status.error'));
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!projectId || updatingRoleId) return;
    const previousMember = projectMembers.find(m => m.userId === memberId);
    if (!previousMember || previousMember.role === newRole) return;

    setUpdatingRoleId(memberId);
    setProjectMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role: newRole } : m));

    try {
      await updateProjectMemberRole(projectId, memberId, newRole);
      toast.success(t('common:status.success'));
    } catch (err: unknown) {
      setProjectMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role: previousMember.role } : m));
      toast.error(err instanceof Error ? err.message : t('common:status.error'));
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const confirmRemove = async () => {
    if (!projectId || !memberToRemove || removingId) return;
    const targetMember = memberToRemove;
    const targetId = targetMember.userId;

    if (targetId === user?.id) {
      toast.error(t('projects.cannotRemoveSelf', 'Cannot remove yourself from the project'));
      setMemberToRemove(null);
      return;
    }

    const previousMembers = [...projectMembers];
    setMemberToRemove(null);
    setRemovingId(targetId);

    setProjectMembers(prev => prev.filter(m => m.userId !== targetId));

    try {
      await removeProjectMember(projectId, targetId);
      toast.success(t('common:status.success'));
    } catch (err: unknown) {
      setProjectMembers(previousMembers);
      toast.error(err instanceof Error ? err.message : t('common:status.error'));
    } finally {
      setRemovingId(null);
    }
  };

  if (projectLoading || loading) return <PageLoader text={t('common:status.loading')} />;
  if (is404 || !project) return <NotFound />;

  const currentUserProjectMember = projectMembers.find(m => m.userId === user?.id);
  const isAdmin = currentUserProjectMember?.role === 'ADMIN';

  const availableOrgMembers = orgMembers.filter(om => 
    !projectMembers.some(pm => pm.userId === om.userId)
  );

  return (
    <ProjectPageShell
      project={project}
      title={t('projects.membersTitle')}
      subtitle={t('projects.membersSubtitle')}
      activeView="members"
    >
      <div className="max-w-4xl space-y-6 mt-2">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{t('projects.addMember')}</CardTitle>
              <CardDescription>{t('projects.membersSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {availableOrgMembers.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-1">
                  {t('common:emptyState.noResults')}
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                  <div className="flex-1">
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                      disabled={adding}
                    >
                      <SelectTrigger aria-label={t('projects.selectUser')}>
                        <SelectValue placeholder={t('projects.selectUser')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrgMembers.map(m => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.name} ({m.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full sm:w-40">
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                      disabled={adding}
                    >
                      <SelectTrigger aria-label={t('common:labels.role')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">{t('orgMembers.roleAdmin')}</SelectItem>
                        <SelectItem value="MEMBER">{t('orgMembers.roleMember')}</SelectItem>
                        <SelectItem value="VIEWER">{t('orgMembers.roleViewer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleAddMember} 
                    disabled={!selectedUserId || adding}
                    className="w-full sm:w-auto"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common:buttons.submitting', 'Adding...')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('common:buttons.create')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-white">
          {projectMembers.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={Users} title={t('orgMembers.noMembers')} description={t('projects.membersSubtitle')} className="border-none" />
            </div>
          ) : (
            projectMembers.map(member => {
              const isSelf = member.userId === user?.id;
              const isMemberUpdating = updatingRoleId === member.userId;
              const isMemberRemoving = removingId === member.userId;

              return (
                <div key={member.userId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate">{member.name}</span>
                      <span className="text-xs text-slate-500 truncate">{member.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {isAdmin ? (
                      <Select
                        value={member.role}
                        onValueChange={(val: string) => handleRoleChange(member.userId, val)}
                        disabled={isMemberUpdating || isMemberRemoving}
                      >
                        <SelectTrigger 
                          className="w-28 h-8 text-xs"
                          aria-label={`Role for ${member.name}`}
                        >
                          {isMemberUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-slate-500" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">{t('orgMembers.roleAdmin')}</SelectItem>
                          <SelectItem value="MEMBER">{t('orgMembers.roleMember')}</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SemanticBadge status={member.role.toLowerCase()}>{member.role}</SemanticBadge>
                    )}
                    
                    {isAdmin && !isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        onClick={() => setMemberToRemove(member)}
                        disabled={isMemberRemoving || isMemberUpdating}
                        aria-label={`Remove ${member.name} from project`}
                      >
                        {isMemberRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          t('common:buttons.remove')
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects.confirmRemoveTitle')}</DialogTitle>
            <DialogDescription className="py-2 text-sm text-slate-600">
              {memberToRemove && (
                <>
                  {t('projects.confirmRemovePrefix')} <strong>{memberToRemove.name}</strong> ({memberToRemove.role}) {t('projects.confirmRemoveSuffix')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              {t('common:buttons.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              {t('common:buttons.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectPageShell>
  );
}
