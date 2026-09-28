import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, UserPlus } from 'lucide-react';
import { useAppSelector } from '@/store';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { OrganizationCard } from './OrganizationCard';
import type { Organization } from '@/store/types';
import { cn } from '@/lib/utils';

export interface OrganizationListProps {
  orgs?: Organization[];
  className?: string;
  onCreateOrg?: () => void;
  onJoinOrg?: () => void;
}

export function OrganizationList({
  orgs: orgsProp,
  className,
  onCreateOrg,
  onJoinOrg,
}: OrganizationListProps) {
  const { t } = useTranslation('workspace');
  const navigate = useNavigate();
  const reduxOrgs = useAppSelector((state) => state.org.list);

  const orgs = orgsProp ?? reduxOrgs;

  const handleCreateOrg = () => {
    if (onCreateOrg) {
      onCreateOrg();
    } else {
      navigate('/workspace/orgs/new');
    }
  };

  const handleJoinOrg = () => {
    if (onJoinOrg) {
      onJoinOrg();
    } else {
      navigate('/workspace/invitations');
    }
  };

  if (!orgs || orgs.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title={t('home.emptyStates.noOrgsTitle')}
        description={t('home.emptyStates.noOrgsDesc')}
        className={cn('my-6 py-12', className)}
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={handleCreateOrg} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>{t('home.actions.createOrg')}</span>
            </Button>
            <Button variant="outline" onClick={handleJoinOrg} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{t('home.actions.joinOrg')}</span>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
        className,
      )}
    >
      {orgs.map((org) => (
        <OrganizationCard key={org.id} org={org} />
      ))}
    </div>
  );
}

export default OrganizationList;
