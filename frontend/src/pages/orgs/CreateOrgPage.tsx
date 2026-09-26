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
  const { t } = useTranslation(['workspace', 'common']);
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
      setError(err instanceof Error ? err.message : t('createOrg.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 mt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('createOrg.title')}</h1>
        <p className="text-slate-500">{t('createOrg.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="name">{t('createOrg.nameLabel')}</Label>
          <Input 
            id="name" 
            placeholder={t('createOrg.namePlaceholder')} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('createOrg.descriptionLabel')}</Label>
          <Input 
            id="description" 
            placeholder={t('createOrg.descriptionPlaceholder')} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/workspace')}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? t('common:buttons.creating') : t('common:buttons.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
