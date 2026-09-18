import { useEffect, useRef } from 'react';
import { useSocketContext } from '../providers/SocketProvider';
import { useAppDispatch } from '../store';
import { fetchBoardIssues, reconcileBoardIssue } from '../store/slices/issueSlice';

export function useBoardRealtime(projectId: string | undefined) {
  const { socket, isConnected } = useSocketContext();
  const dispatch = useAppDispatch();
  const processedEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('subscribe:project', { projectId });

    const handleBoardEvent = (data?: { eventId?: string; correlationId?: string; payload?: any }) => {
      const eventId = data?.eventId;
      if (eventId) {
        if (processedEventIdsRef.current.has(eventId)) {
          return;
        }
        processedEventIdsRef.current.add(eventId);
        if (processedEventIdsRef.current.size > 100) {
          const firstKey = processedEventIdsRef.current.values().next().value;
          if (firstKey !== undefined) {
            processedEventIdsRef.current.delete(firstKey);
          }
        }
      }

      const correlationId = data?.correlationId || data?.payload?.correlationId;
      const issue = data?.payload?.issue || data?.payload;

      if (correlationId && issue?.id) {
        dispatch(reconcileBoardIssue({ correlationId, issue }));
      }

      dispatch(fetchBoardIssues(projectId));
    };

    const handleConnect = () => {
      socket.emit('subscribe:project', { projectId });
      dispatch(fetchBoardIssues(projectId));
    };

    const events = [
      'issue.created',
      'issue.updated',
      'issue.moved',
      'issue.deleted',
      'comment.created',
    ];

    events.forEach((event) => {
      socket.on(event, handleBoardEvent);
    });

    socket.on('connect', handleConnect);

    return () => {
      socket.emit('unsubscribe:project', { projectId });
      events.forEach((event) => {
        socket.off(event, handleBoardEvent);
      });
      socket.off('connect', handleConnect);
    };
  }, [socket, projectId, dispatch]);

  return { isConnected };
}
