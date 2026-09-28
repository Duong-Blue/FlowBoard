import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/index';
import { fetchProjectActivities } from '../../../store/slices/issueSlice';
import { ActivityItem } from './ActivityItem';
import { Loader2 } from 'lucide-react';

interface ProjectActivityTabProps {
  projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.issue.projectActivities);

  useEffect(() => {
    dispatch(fetchProjectActivities({ projectId }));
  }, [dispatch, projectId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <div className="py-4 text-center text-sm text-red-500">{error}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="py-8 text-center text-sm text-gray-500">No activity yet.</div>;
  }

  return (
    <div className="space-y-4 py-2">
      {items.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
