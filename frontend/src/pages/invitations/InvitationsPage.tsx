import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvitations, sendInvitation, revokeInvitation } from '../../services/invitationService';
import type { Invitation } from '../../store/types';

import { AlertCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function InvitationsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    let isMounted = true;
    getInvitations(orgId)
      .then((data) => {
        if (isMounted) {
          setInvitations(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load invitations');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [orgId]);

  const loadInvitations = async () => {
    if (!orgId) return;
    try {
      const data = await getInvitations(orgId);
      setInvitations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      setSending(true);
      setSendError(null);
      await sendInvitation(orgId, { email, role });
      toast.success('Invitation sent!');
      setEmail('');
      setRole('MEMBER');
      await loadInvitations();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!orgId || !window.confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await revokeInvitation(orgId, invitationId);
      await loadInvitations();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke invitation';
      toast.error(message);
    }
  };

  if (loading) return <PageLoader text="Loading invitations..." />;
  if (error) return <EmptyState icon={AlertCircle} title="Error" description={error} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Organization Invitations</h1>
      
      <div className="bg-white rounded-lg shadow border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-medium mb-4 text-slate-900">Send New Invitation</h2>
        {sendError && <div className="text-red-600 text-sm mb-4">{sendError}</div>}
        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
          </div>
          <div className="w-[180px] space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <h2 className="text-lg font-medium p-6 border-b border-slate-200 text-slate-900">Pending Invitations</h2>
        {invitations.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Mail} title="No pending invitations" description="Invite team members to collaborate." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="bg-white hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{invitation.email}</td>
                    <td className="px-6 py-4">
                      <SemanticBadge status={invitation.role}>{invitation.role}</SemanticBadge>
                    </td>
                    <td className="px-6 py-4">
                      <SemanticBadge status="pending">Pending</SemanticBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(invitation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
