import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getOrgMembers, updateOrgMemberRole, removeOrgMember } from '../../services/memberService';
import type { Member } from '../../store/types';
import { useAppSelector } from '../../store';

export default function OrgMembersPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!orgId) return;
    loadMembers();
  }, [orgId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrgMembers(orgId!);
      setMembers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load members';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateOrgMemberRole(orgId!, memberId, newRole);
      await loadMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeOrgMember(orgId!, memberId);
      await loadMembers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast.error(message);
    }
  };

  const currentMember = members.find((m: Member) => m.userId === currentUser?.id);
  const isOwnerOrAdmin = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';
  const isOwner = currentMember?.role === 'OWNER';

  if (loading) return <div>Loading members...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Organization Members</h1>
      <div className="bg-white rounded-lg shadow">
        <ul className="divide-y divide-gray-200">
          {members.map((member) => {
            const isSelf = member.userId === currentUser?.id;
            const canManage = isOwnerOrAdmin && !isSelf && (isOwner || member.role !== 'OWNER');

            return (
              <li key={member.userId} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">{member.name[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.name} {isSelf && <span className="text-gray-500">(You)</span>}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {member.role}
                  </span>
                  
                  {canManage && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        {isOwner && <option value="OWNER">Owner</option>}
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}