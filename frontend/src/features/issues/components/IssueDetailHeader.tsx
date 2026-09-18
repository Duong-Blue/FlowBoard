import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';

interface IssueDetailHeaderProps {
  issueKey: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function IssueDetailHeader({ issueKey, canDelete = false, onDelete }: Omit<IssueDetailHeaderProps, 'projectId'>) {
  const navigate = useNavigate();
  const { orgId, projectKey } = useParams<{ orgId?: string; projectKey?: string }>();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);

  const handleBack = () => {
    const targetOrgId = orgId || activeOrgId;

    if (targetOrgId && projectKey) {
      navigate(`/workspace/orgs/${targetOrgId}/projects/${projectKey}/issues`);
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
