import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember, getOrgMembers } from '../../services/memberService';
import type { Member } from '../../store/types';
import { useAppSelector } from '../../store';

export default function ProjectMembersPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('VIEWER');

  useEffect(() => {
    if (!orgId || !projectId) return;
    
    const loadMembers = async () => {
      try {
        const [projRes, orgRes] = await Promise.all([
          getProjectMembers(projectId),
          getOrgMembers(orgId)
        ]);
        setProjectMembers(projRes);
        setOrgMembers(orgRes);
      } catch (err) {
        console.error('Failed to load members', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMembers();
  }, [orgId, projectId]);

  const handleAddMember = async () => {
    if (!projectId || !selectedUserId) return;
    try {
      await addProjectMember(projectId, { userId: selectedUserId, role: selectedRole });
      const projRes = await getProjectMembers(projectId);
      setProjectMembers(projRes);
      setSelectedUserId('');
      setSelectedRole('VIEWER');
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    if (!projectId) return;
    try {
      await updateProjectMemberRole(projectId, memberId, role);
      setProjectMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role } : m));
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!projectId) return;
    try {
      await removeProjectMember(projectId, memberId);
      setProjectMembers(prev => prev.filter(m => m.userId !== memberId));
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const currentUserProjectMember = projectMembers.find(m => m.userId === user?.id);
  const isAdmin = currentUserProjectMember?.role === 'ADMIN';

  const availableOrgMembers = orgMembers.filter(om => 
    !projectMembers.some(pm => pm.userId === om.userId)
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Members</h1>
          <p className="text-muted-foreground mt-2">Manage access to this project.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/orgs/${orgId}/projects`)}>
          Back to Projects
        </Button>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Member</CardTitle>
            <CardDescription>Add a member from the organization to this project.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOrgMembers.map(m => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                  {availableOrgMembers.length === 0 && (
                    <SelectItem value="none" disabled>No available users</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedUserId || selectedUserId === 'none'}
            >
              Add
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {projectMembers.map(member => (
          <Card key={member.userId}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <Select
                    value={member.role}
                    onValueChange={(val: string) => handleRoleChange(member.userId, val)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-medium px-2 py-1 rounded bg-secondary">
                    {member.role}
                  </span>
                )}
                
                {isAdmin && member.userId !== user?.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(member.userId)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {projectMembers.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No members found.</p>
        )}
      </div>
    </div>
  );
}
