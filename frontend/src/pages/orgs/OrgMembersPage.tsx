import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { getOrgMembers, updateOrgMemberRole, removeOrgMember } from '../../services/memberService';
import type { Member } from '../../store/types';
import { useAppSelector } from '../../store';

export default function OrgMembersPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!orgId) return;
    let isMounted = true;
    getOrgMembers(orgId)
      .then((data) => {
        if (isMounted) {
          setMembers(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t('common:status.error'));
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [orgId, t]);

  const loadMembers = async () => {
    if (!orgId) return;
    try {
      const data = await getOrgMembers(orgId);
      setMembers(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common:status.error'));
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateOrgMemberRole(orgId!, memberId, newRole);
      await loadMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common:status.error');
      toast.error(message);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm(t('common:buttons.confirm'))) return;
    try {
      await removeOrgMember(orgId!, memberId);
      await loadMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common:status.error');
      toast.error(message);
    }
  };

  const currentMember = members.find((m: Member) => m.userId === currentUser?.id);
  const isOwnerOrAdmin = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';
  const isOwner = currentMember?.role === 'OWNER';

  if (loading) return <PageLoader text={t('common:status.loading')} />;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('orgMembers.title')}</h1>
      <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-white">
        {members.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Users} title={t('orgMembers.noMembers')} description={t('orgMembers.subtitle')} className="border-none" />
          </div>
        ) : (
          members.map((member) => {
            const isSelf = member.userId === currentUser?.id;
            const canManage = isOwnerOrAdmin && !isSelf && (isOwner || member.role !== 'OWNER');

            return (
              <div key={member.userId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 text-xs bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-medium">
                    {member.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {member.name} {isSelf && <span className="text-slate-500 font-normal">{t('orgMembers.you')}</span>}
                    </span>
                    <span className="text-xs text-slate-500">{member.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {canManage ? (
                    <Select
                      value={member.role}
                      onValueChange={(val: string) => handleRoleChange(member.userId, val)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isOwner && <SelectItem value="OWNER">{t('orgMembers.roleOwner')}</SelectItem>}
                        <SelectItem value="ADMIN">{t('orgMembers.roleAdmin')}</SelectItem>
                        <SelectItem value="MEMBER">{t('orgMembers.roleMember')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <SemanticBadge status={member.role.toLowerCase()}>{member.role}</SemanticBadge>
                  )}
                  
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                      onClick={() => handleRemove(member.userId)}
                    >
                      {t('common:buttons.remove')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}