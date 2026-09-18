import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { SemanticBadge } from '../../components/shared/SemanticBadge';
import { getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember, getOrgMembers } from '../../services/memberService';
import type { Member } from '../../store/types';
import { useAppSelector } from '../../store';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import NotFound from '../NotFound';

export default function ProjectMembersPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('VIEWER');

  const currentOrgId = orgId || activeOrgId || project?.organizationId || project?.orgId;

  useEffect(() => {
    if (!currentOrgId || !projectId) return;
    
    const loadMembers = async () => {
      try {
        const [projRes, orgRes] = await Promise.all([
          getProjectMembers(projectId),
          getOrgMembers(currentOrgId)
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
  }, [currentOrgId, projectId]);

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

  if (projectLoading || loading) return <PageLoader />;
  if (is404 || !project) return <NotFound />;

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
        <Button variant="outline" onClick={() => navigate(`/workspace/orgs/${currentOrgId}/projects`)}>
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

      <div className="border border-slate-200 rounded-md divide-y divide-slate-200 bg-white">
        {projectMembers.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Users} title="No members found" description="Add members to get started." className="border-none" />
          </div>
        ) : (
          projectMembers.map(member => (
            <div key={member.userId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 text-xs bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-medium">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{member.name}</span>
                  <span className="text-xs text-slate-500">{member.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <Select
                    value={member.role}
                    onValueChange={(val: string) => handleRoleChange(member.userId, val)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <SemanticBadge status={member.role.toLowerCase()}>{member.role}</SemanticBadge>
                )}
                
                {isAdmin && member.userId !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    onClick={() => handleRemove(member.userId)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
