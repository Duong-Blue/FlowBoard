import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { PageLoader } from '../../components/shared/PageLoader';
import { BoardColumn } from './components/BoardColumn';
import { DragOverlayCard } from './components/DragOverlayCard';
import type { Issue, IssueStatus, Member } from '../../store/types';
import { toast } from 'sonner';
import { LayoutList, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useResolvedProject } from '@/hooks/useResolvedProject';
import { useBoardRealtime } from '@/hooks/useBoardRealtime';
import NotFound from '../NotFound';

const COLUMN_KEY_MAP: Record<IssueStatus, string> = {
  TODO: 'columns.todo',
  IN_PROGRESS: 'columns.inProgress',
  IN_PREVIEW: 'columns.inPreview',
  DONE: 'columns.done',
};

export default function BoardPage() {
  const { t } = useTranslation('issues');
  const { orgId } = useParams<{ orgId: string }>();
  const { project, projectId, loading: projectLoading, is404 } = useResolvedProject();
  const { isConnected } = useBoardRealtime(projectId);
  const dispatch = useAppDispatch();
  const activeOrgId = useAppSelector((state) => state.org.activeOrgId);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { columns, loading } = useAppSelector((state) => state.issue.board);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const COLUMNS: { id: IssueStatus; title: string }[] = [
    { id: 'TODO', title: t(COLUMN_KEY_MAP['TODO'] as any) },
    { id: 'IN_PROGRESS', title: t(COLUMN_KEY_MAP['IN_PROGRESS'] as any) },
    { id: 'IN_PREVIEW', title: t(COLUMN_KEY_MAP['IN_PREVIEW'] as any) },
    { id: 'DONE', title: t(COLUMN_KEY_MAP['DONE'] as any) }
  ];

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role;
  const canDrag = !userRole || userRole === 'ADMIN' || userRole === 'MEMBER';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

    const sourceStatus = activeData.issue.status as IssueStatus;
    let targetStatus: IssueStatus;
    
    // Determine target column
    if (overData?.type === 'Column') {
      targetStatus = overData.columnId as IssueStatus;
    } else if (overData?.type === 'Issue') {
      targetStatus = overData.issue.status as IssueStatus;
    } else {
      return;
    }

    const targetColumnIssues = (columns[targetStatus] || []).filter(i => i.id !== activeId);
    
    // Same position, no change
    if (activeId === overId) return;

    let beforeIssueId: string | null = null;
    let afterIssueId: string | null = null;

    if (overData?.type === 'Issue') {
      const overIndex = targetColumnIssues.findIndex(i => i.id === overId);
      if (overIndex !== -1) {
        // Find if dragging below or above
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        const newIndex = overIndex >= 0 ? overIndex + modifier : overIndex + 1;
        
        if (newIndex <= 0) {
          beforeIssueId = targetColumnIssues[0]?.id || null;
        } else if (newIndex >= targetColumnIssues.length) {
          afterIssueId = targetColumnIssues[targetColumnIssues.length - 1]?.id || null;
        } else {
          // It is between two items
          afterIssueId = targetColumnIssues[newIndex - 1].id;
          beforeIssueId = targetColumnIssues[newIndex].id;
        }
      }
    } else {
      // Dropping onto an empty column or at the end
      if (targetColumnIssues.length > 0) {
        afterIssueId = targetColumnIssues[targetColumnIssues.length - 1].id;
      }
    }

    const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `corr-${Date.now()}`;

    // Dispatch optimistic update
    dispatch(moveCardOptimistic({
      issueId: activeId,
      sourceStatus,
      targetStatus,
      beforeIssueId,
      afterIssueId,
      correlationId
    }));

    try {
      await moveIssue(projectId, activeId, {
        status: targetStatus,
        beforeIssueId,
        afterIssueId
      });
    } catch (err) {
      dispatch(rollbackMove());
      toast.error('Failed to move issue');
    }
  };

  if (projectLoading || (loading && !Object.values(columns).some(col => col.length > 0))) {
    return <PageLoader />;
  }

  if (is404 || !project) {
    return <NotFound />;
  }

  const currentOrgId = orgId || activeOrgId || project.organizationId || project.orgId;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-none pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('board.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
                title={isConnected ? t('board.realtimeConnected') : t('board.disconnected')}
              />
              <span>{isConnected ? t('board.live') : t('board.offline')}</span>
            </div>
            <Button variant="default" className="pointer-events-none opacity-50">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('board.boardView')}
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/workspace/orgs/${currentOrgId}/projects/${project.key}/issues?view=list`}>
                <LayoutList className="mr-2 h-4 w-4" />
                {t('board.listView')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/workspace/orgs/${currentOrgId}/projects/${project.key}/calendar`}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {t('board.calendarView', { defaultValue: 'Calendar' })}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={canDrag ? sensors : undefined}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {COLUMNS.map(col => (
              <BoardColumn
                key={col.id}
                id={col.id}
                title={col.title}
                issues={columns[col.id] || []}
                disabled={!canDrag}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIssue ? <DragOverlayCard issue={activeIssue} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
