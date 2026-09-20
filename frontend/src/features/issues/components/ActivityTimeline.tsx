import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../store/index';
import { fetchActivities } from '../../../store/slices/issueSlice';
import { ActivityItem } from './ActivityItem';

interface ActivityTimelineProps {
  projectId: string;
  issueId: string;
}

export function ActivityTimeline({ projectId, issueId }: ActivityTimelineProps) {
  const { t } = useTranslation(['issues', 'common']);
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.issue.activities);

  useEffect(() => {
    dispatch(fetchActivities({ projectId, issueId }));
  }, [dispatch, projectId, issueId]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900">{t('detail.activity')}</h3>
      
      {loading && items.length === 0 ? (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-sm text-rose-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500 italic">{t('detail.noActivity', 'No activity recorded yet')}</div>
      ) : (
        <div className="relative space-y-4">
          <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" aria-hidden="true" />
          {items.map((activity) => (
            <div key={activity.id} className="relative">
              <ActivityItem activity={activity} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
