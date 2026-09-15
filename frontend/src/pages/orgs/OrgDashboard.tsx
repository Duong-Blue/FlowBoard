import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { setOrgs, setActiveOrg } from '../../store/slices/orgSlice';
import * as orgService from '../../services/orgService';
import { Button } from '../../components/ui/button';
import { PageLoader } from '../../components/shared/PageLoader';
import { EmptyState } from '../../components/shared/EmptyState';
import { Building2, ChevronRight } from 'lucide-react';
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

  if (loading) {
    return <PageLoader text="Loading organizations..." className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <Button size="sm" onClick={() => navigate('/orgs/new')}>
          + New Organization
        </Button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {!loading && orgs.length === 0 && !error ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to get started."
          action={<Button onClick={() => navigate('/orgs/new')}>Create Organization</Button>}
        />
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-md bg-white">
          {orgs.map((org: Organization) => (
            <div
              key={org.id}
              onClick={() => handleOrgClick(org.id)}
              className="flex items-center justify-between p-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900">{org.name}</span>
                <span className="text-xs text-slate-500 font-mono">{org.slug}</span>
                {org.description && (
                  <span className="text-sm text-slate-600 line-clamp-1">{org.description}</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}