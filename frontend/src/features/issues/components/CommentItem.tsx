import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import { updateComment, deleteComment } from '../../../store/slices/issueSlice';
import type { Comment } from '../../../services/issueService';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Edit2, Trash2, X, Check } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  projectId: string;
  currentUserId: string;
  userRole: string;
}

export function CommentItem({ comment, projectId, currentUserId, userRole }: CommentItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authorName = comment.author
    ? (comment.author.displayName || `${comment.author.firstName} ${comment.author.lastName}`)
    : 'Deleted User';

  const authorInitials = comment.author
    ? (comment.author.displayName?.[0] || comment.author.firstName[0] || '?').toUpperCase()
    : '?';

  const canEditOrDelete = currentUserId === comment.authorId || userRole === 'ADMIN';

  const handleSave = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        updateComment({
          projectId,
          issueId: comment.issueId,
          commentId: comment.id,
          content: editContent,
        })
      ).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await dispatch(
          deleteComment({
            projectId,
            issueId: comment.issueId,
            commentId: comment.id,
          })
        ).unwrap();
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  return (
    <div className="flex gap-4 py-4">
      <Avatar className="h-8 w-8 mt-1">
        {comment.author && <AvatarImage src={comment.author.avatarUrl} alt={authorName} />}
        <AvatarFallback>{authorInitials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">{authorName}</span>
            <span className="text-xs text-slate-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
            {comment.createdAt !== comment.updatedAt && (
              <span className="text-xs text-slate-400">(edited)</span>
            )}
          </div>
          {canEditOrDelete && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-rose-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50"
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isSubmitting}
              >
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!editContent.trim() || isSubmitting}>
                <Check className="mr-1 h-3 w-3" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</div>
        )}
      </div>
    </div>
  );
}
