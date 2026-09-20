import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store';
import { addProject } from '../../store/slices/projectSlice';
import { createProject } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateProjectPage() {
  const { t } = useTranslation(['workspace', 'common']);
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyModified, setKeyModified] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!keyModified && newName) {
      const generatedKey = newName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6);

      if (generatedKey.length >= 2) {
        setKey(generatedKey);
      } else if (newName.length >= 2) {
        setKey(newName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''));
      }
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyModified(true);
    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId) return;

    if (key.length < 2) {
      toast.error('Project key must be at least 2 characters long');
      return;
    }

    setLoading(true);
    try {
      const newProject = await createProject(orgId, { name, key, description });
      dispatch(addProject(newProject));
      toast.success(t('common:status.success'));
      navigate(`/workspace/orgs/${orgId}/projects/${newProject.key}/issues`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('common:status.error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('projects.createTitle')}</CardTitle>
          <CardDescription>
            {t('projects.createSubtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('projects.nameLabel')}</Label>
              <Input
                id="name"
                placeholder={t('projects.namePlaceholder')}
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">{t('projects.keyLabel')}</Label>
              <Input
                id="key"
                placeholder={t('projects.keyPlaceholder')}
                value={key}
                onChange={handleKeyChange}
                required
                maxLength={6}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                {t('projects.keyHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('projects.descriptionLabel')}</Label>
              <Input
                id="description"
                placeholder={t('projects.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/workspace/orgs/${orgId}/projects`)}
              disabled={loading}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !name || key.length < 2}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t('common:buttons.creating') : t('projects.createProject')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
