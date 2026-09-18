import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setActiveOrg } from '@/store/slices/orgSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface OrganizationSwitcherProps {
  className?: string;
  onSelectOrg?: () => void;
}

export function OrganizationSwitcher({ className, onSelectOrg }: OrganizationSwitcherProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId?: string }>();
  const { list: orgs, activeOrgId } = useAppSelector((state) => state.org);

  const activeOrg =
    orgs.find((o) => o.id === activeOrgId || o.slug === orgId || o.id === orgId) || orgs[0];

  const getInitials = (name?: string) => {
    if (!name) return 'ORG';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSelectOrg = (org: typeof orgs[number]) => {
    dispatch(setActiveOrg(org.id));
    const targetPath = `/workspace/orgs/${org.slug || org.id}/overview`;
    navigate(targetPath);
    onSelectOrg?.();
  };

  const handleCreateOrg = () => {
    navigate('/workspace/orgs/new');
    onSelectOrg?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch organization"
        className={cn(
          'w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl',
          className,
        )}
      >
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeOrg?.logoUrl ? (
              <img
                src={activeOrg.logoUrl}
                alt={activeOrg.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                {getInitials(activeOrg?.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm text-white truncate">
                {activeOrg?.name || 'Select Organization'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {activeOrg?.slug ? `@${activeOrg.slug}` : activeOrg ? 'Organization' : 'No org selected'}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 bg-slate-900 border-slate-800 text-slate-200 p-1 shadow-xl rounded-xl z-50"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Organizations
        </DropdownMenuLabel>
        
        {orgs.length > 0 ? (
          orgs.map((org) => {
            const isSelected = activeOrg?.id === org.id;
            return (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className={cn(
                  'cursor-pointer rounded-lg px-2 py-2 text-sm flex items-center justify-between transition-colors',
                  'hover:bg-slate-800 focus:bg-slate-800 focus:text-white',
                  isSelected && 'bg-slate-800/60 font-medium text-white',
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {getInitials(org.name)}
                  </div>
                  <div className="min-w-0 flex-1 truncate">
                    <div className="truncate text-slate-200">{org.name}</div>
                    {org.slug && <div className="text-[10px] text-slate-500 truncate">@{org.slug}</div>}
                  </div>
                </div>
                {isSelected ? (
                  <Check className="h-4 w-4 text-blue-400 shrink-0 ml-2" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700 ml-2 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>No organizations found</span>
          </div>
        )}

        <DropdownMenuSeparator className="bg-slate-800 my-1" />

        <DropdownMenuItem
          onClick={handleCreateOrg}
          className="cursor-pointer rounded-lg px-2 py-2 text-sm hover:bg-slate-800 focus:bg-slate-800 text-blue-400 focus:text-blue-300 flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OrganizationSwitcher;
