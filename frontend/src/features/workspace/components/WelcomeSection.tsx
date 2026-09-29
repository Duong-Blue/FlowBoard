import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, FolderPlus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Organization } from '@/store/types';
import { cn } from '@/lib/utils';
import { CreateProjectOrgSelectDialog } from './CreateProjectOrgSelectDialog';

export interface WelcomeSectionProps {
  userName?: string;
  organizations?: Organization[];
  className?: string;
  onCreateOrg?: () => void;
  onJoinOrg?: () => void;
  onCreateProject?: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  organizations = [],
  className,
  onCreateOrg,
  onJoinOrg,
  onCreateProject,
}) => {
  const { t } = useTranslation('workspace');
  const navigate = useNavigate();
  const [isOrgSelectOpen, setIsOrgSelectOpen] = useState(false);

  const orgList = organizations ?? [];
  const displayName = userName?.trim();
  const greetingText = displayName
    ? t('home.welcome.greeting', { name: displayName })
    : t('home.welcome.greeting', { name: '' }).replace(/,\s*$/, '').trim() || t('home.welcome.title');

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
      navigate('/workspace/join');
    }
  };

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
      return;
    }

    if (orgList.length === 0) {
      handleCreateOrg();
    } else if (orgList.length === 1) {
      const singleOrg = orgList[0];
      navigate(`/workspace/orgs/${singleOrg.id}/projects/new`);
    } else {
      setIsOrgSelectOpen(true);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/40 dark:to-slate-900 p-6 md:p-8 shadow-sm transition-all',
        className
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {greetingText}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-300">
            {t('home.welcome.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            type="button"
            onClick={handleCreateProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-sm"
          >
            <FolderPlus className="h-4 w-4" />
            <span>{t('home.actions.createProject')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCreateOrg}
            className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{t('home.actions.createOrg')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleJoinOrg}
            className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <UserPlus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{t('home.actions.joinOrg')}</span>
          </Button>
        </div>
      </div>

      <CreateProjectOrgSelectDialog
        open={isOrgSelectOpen}
        onOpenChange={setIsOrgSelectOpen}
        organizations={orgList}
      />
    </div>
  );
};

export default WelcomeSection;
