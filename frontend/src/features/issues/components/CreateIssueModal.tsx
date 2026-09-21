import { IssueFormDialog } from '@/pages/projects/components/IssueFormDialog';
import type { Issue, Member } from '@/store/types';

export interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: Issue;
  members: Member[];
  onSubmit: (data: Partial<Issue>) => Promise<void>;
}

export function CreateIssueModal(props: CreateIssueModalProps) {
  return <IssueFormDialog {...props} />;
}

export default CreateIssueModal;
