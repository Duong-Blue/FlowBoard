import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Milestone } from '@/services/milestoneService';

interface MilestoneDetailDrawerProps {
  milestone: Milestone | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MilestoneDetailDrawer: React.FC<MilestoneDetailDrawerProps> = ({ milestone, isOpen, onClose }) => {
  if (!milestone) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{milestone.name}</SheetTitle>
          <SheetDescription>
            {milestone.description || 'No description provided.'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-sm">{milestone.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Target Date</p>
            <p className="text-sm">{milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
