import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Folder } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { SemanticBadge } from '@/components/shared/SemanticBadge';
import type { Organization } from '@/store/types';
import { cn } from '@/lib/utils';

export interface OrganizationCardProps {
  org: Organization;
  className?: string;
  onClick?: () => void;
}

export function getInitials(name?: string): string {
  if (!name) return 'ORG';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function OrganizationCard({ org, className, onClick }: OrganizationCardProps) {
  const { t } = useTranslation('workspace');
  const navigate = useNavigate();

  const projectCount = org.projectCount !== undefined ? org.projectCount : org._count?.projects;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/workspace/orgs/${org.id}`);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    const uppercaseRole = role?.toUpperCase();
    if (uppercaseRole === 'OWNER') {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    }
    if (uppercaseRole === 'ADMIN') {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    }
    if (uppercaseRole === 'MEMBER') {
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
    return undefined;
  };

  const roleKey = org.role?.toLowerCase();
  const translatedRole = roleKey
    ? (t as any)(`home.roles.${roleKey}`, { defaultValue: org.role })
    : undefined;

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 cursor-pointer',
        className,
      )}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-bold text-sm border border-blue-100 dark:border-blue-900 shrink-0">
                {getInitials(org.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {org.name}
              </h3>
              {org.slug && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{org.slug}
                </p>
              )}
            </div>
          </div>

          {org.role && (
            <SemanticBadge
              status={roleKey}
              className={cn('shrink-0 capitalize text-[11px] px-2 py-0.5', getRoleBadgeStyle(org.role))}
            >
              {translatedRole}
            </SemanticBadge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 flex-1">
        {org.description ? (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
            {org.description}
          </p>
        ) : (
          <div className="h-4" />
        )}
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
        {projectCount !== undefined ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Folder className="h-3.5 w-3.5" />
            <span>
              {projectCount} {projectCount === 1 ? t('home.organizations.project') : t('home.organizations.projects')}
            </span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>{t('home.organizations.viewOrg')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default OrganizationCard;
