import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBoardIssues, moveCardOptimistic, rollbackMove } from '../../store/slices/issueSlice';
import { moveIssue } from '../../services/issueService';
import { getProjectMembers } from '../../services/memberService';
import { ProjectPageShell } from '@/components/shared/ProjectPageShell';
import { PageLoader } from '../../components/shared/PageLoader';
import { BoardColumn } from './components/BoardColumn';
import { DragOverlayCard } from './components/DragOverlayCard';
import type { Issue, IssueStatus, Member, WorkflowStatus } from '../../store/types';
import { useProjectWorkflow, DEFAULT_CATEGORY_COLORS } from '@/hooks/useProjectWorkflow';
import { toast } from 'sonner';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useBoardRealtime } from '@/hooks/useBoardRealtime';
import NotFound from '../NotFound';

export default function BoardPage() {
  const { t } = useTranslation('issues');
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const { statuses, isLoading: isWorkflowLoading } = useProjectWorkflow(projectId);
  const { isConnected } = useBoardRealtime(projectId);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { columns, loading } = useAppSelector((state) => state.issue.board);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const defaultStatuses: WorkflowStatus[] = useMemo(() => [
    { id: 'TODO', workflowId: '', name: t('columns.todo'), category: 'TODO', order: 0, color: DEFAULT_CATEGORY_COLORS.TODO },
    { id: 'IN_PROGRESS', workflowId: '', name: t('columns.inProgress'), category: 'IN_PROGRESS', order: 1, color: DEFAULT_CATEGORY_COLORS.IN_PROGRESS },
    { id: 'IN_PREVIEW', workflowId: '', name: t('columns.inPreview'), category: 'IN_PREVIEW', order: 2, color: DEFAULT_CATEGORY_COLORS.IN_PREVIEW },
    { id: 'DONE', workflowId: '', name: t('columns.done'), category: 'DONE', order: 3, color: DEFAULT_CATEGORY_COLORS.DONE },
  ], [t]);

  const activeStatuses = useMemo(() => {
    if (statuses && statuses.length > 0) {
      return statuses;
    }
    return defaultStatuses;
  }, [statuses, defaultStatuses]);

  const allIssues = useMemo(() => Object.values(columns).flat(), [columns]);

  const issuesByStatusId = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    activeStatuses.forEach((s) => {
      map[s.id] = [];
    });

    allIssues.forEach((issue) => {
      if (issue.workflowStatusId && map[issue.workflowStatusId]) {
        map[issue.workflowStatusId].push(issue);
      } else {
        const matchingStatus = activeStatuses.find((s) => s.category === issue.status);
        if (matchingStatus && map[matchingStatus.id]) {
          map[matchingStatus.id].push(issue);
        }
      }
    });

    return map;
  }, [allIssues, activeStatuses]);

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role;
  const canDrag = !userRole || userRole === 'ADMIN' || userRole === 'MEMBER';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      dispatch(fetchBoardIssues(projectId));
      try {
        const membersRes = await getProjectMembers(projectId);
        setMembers(membersRes);
      } catch (err) {
        console.error('Failed to load members', err);
      }
    };

    loadData();
  }, [projectId, dispatch]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { issue } = active.data.current ?? {};
    if (issue) setActiveIssue(issue);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over || !projectId) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !activeData.issue) return;

    const sourceStatusObj = activeStatuses.find(s => s.id === activeData.issue.workflowStatusId) || activeStatuses.find(s => s.category === activeData.issue.status);
    const sourceStatusCategory = sourceStatusObj?.category as IssueStatus || 'TODO';
    
    let targetStatusObj: WorkflowStatus | undefined;
    
    // Determine target column
    if (overData?.type === 'Column') {
      targetStatusObj = (overData.status as WorkflowStatus) || activeStatuses.find(s => s.id === overData.columnId || s.category === overData.columnId);
    } else if (overData?.type === 'Issue') {
      targetStatusObj = activeStatuses.find(s => s.id === overData.issue.workflowStatusId) || activeStatuses.find(s => s.category === overData.issue.status);
    } else {
      return;
    }

    if (!targetStatusObj) return;

    const targetWorkflowStatusId = targetStatusObj.id;
    const targetStatusCategory = targetStatusObj.category;

    const targetColumnIssues = (issuesByStatusId[targetWorkflowStatusId] || []).filter(i => i.id !== activeId);
    
    // Same position, no change
    if (activeId === overId) return;

    let beforeIssueId: string | null = null;
    let afterIssueId: string | null = null;

    if (overData?.type === 'Issue') {
      const overIndex = targetColumnIssues.findIndex(i => i.id === overId);
      if (overIndex !== -1) {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        const newIndex = overIndex >= 0 ? overIndex + modifier : overIndex + 1;
        
        if (newIndex <= 0) {
          beforeIssueId = targetColumnIssues[0]?.id || null;
        } else if (newIndex >= targetColumnIssues.length) {
          afterIssueId = targetColumnIssues[targetColumnIssues.length - 1]?.id || null;
        } else {
          afterIssueId = targetColumnIssues[newIndex - 1].id;
          beforeIssueId = targetColumnIssues[newIndex].id;
        }
      }
    } else {
      if (targetColumnIssues.length > 0) {
        afterIssueId = targetColumnIssues[targetColumnIssues.length - 1].id;
      }
    }

    const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `corr-${Date.now()}`;

    // Dispatch optimistic update
    dispatch(moveCardOptimistic({
      issueId: activeId,
      sourceStatus: sourceStatusCategory,
      targetStatus: targetStatusCategory,
      targetWorkflowStatusId,
      beforeIssueId,
      afterIssueId,
      correlationId
    }));

    try {
      await moveIssue(projectId, activeId, {
        status: targetStatusCategory,
        targetWorkflowStatusId,
        beforeIssueId,
        afterIssueId
      });
    } catch (err) {
      console.error('Failed to move issue:', err);
      dispatch(rollbackMove());
      toast.error('Failed to move issue');
    }
  };

  if (projectLoading || isWorkflowLoading || (loading && !Object.values(columns).some(col => col.length > 0))) {
    return <PageLoader />;
  }

  if (is404 || !project) {
    return <NotFound />;
  }

  return (
    <ProjectPageShell
      project={project}
      title={t('board.title')}
      activeView="board"
      fullHeight
      realtimeIndicator={
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
            }`}
            title={isConnected ? t('board.realtimeConnected') : t('board.disconnected')}
          />
          <span>{isConnected ? t('board.live') : t('board.offline')}</span>
        </div>
      }
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={canDrag ? sensors : undefined}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {activeStatuses.map(status => (
              <BoardColumn
                key={status.id}
                status={status}
                issues={issuesByStatusId[status.id] || []}
                disabled={!canDrag}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIssue ? <DragOverlayCard issue={activeIssue} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </ProjectPageShell>
  );
}
