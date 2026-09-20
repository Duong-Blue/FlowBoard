import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { type Issue } from '../../../store/types';
import type { Member } from '../../../store/types';

interface IssueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: Issue;
  members: Member[];
  onSubmit: (data: Partial<Issue>) => Promise<void>;
}

export function IssueFormDialog({ open, onOpenChange, issue, members, onSubmit }: IssueFormDialogProps) {
  const { t } = useTranslation(['issues', 'common']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TASK');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(issue?.title || '');
      setDescription(issue?.description || '');
      setType(issue?.type || 'TASK');
      setStatus(issue?.status || 'TODO');
      setPriority(issue?.priority || 'MEDIUM');
      setAssigneeId(issue?.assigneeId || 'unassigned');
    }
  }, [open, issue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    setLoading(true);
    try {
      await onSubmit({
        title,
        description,
        type,
        status,
        priority,
        assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{issue ? t('form.editTitle') : t('form.createTitle')}</DialogTitle>
            <DialogDescription>
              {issue ? t('form.editTitle') : t('form.createTitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t('form.titleLabel')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('form.titlePlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('form.descriptionLabel')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">{t('form.typeLabel')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={t('form.typeLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">{t('types.task')}</SelectItem>
                  <SelectItem value="BUG">{t('types.bug')}</SelectItem>
                  <SelectItem value="FEATURE">{t('types.story')}</SelectItem>
                  <SelectItem value="IMPROVEMENT">{t('types.epic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">{t('form.statusLabel')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('form.statusLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">{t('columns.todo')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('columns.inProgress')}</SelectItem>
                  <SelectItem value="DONE">{t('columns.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">{t('form.priorityLabel')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder={t('form.priorityLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{t('priorities.low')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('priorities.medium')}</SelectItem>
                  <SelectItem value="HIGH">{t('priorities.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">{t('form.assigneeLabel')}</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder={t('form.assigneeLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('form.unassigned')}</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" disabled={!title || loading}>
              {loading ? t('common:buttons.saving') : (issue ? t('form.submitUpdate') : t('form.submitCreate'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
