import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAppDispatch } from '@/store';
import { updateIssueStatus } from '@/store/slices/issueSlice';
import { type Issue, type IssueUser } from '@/store/types';
import { IssueDetailHeader } from './IssueDetailHeader';
import { IssueDescriptionSection } from './IssueDescriptionSection';
import { AttachmentSection } from './AttachmentSection';
import { SubtaskSection } from './SubtaskSection';
import { RelationSection } from './RelationSection';
import { CommentSection } from './CommentSection';
import { ActivityTimeline } from './ActivityTimeline';
import { IssueMetadataSidebar } from './IssueMetadataSidebar';

interface IssueDetailViewProps {
  issue: Issue;
  members: IssueUser[];
  canDelete?: boolean;
  onUpdate: (data: Partial<Issue>) => Promise<void>;
  onDelete?: () => void;
}

export function IssueDetailView({ issue, members, canDelete, onUpdate, onDelete }: IssueDetailViewProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation('issues');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [title, setTitle] = React.useState(issue.title);
  const [activeTab, setActiveTab] = React.useState<'comments' | 'activity'>('comments');

  React.useEffect(() => {
    if (!isEditingTitle) {
      setTitle(issue.title);
    }
  }, [issue.title, isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== issue.title && title.trim()) {
      onUpdate({ title: title.trim() });
    } else {
      setTitle(issue.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setTitle(issue.title);
      setIsEditingTitle(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === issue.status) return;
    try {
      await dispatch(
        updateIssueStatus({
          projectId: issue.projectId,
          issueId: issue.id,
          status: newStatus,
        })
      ).unwrap();
      toast.success(t('detail.statusUpdated', 'Status updated successfully'));
      await onUpdate({ status: newStatus });
    } catch (err: unknown) {
      const error = err as any;
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === 'string' ? error : 'Invalid or blocked status transition');
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <IssueDetailHeader 
        issueKey={issue.key} 
        canDelete={canDelete} 
        onDelete={onDelete} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title */}
              <div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    className="w-full text-2xl font-bold text-foreground bg-background border border-border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <h1 
                    className="text-2xl font-bold text-foreground cursor-text hover:bg-slate-50 px-3 py-1 rounded-md border border-transparent hover:border-border transition-colors -ml-3"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {issue.title}
                  </h1>
                )}
              </div>

              {/* Description */}
              <IssueDescriptionSection 
                issue={issue} 
                onUpdate={(desc) => onUpdate({ description: desc })} 
              />

              {/* Subtasks */}
              <div className="pt-6 border-t border-border">
                <SubtaskSection projectId={issue.projectId} issueId={issue.id} subtasks={issue.subtasks} />
              </div>

              {/* Issue Relations */}
              <div className="pt-6 border-t border-border">
                <RelationSection projectId={issue.projectId} issueId={issue.id} issue={issue} />
              </div>

              {/* Attachments */}
              <div className="pt-6 border-t border-border">
                <AttachmentSection projectId={issue.projectId} issueId={issue.id} />
              </div>

              <div className="pt-8 border-t border-border">
                <div className="flex items-center space-x-4 border-b border-border pb-2 mb-6">
                  <button
                    type="button"
                    className={`text-sm font-semibold transition-colors pb-2 -mb-2 border-b-2 ${
                      activeTab === 'comments'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('comments')}
                  >
                    {t('detail.comments', 'Comments')}
                  </button>
                  <button
                    type="button"
                    className={`text-sm font-semibold transition-colors pb-2 -mb-2 border-b-2 ${
                      activeTab === 'activity'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab('activity')}
                  >
                    {t('detail.activity', 'Activity')}
                  </button>
                </div>

                {activeTab === 'comments' && (
                  <CommentSection projectId={issue.projectId} issueId={issue.id} />
                )}
                {activeTab === 'activity' && (
                  <ActivityTimeline projectId={issue.projectId} issueId={issue.id} />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-border pt-8 lg:pt-0 lg:pl-8">
              <IssueMetadataSidebar 
                issue={issue} 
                members={members} 
                onUpdate={(data) => onUpdate(data)} 
                onStatusChange={handleStatusChange}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
