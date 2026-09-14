import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { setOrgs, setActiveOrg } from '../../store/slices/orgSlice';
import * as orgService from '../../services/orgService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import type { RootState, Organization } from '../../store/types';

export default function OrgDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list: orgs, loading } = useSelector((state: RootState) => state.org);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await orgService.getOrgs();
        dispatch(setOrgs(data));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      }
    };
    fetchOrgs();
  }, [dispatch]);

  const handleOrgClick = (orgId: string) => {
    dispatch(setActiveOrg(orgId));
    navigate(`/orgs/${orgId}/projects`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <Button onClick={() => navigate('/orgs/new')}>+ New Organization</Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {!loading && orgs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg border-gray-200">
          <h2 className="text-xl font-semibold mb-2">No organizations yet</h2>
          <p className="text-gray-500 mb-4">Create your first organization to get started.</p>
          <Button onClick={() => navigate('/orgs/new')}>Create Organization</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org: Organization) => (
          <Card 
            key={org.id} 
            className="cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => handleOrgClick(org.id)}
          >
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              {org.description && <CardDescription>{org.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Slug: {org.slug}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
