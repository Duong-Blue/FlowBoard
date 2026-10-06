import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { milestoneService, type MilestoneDetail } from '@/services/milestoneService';
import { getIssues, updateIssue } from '@/services/issueService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

interface MilestoneDetailDrawerProps {
  milestone: { id: string, projectId: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MilestoneDetailDrawer: React.FC<MilestoneDetailDrawerProps> = ({ milestone, isOpen, onClose }) => {
  const [detail, setDetail] = useState<MilestoneDetail | null>(null);
  const [availableIssues, setAvailableIssues] = useState<any[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');

  const loadMilestone = () => {
    if (milestone?.id && milestone?.projectId) {
      milestoneService.getOne(milestone.projectId, milestone.id)
        .then(setDetail)
        .catch(() => toast.error('Failed to load milestone details'));
    }
  };

  const loadIssues = () => {
    if (milestone?.projectId) {
      getIssues(milestone.projectId, { limit: 100 } as any)
        .then(res => {
          setAvailableIssues(res?.items || []);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (isOpen && milestone?.id) {
      loadMilestone();
      loadIssues();
    } else {
      setDetail(null);
      setSelectedIssueId('');
    }
  }, [milestone?.id, isOpen]);

  const handleAssign = async () => {
    if (!selectedIssueId || !milestone) return;
    try {
      await milestoneService.assignIssues(milestone.projectId, milestone.id, [selectedIssueId]);
      toast.success('Issue assigned to milestone');
      setSelectedIssueId('');
      loadMilestone();
      loadIssues();
    } catch (error) {
      toast.error('Failed to assign issue');
    }
  };

  const handleUnassign = async (issueId: string) => {
    if (!milestone) return;
    try {
      await updateIssue(milestone.projectId, issueId, { milestoneId: null });
      toast.success('Issue removed from milestone');
      loadMilestone();
      loadIssues();
    } catch (error) {
      toast.error('Failed to remove issue');
    }
  };

  const unassignedIssues = availableIssues.filter(i => i.milestoneId !== milestone?.id);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>{detail?.name || 'Milestone Details'}</SheetTitle>
          <SheetDescription>
            {detail?.description || 'No description provided.'}
          </SheetDescription>
        </SheetHeader>
        
        {detail ? (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span>{Math.round(detail.progress || 0)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${detail.progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{detail.completedIssues || 0} of {detail.totalIssues || 0} issues completed</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Issues ({detail.issues?.length || 0})</h4>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedIssueId} onValueChange={setSelectedIssueId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an issue to attach" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedIssues.length > 0 ? (
                      unassignedIssues.map(issue => (
                        <SelectItem key={issue.id} value={issue.id}>
                          {issue.key ? `${issue.key} - ` : ''}{issue.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No available issues
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedIssueId || selectedIssueId === 'none'}>Attach</Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {detail.issues?.map((issue) => (
                  <Card key={issue.id} className="p-3 text-sm flex justify-between items-center group">
                    <div>
                      <span className="font-medium">{issue.key ? `${issue.key} ` : ''}{issue.title}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{issue.status}</Badge>
                        <Badge variant="secondary">{issue.type}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 text-red-500 h-8"
                      onClick={() => handleUnassign(issue.id)}
                    >
                      Remove
                    </Button>
                  </Card>
                ))}
                {(!detail.issues || detail.issues.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No issues assigned</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        )}

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
