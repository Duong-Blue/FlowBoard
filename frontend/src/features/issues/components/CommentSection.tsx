import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../store/types';
import { fetchComments } from '../../../store/slices/issueSlice';
import { CommentComposer } from './CommentComposer';
import { CommentList } from './CommentList';

interface CommentSectionProps {
  projectId: string;
  issueId: string;
  userRole?: string;
}

export function CommentSection({ projectId, issueId, userRole = 'MEMBER' }: CommentSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const comments = useSelector((state: RootState) => state.issue.comments.items);
  const totalComments = useSelector((state: RootState) => state.issue.comments.meta.total);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    dispatch(fetchComments({ projectId, issueId }));
  }, [dispatch, projectId, issueId]);

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-sm font-semibold text-slate-900">
        Comments ({totalComments})
      </h3>
      
      {currentUser && (
        <div className="flex gap-4">
          <div className="flex-1">
            <CommentComposer projectId={projectId} issueId={issueId} />
          </div>
        </div>
      )}

      <CommentList
        comments={comments}
        projectId={projectId}
        currentUserId={currentUser?.id || ''}
        userRole={userRole}
      />
    </div>
  );
}
