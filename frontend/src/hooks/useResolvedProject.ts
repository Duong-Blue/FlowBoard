import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { getProject } from '../services/projectService';
import { type Project, type RootState } from '../store/types';

export const useResolvedProject = () => {
  const { orgId, projectKey } = useParams<{ orgId: string; projectKey: string }>();
  const orgs = useAppSelector((state: RootState) => state.org.list);
  const projects = useAppSelector((state: RootState) => state.project.list);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(orgId && projectKey));
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!orgId || !projectKey) return;

    const matchingOrg = orgs.find((o) => o.id === orgId || o.slug === orgId);
    const targetOrgId = matchingOrg?.id || orgId;

    const found = projects.find((p: Project) => 
      (p.key?.toLowerCase() === projectKey.toLowerCase() || p.id === projectKey) &&
      ((p.organizationId || p.orgId) === targetOrgId || (p.organizationId || p.orgId) === orgId)
    );

    if (found) {
      setProject(found);
      setLoading(false);
      setIs404(false);
      setError(null);
    } else {
      const fetchProject = async () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);
        setIs404(false);

        try {
          const data = await getProject(orgId, projectKey);
          if (abortControllerRef.current?.signal.aborted) return; 
          setProject(data);
        } catch (err: any) {
          if (abortControllerRef.current?.signal.aborted) return; 
          if (err?.response?.status === 404 || err?.status === 404) {
            setIs404(true);
          } else {
            setError(err?.message || 'Failed to fetch project');
          }
        } finally {
          if (abortControllerRef.current?.signal.aborted) return; 
          setLoading(false);
        }
      };

      fetchProject();
    }

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null; 
    };
  }, [orgId, projectKey, projects, orgs]);

  return { project, projectId: project?.id, loading, error, is404 };
};
