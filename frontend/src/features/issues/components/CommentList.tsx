import type { Comment } from '../../../services/issueService';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  projectId: string;
  currentUserId: string;
  userRole: string;
}

export function CommentList({ comments, projectId, currentUserId, userRole }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No comments yet. Be the first to add one!
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          projectId={projectId}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      ))}
    </div>
  );
}
