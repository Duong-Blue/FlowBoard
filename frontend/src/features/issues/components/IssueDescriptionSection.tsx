import * as React from 'react';
import { Button } from '@/components/ui/button';
import { type Issue } from '@/store/types';

interface IssueDescriptionSectionProps {
  issue: Issue;
  onUpdate: (description: string) => Promise<void>;
}

export function IssueDescriptionSection({ issue, onUpdate }: IssueDescriptionSectionProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState(issue.description || '');
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state if issue description changes externally when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setContent(issue.description || '');
    }
  }, [issue.description, isEditing]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(content);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update description:', error);
      // We could add toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(issue.description || '');
    setIsEditing(false);
  };

  if (!isEditing && !issue.description) {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
        <Button 
          variant="outline" 
          className="w-full text-muted-foreground border-dashed h-24"
          onClick={() => setIsEditing(true)}
        >
          Add a description...
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground">Description</h3>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="w-full min-h-[200px] p-3 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
            placeholder="Add a description..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
          />
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="text-sm text-foreground whitespace-pre-wrap rounded-md p-3 border border-transparent hover:border-border hover:bg-slate-50 transition-colors cursor-text min-h-[100px]"
          onClick={() => setIsEditing(true)}
        >
          {issue.description}
        </div>
      )}
    </div>
  );
}
