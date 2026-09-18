import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { getProject } from '../services/projectService';
import { type Project, type RootState } from '../store/types';

export const useResolvedProject = () => {
  const { orgId, projectKey } = useParams<{ orgId: string; projectKey: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  
  const projects = useAppSelector((state: RootState) => state.project.list);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ orgId: string; projectKey: string } | null>(null);

  useEffect(() => {
    if (!orgId || !projectKey) return;

    // Check Redux first - always re-render if projects change
    const found = projects.find((p: Project) => 
      (p.organizationId || p.orgId) === orgId && 
      p.key?.toLowerCase() === projectKey.toLowerCase()
    );

    if (found) {
      setProject(found);
      // Reset other states when found in Redux
      setLoading(false);
      setIs404(false);
      setError(null);
      // Do NOT update lastRequestRef here, as this is a Redux lookup, not a network call.
      // The network deduplication logic is handled within fetchProject.
    } else {
      // API Fetch if not found in Redux
      const fetchProject = async () => {
        // Deduplication check for network calls
        if (lastRequestRef.current?.orgId === orgId && lastRequestRef.current?.projectKey === projectKey) {
            // If the same request was just made, do nothing.
            // This prevents redundant network calls if the component re-renders before the previous fetch completes.
            return;
        }
        
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setIs404(false); // Reset 404 state when initiating a new fetch

        try {
          const data = await getProject(orgId, projectKey);
          // Check if the request was aborted before setting state
          if (abortControllerRef.current?.signal.aborted) return; 
          setProject(data);
          lastRequestRef.current = { orgId, projectKey }; // Update last request ref after successful fetch
        } catch (err: any) {
          // Check if the request was aborted before setting state
          if (abortControllerRef.current?.signal.aborted) return; 
          if (err?.response?.status === 404) {
            setIs404(true);
          } else {
            setError(err?.message || 'Failed to fetch project');
          }
        } finally {
          // Check if the request was aborted before setting state
          if (abortControllerRef.current?.signal.aborted) return; 
          setLoading(false);
        }
      };

      fetchProject();
    }

    return () => {
      // Abort ongoing fetch request when component unmounts or dependencies change
      abortControllerRef.current?.abort();
      // Clean up ref to prevent memory leaks
      abortControllerRef.current = null; 
    };
  }, [orgId, projectKey, projects]);

  return { project, projectId: project?.id, loading, error, is404 };
};
