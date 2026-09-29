import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { uploadAvatar, deleteAvatar } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  displayName?: string;
  onAvatarChange: (newUrl: string | null) => void;
}

export function AvatarUploader({ avatarUrl, displayName, onAvatarChange }: AvatarUploaderProps) {
  const { t } = useTranslation('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2MB validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('avatar.sizeError'));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('avatar.typeError'));
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadAvatar(file);
      onAvatarChange(res.avatarUrl);
      toast.success(t('avatar.uploadSuccess'));
    } catch (err: any) {
      toast.error(err?.message || t('avatar.uploadError'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAvatar();
      onAvatarChange(null);
      toast.success(t('avatar.removeSuccess'));
    } catch (err: any) {
      toast.error(err?.message || t('avatar.removeError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-white dark:border-slate-800 shadow-md">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName || 'Avatar'} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
            {displayName ? getInitials(displayName) : <UserIcon className="h-10 w-10" />}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('avatar.title')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('avatar.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || isDeleting}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 gap-1.5 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            )}
            {t('avatar.upload')}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isUploading || isDeleting}
              onClick={handleDelete}
              className="h-8 gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {t('avatar.remove')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
