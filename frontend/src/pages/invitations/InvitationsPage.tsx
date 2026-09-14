import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvitations, sendInvitation, revokeInvitation } from '../../services/invitationService';
import type { Invitation } from '../../store/types';

import { toast } from 'sonner';

export default function InvitationsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    loadInvitations();
  }, [orgId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInvitations(orgId!);
      setInvitations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      setSending(true);
      setSendError(null);
      setSendSuccess(false);
      await sendInvitation(orgId, { email, role });
      setSendSuccess(true);
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

  if (loading) return <div>Loading invitations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Organization Invitations</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Send New Invitation</h2>
        {sendError && <div className="text-red-600 mb-4">{sendError}</div>}
        {sendSuccess && <div className="text-green-600 mb-4">Invitation sent successfully!</div>}
        <form onSubmit={handleSend} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium p-6 border-b">Pending Invitations</h2>
        {invitations.length === 0 ? (
          <div className="p-6 text-gray-500">No pending invitations.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {invitation.role}
                  </span>
                  <button
                    onClick={() => handleRevoke(invitation.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
