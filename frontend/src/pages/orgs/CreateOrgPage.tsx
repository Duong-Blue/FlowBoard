import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setOrgs } from '../../store/slices/orgSlice';
import * as orgService from '../../services/orgService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { RootState } from '../../store/types';

export default function CreateOrgPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orgs = useSelector((state: RootState) => state.org.list);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newOrg = await orgService.createOrg({ name, description });
      dispatch(setOrgs([...orgs, newOrg]));
      navigate(`/workspace/orgs/${newOrg.slug || newOrg.id}/projects`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('workspace.createOrg.failed', 'Failed to create organization'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 mt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('workspace.createOrg.title', 'Create Organization')}</h1>
        <p className="text-slate-500">{t('workspace.createOrg.subtitle', 'Setup a new workspace for your team')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="name">{t('workspace.createOrg.nameLabel', 'Organization Name')}</Label>
          <Input 
            id="name" 
            placeholder={t('workspace.createOrg.namePlaceholder', 'Acme Corp')} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('workspace.createOrg.descriptionLabel', 'Description (Optional)')}</Label>
          <Input 
            id="description" 
            placeholder={t('workspace.createOrg.descriptionPlaceholder', 'What does your team do?')} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/workspace')}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
