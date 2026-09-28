import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronRight, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Organization } from '@/store/types';

export interface CreateProjectOrgSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
}

export const CreateProjectOrgSelectDialog: React.FC<CreateProjectOrgSelectDialogProps> = ({
  open,
  onOpenChange,
  organizations,
}) => {
  const { t } = useTranslation('workspace');
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return 'ORG';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSelectOrg = (org: Organization) => {
    onOpenChange(false);
    navigate(`/workspace/orgs/${org.id}/projects/new`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('home.actions.selectOrg')}</DialogTitle>
          <DialogDescription>
            {t('home.organizations.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
          {organizations.length > 0 ? (
            organizations.map((org) => {
              const memberCount = org.memberCount ?? org._count?.members;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelectOrg(org)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/20">
                        {getInitials(org.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {org.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {org.slug && <span>@{org.slug}</span>}
                        {org.slug && memberCount !== undefined && <span>•</span>}
                        {memberCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {memberCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>{t('sidebar.noOrganizations')}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectOrgSelectDialog;
