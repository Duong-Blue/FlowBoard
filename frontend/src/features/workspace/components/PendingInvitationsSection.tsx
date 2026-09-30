import { useState } from 'react';
import { Mail, Check, X, Loader2, Building2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Invitation } from '@/store/types';

export interface PendingInvitationsSectionProps {
  invitations: Invitation[];
  onAccept: (invitation: Invitation) => Promise<void>;
  onDecline: (invitation: Invitation) => Promise<void>;
}

function getInitials(name?: string): string {
  if (!name) return 'ORG';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function PendingInvitationsSection({
  invitations,
  onAccept,
  onDecline,
}: PendingInvitationsSectionProps) {
  const [processingToken, setProcessingToken] = useState<string | null>(null);

  if (!invitations || invitations.length === 0) {
    return null;
  }

  const handleAccept = async (inv: Invitation) => {
    const token = inv.metadata?.token || inv.id;
    setProcessingToken(token);
    try {
      await onAccept(inv);
    } finally {
      setProcessingToken(null);
    }
  };

  const handleDecline = async (inv: Invitation) => {
    const token = inv.metadata?.token || inv.id;
    setProcessingToken(token);
    try {
      await onDecline(inv);
    } finally {
      setProcessingToken(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pending Invitations ({invitations.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {invitations.map((inv) => {
          const orgName = inv.organization?.name || 'Organization';
          const logoUrl = inv.organization?.logoUrl;
          const token = inv.metadata?.token || inv.id;
          const isProcessing = processingToken === token;

          const inviterName = inv.invitedBy
            ? inv.invitedBy.displayName ||
              `${inv.invitedBy.firstName || ''} ${inv.invitedBy.lastName || ''}`.trim()
            : null;

          return (
            <Card
              key={inv.id}
              className="p-4 border-blue-100 bg-blue-50/30 dark:bg-slate-900/80 dark:border-slate-800 shadow-sm"
            >
              <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={orgName}
                      className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-sm border border-blue-200 dark:border-blue-900 shrink-0">
                      {getInitials(orgName)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
                        {orgName}
                      </h3>
                      {inv.role && (
                        <Badge variant="secondary" className="capitalize text-[11px] px-2 py-0.5">
                          {inv.role}
                        </Badge>
                      )}
                    </div>

                    {inviterName ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>Invited by <strong className="font-medium text-slate-700 dark:text-slate-300">{inviterName}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Organization invitation</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(inv)}
                    disabled={isProcessing}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1 text-slate-500" />
                        Decline
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAccept(inv)}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PendingInvitationsSection;
