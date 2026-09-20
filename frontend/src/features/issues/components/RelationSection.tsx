import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  Link2,
  Plus,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';
import type { AppDispatch, RootState, Issue, IssueRelation, RelationType } from '@/store/types';
import { fetchRelations, createRelation, deleteRelation } from '@/store/slices/issueSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface RelationSectionProps {
  projectId: string;
  issueId: string;
  issue?: Issue;
  availableIssues?: Issue[];
}

export type RelationGroupType = 'Blocks' | 'Is Blocked By' | 'Relates To' | 'Duplicates';

export interface DisplayRelation {
  relationId: string;
  group: RelationGroupType;
  rawType: RelationType;
  targetIssueId: string;
  targetIssue?: Partial<Issue>;
  isSource: boolean;
}

const RELATION_GROUP_CONFIG: Record<
  RelationGroupType,
  {
    label: string;
    badgeClass: string;
    borderClass: string;
  }
> = {
  'Blocks': {
    label: 'Blocks',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    borderClass: 'border-rose-200/60 dark:border-rose-900/40',
  },
  'Is Blocked By': {
    label: 'Is Blocked By',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    borderClass: 'border-amber-200/60 dark:border-amber-900/40',
  },
  'Relates To': {
    label: 'Relates To',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    borderClass: 'border-sky-200/60 dark:border-sky-900/40',
  },
  'Duplicates': {
    label: 'Duplicates',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    borderClass: 'border-slate-200/60 dark:border-slate-800/40',
  },
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300',
  IN_PREVIEW: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300',
};

const RELATION_TYPE_OPTIONS: { value: RelationType; label: string }[] = [
  { value: 'BLOCKS', label: 'Blocks' },
  { value: 'IS_BLOCKED_BY', label: 'Is Blocked By' },
  { value: 'RELATES_TO', label: 'Relates To' },
  { value: 'DUPLICATES', label: 'Duplicates' },
];

export function RelationSection({
  projectId,
  issueId,
  issue: propIssue,
  availableIssues: propAvailableIssues,
}: RelationSectionProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType>('BLOCKS');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isRelationsLoading = useSelector((state: RootState) => state.issue.isRelationsLoading);
  const storeIssueList = useSelector((state: RootState) => state.issue.list);
  const storeBoardColumns = useSelector((state: RootState) => state.issue.board.columns);

  const currentIssueFromStore = useSelector((state: RootState) =>
    state.issue.list.find((i) => i.id === issueId || i.key?.toLowerCase() === issueId.toLowerCase())
  );
  const currentIssue = propIssue || currentIssueFromStore;

  const allIssues = useMemo(() => {
    const combinedMap = new Map<string, Issue>();
    if (propAvailableIssues) {
      propAvailableIssues.forEach((i) => combinedMap.set(i.id, i));
    }
    if (storeIssueList) {
      storeIssueList.forEach((i) => combinedMap.set(i.id, i));
    }
    if (storeBoardColumns) {
      Object.values(storeBoardColumns)
        .flat()
        .forEach((i) => combinedMap.set(i.id, i));
    }
    return Array.from(combinedMap.values());
  }, [propAvailableIssues, storeIssueList, storeBoardColumns]);

  useEffect(() => {
    if (projectId && issueId) {
      dispatch(fetchRelations({ projectId, issueId }));
    }
  }, [dispatch, projectId, issueId]);

  const rawRelations: IssueRelation[] = currentIssue?.relations || [];

  const displayRelations = useMemo(() => {
    return rawRelations.map((r): DisplayRelation => {
      const isSource = r.sourceIssueId === issueId;
      const targetId = isSource ? r.targetIssueId : r.sourceIssueId;
      const targetIssueObj = isSource
        ? r.targetIssue || allIssues.find((i) => i.id === targetId)
        : r.sourceIssue || allIssues.find((i) => i.id === targetId);

      let group: RelationGroupType = 'Relates To';
      const typeUpper = r.type?.toUpperCase();

      if (isSource) {
        if (typeUpper === 'BLOCKS') group = 'Blocks';
        else if (typeUpper === 'IS_BLOCKED_BY' || typeUpper === 'BLOCKED_BY') group = 'Is Blocked By';
        else if (typeUpper === 'DUPLICATES') group = 'Duplicates';
        else group = 'Relates To';
      } else {
        if (typeUpper === 'BLOCKS') group = 'Is Blocked By';
        else if (typeUpper === 'IS_BLOCKED_BY' || typeUpper === 'BLOCKED_BY') group = 'Blocks';
        else if (typeUpper === 'DUPLICATES') group = 'Duplicates';
        else group = 'Relates To';
      }

      return {
        relationId: r.id,
        group,
        rawType: r.type,
        targetIssueId: targetId,
        targetIssue: targetIssueObj,
        isSource,
      };
    });
  }, [rawRelations, issueId, allIssues]);

  const groupedRelations = useMemo(() => {
    const groups: Record<RelationGroupType, DisplayRelation[]> = {
      'Blocks': [],
      'Is Blocked By': [],
      'Relates To': [],
      'Duplicates': [],
    };

    displayRelations.forEach((item) => {
      if (groups[item.group]) {
        groups[item.group].push(item);
      }
    });

    return groups;
  }, [displayRelations]);

  const totalCount = displayRelations.length;

  const linkedIssueIds = useMemo(() => {
    const set = new Set<string>();
    displayRelations.forEach((r) => set.add(r.targetIssueId));
    return set;
  }, [displayRelations]);

  const candidateIssues = useMemo(() => {
    return allIssues.filter((i) => {
      // MUST NOT allow selecting current issue as target
      if (i.id === issueId || i.key?.toLowerCase() === issueId.toLowerCase()) {
        return false;
      }
      if (linkedIssueIds.has(i.id)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKey = i.key?.toLowerCase().includes(q);
        const matchTitle = i.title?.toLowerCase().includes(q);
        return matchKey || matchTitle;
      }
      return true;
    });
  }, [allIssues, issueId, linkedIssueIds, searchQuery]);

  const handleCreateRelation = async () => {
    if (!selectedTargetId || !selectedRelationType) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        createRelation({
          projectId,
          issueId,
          targetIssueId: selectedTargetId,
          type: selectedRelationType,
        })
      ).unwrap();
      toast.success('Relation created successfully');
      setIsDialogOpen(false);
      setSelectedTargetId('');
      setSearchQuery('');
    } catch (err: any) {
      const errorText = typeof err === 'string' ? err : err?.message || 'Failed to create relation';
      toast.error(errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelation = async (relationId: string) => {
    setDeletingId(relationId);
    try {
      await dispatch(
        deleteRelation({
          projectId,
          issueId,
          relationId,
        })
      ).unwrap();
      toast.success('Relation removed');
    } catch (err: any) {
      const errorText = typeof err === 'string' ? err : err?.message || 'Failed to delete relation';
      toast.error(errorText);
    } finally {
      setDeletingId(null);
    }
  };

  const groupKeys: RelationGroupType[] = ['Blocks', 'Is Blocked By', 'Relates To', 'Duplicates'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span>Issue Relations</span>
          {totalCount > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
              {totalCount}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="h-8 px-3 gap-1.5 cursor-pointer text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Relation</span>
        </Button>
      </div>

      {/* Loading state */}
      {isRelationsLoading && totalCount === 0 && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading relations...
        </div>
      )}

      {/* Empty State */}
      {!isRelationsLoading && totalCount === 0 && (
        <div className="text-xs text-muted-foreground italic py-2">
          No issue relations yet. Click "Add Relation" to link issues.
        </div>
      )}

      {/* Grouped Relations List */}
      {totalCount > 0 && (
        <div className="space-y-3">
          {groupKeys.map((group) => {
            const items = groupedRelations[group];
            if (!items || items.length === 0) return null;
            const groupConfig = RELATION_GROUP_CONFIG[group];

            return (
              <div key={group} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-semibold tracking-wide ${groupConfig.badgeClass}`}
                  >
                    {groupConfig.label} ({items.length})
                  </Badge>
                </div>

                <div className="space-y-1 pl-1">
                  {items.map((rel) => {
                    const target = rel.targetIssue;
                    const statusClass = target?.status
                      ? STATUS_BADGE_CLASS[target.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={rel.relationId}
                        className={`group flex items-center justify-between gap-3 p-2 rounded-md border bg-card hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${groupConfig.borderClass}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Issue Key Badge */}
                          <Badge
                            variant="outline"
                            className="font-mono text-xs shrink-0 font-semibold bg-slate-50 dark:bg-slate-900"
                          >
                            {target?.key || rel.targetIssueId.substring(0, 8)}
                          </Badge>

                          {/* Status Badge */}
                          {target?.status && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-semibold shrink-0 ${statusClass}`}
                            >
                              {target.status}
                            </Badge>
                          )}

                          {/* Issue Title */}
                          <span
                            className="text-sm font-medium text-foreground truncate"
                            title={target?.title || rel.targetIssueId}
                          >
                            {target?.title || `Issue #${rel.targetIssueId.substring(0, 8)}`}
                          </span>
                        </div>

                        {/* Remove Action Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                          onClick={() => handleDeleteRelation(rel.relationId)}
                          disabled={deletingId === rel.relationId}
                          title="Remove relation"
                          aria-label={`Remove relation to ${target?.key || rel.targetIssueId}`}
                        >
                          {deletingId === rel.relationId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Relation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Issue Relation</DialogTitle>
            <DialogDescription>
              Link this issue ({currentIssue?.key || 'current issue'}) with another issue in the project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Relation Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Relation Type
              </label>
              <Select
                value={selectedRelationType}
                onValueChange={(val) => setSelectedRelationType(val as RelationType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select relation type" />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Issue Search & Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Target Issue
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search issue by key or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>

              {/* Candidate Issue List */}
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-card p-1 space-y-1">
                {candidateIssues.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-3 text-center">
                    No matching issues available to link.
                  </div>
                ) : (
                  candidateIssues.map((candidate) => {
                    const isSelected = selectedTargetId === candidate.id;
                    return (
                      <div
                        key={candidate.id}
                        onClick={() => setSelectedTargetId(candidate.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary border text-primary font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Badge variant="outline" className="font-mono text-xs font-semibold shrink-0">
                            {candidate.key}
                          </Badge>
                          <span className="truncate">{candidate.title}</span>
                        </div>
                        {candidate.status && (
                          <Badge variant="outline" className="text-[10px] shrink-0 uppercase">
                            {candidate.status}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateRelation}
              disabled={!selectedTargetId || isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
