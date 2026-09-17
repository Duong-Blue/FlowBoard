import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface IssueDetailHeaderProps {
  issueKey: string;
  projectId: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function IssueDetailHeader({ issueKey, projectId, canDelete = false, onDelete }: IssueDetailHeaderProps) {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId?: string }>();

  const handleBack = () => {
    if (orgId && projectId) {
      navigate(`/orgs/${orgId}/projects/${projectId}/board`);
    } else {
      navigate(`/projects/${projectId}/board`);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-border">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back to Board</span>
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          {issueKey}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {canDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Issue
          </Button>
        )}
      </div>
    </div>
  );
}
