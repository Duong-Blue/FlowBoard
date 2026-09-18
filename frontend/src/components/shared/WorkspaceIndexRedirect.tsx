import { useOutletContext, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { PageLoader } from '@/components/shared/PageLoader';

export function WorkspaceIndexRedirect() {
  const { isInit } = useOutletContext<{ isInit: boolean }>();
  const list = useAppSelector((state) => state.org.list);

  if (!isInit) {
    return <PageLoader text="Loading workspace..." className="min-h-[400px]" />;
  }

  if (list.length > 0) {
    const firstOrg = list[0];
    const orgIdentifier = firstOrg.slug || firstOrg.id;
    return <Navigate to={`/workspace/orgs/${orgIdentifier}/overview`} replace />;
  }

  return <Navigate to="/workspace/orgs/new" replace />;
}

export default WorkspaceIndexRedirect;
