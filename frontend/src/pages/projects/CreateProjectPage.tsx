import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store';
import { addProject } from '../../store/slices/projectSlice';
import { createProject } from '../../services/projectService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface FormErrors {
  name?: string;
  key?: string;
  description?: string;
}

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ name?: boolean; key?: boolean; description?: boolean }>({});

  const validateName = (val: string): string | undefined => {
    if (!val.trim()) {
      return t('projects.nameRequired');
    }
    return undefined;
  };

  const validateKey = (val: string): string | undefined => {
    if (!val) {
      return t('projects.keyInvalid');
    }
    if (val.length < 2 || val.length > 6 || !/^[A-Z0-9]+$/.test(val)) {
      return t('projects.keyInvalid');
    }
    return undefined;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(newName) }));
    }

    if (!keyModified && newName) {
      const generatedKey = newName
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

      let finalKey = generatedKey;
      if (finalKey.length < 2 && newName.length >= 2) {
        finalKey = newName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
      }

      setKey(finalKey);
      if (touched.key) {
        setErrors((prev) => ({ ...prev, key: validateKey(finalKey) }));
      }
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyModified(true);
    const sanitizedKey = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    setKey(sanitizedKey);

    if (touched.key) {
      setErrors((prev) => ({ ...prev, key: validateKey(sanitizedKey) }));
    }
  };

  const handleBlur = (field: 'name' | 'key' | 'description') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'name') {
      setErrors((prev) => ({ ...prev, name: validateName(name) }));
    } else if (field === 'key') {
      setErrors((prev) => ({ ...prev, key: validateKey(key) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    const nameErr = validateName(name);
    const keyErr = validateKey(key);

    setTouched({ name: true, key: true, description: true });
    setErrors({ name: nameErr, key: keyErr });

    if (nameErr || keyErr) {
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

  const handleCancel = () => {
    navigate(`/workspace/orgs/${orgId}/projects`);
  };

  const isKeyValid = key.length >= 2 && key.length <= 6 && /^[A-Z0-9]+$/.test(key);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('projects.createTitle')}</CardTitle>
          <CardDescription>
            {t('projects.createSubtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('projects.nameLabel')} <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder={t('projects.namePlaceholder')}
                value={name}
                onChange={handleNameChange}
                onBlur={() => handleBlur('name')}
                disabled={loading}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.name && (
                <p id="name-error" className="text-xs font-medium text-red-500 mt-1" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Key Field with Formatting & Preview Helper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="key">{t('projects.keyLabel')} <span className="text-red-500">*</span></Label>
                {key && (
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    {t('projects.keyPreview')}{' '}
                    <span className="font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                      {key}
                    </span>
                    {isKeyValid && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </span>
                )}
              </div>
              <Input
                id="key"
                placeholder={t('projects.keyPlaceholder')}
                value={key}
                onChange={handleKeyChange}
                onBlur={() => handleBlur('key')}
                disabled={loading}
                maxLength={6}
                aria-invalid={!!errors.key}
                aria-describedby={errors.key ? 'key-error' : 'key-hint'}
                className={`uppercase ${errors.key ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <p id="key-hint" className="text-xs text-slate-500">
                {t('projects.keyHint')}
              </p>
              {errors.key && (
                <p id="key-error" className="text-xs font-medium text-red-500 mt-1" role="alert">
                  {errors.key}
                </p>
              )}
            </div>

            {/* Description Field (Textarea) */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('projects.descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('projects.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleBlur('description')}
                disabled={loading}
                rows={4}
              />
              {errors.description && (
                <p className="text-xs font-medium text-red-500 mt-1" role="alert">
                  {errors.description}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !isKeyValid}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t('common:buttons.creating') : t('projects.createProject')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
