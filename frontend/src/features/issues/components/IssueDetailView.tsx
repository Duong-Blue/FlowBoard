import * as React from 'react';
import { type Issue, type IssueUser } from '@/store/types';
import { IssueDetailHeader } from './IssueDetailHeader';
import { IssueDescriptionSection } from './IssueDescriptionSection';
import { IssueMetadataSidebar } from './IssueMetadataSidebar';

interface IssueDetailViewProps {
  issue: Issue;
  members: IssueUser[];
  canDelete?: boolean;
  onUpdate: (data: Partial<Issue>) => Promise<void>;
  onDelete?: () => void;
}

export function IssueDetailView({ issue, members, canDelete, onUpdate, onDelete }: IssueDetailViewProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [title, setTitle] = React.useState(issue.title);

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

              {/* Placeholders for Future Tabs */}
              <div className="pt-8 border-t border-border">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-foreground">Activity</h3>
                  <p className="text-sm text-muted-foreground mt-1">Comments and activity timeline will go here.</p>
                </div>
                {/* 
                  <Tabs>
                    <TabsList>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    ...
                  </Tabs>
                */}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 border-l border-border pl-8">
              <IssueMetadataSidebar 
                issue={issue} 
                members={members} 
                onUpdate={(data) => onUpdate(data)} 
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
