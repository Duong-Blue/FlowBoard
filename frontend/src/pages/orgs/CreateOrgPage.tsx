import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setOrgs } from '../../store/slices/orgSlice';
import * as orgService from '../../services/orgService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { RootState } from '../../store/types';

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orgs = useSelector((state: RootState) => state.org.list);
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCustomSlug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setIsCustomSlug(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newOrg = await orgService.createOrg({ name, slug, description });
      dispatch(setOrgs([...orgs, newOrg]));
      navigate(`/orgs/${newOrg.id}/projects`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 mt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create Organization</h1>
        <p className="text-gray-500">Setup a new workspace for your team</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            placeholder="Acme Corp" 
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input 
            id="slug" 
            placeholder="acme-corp" 
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">This will be used in URLs</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input 
            id="description" 
            placeholder="What does your team do?" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit" className="w-full" disabled={loading || !name || !slug}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}
