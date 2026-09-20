import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLangCode = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const currentLangLabel = currentLangCode.toUpperCase();

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Globe className="h-4 w-4 text-slate-500" />
          <span>{currentLangLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-white border-slate-200 text-slate-900 shadow-md">
        {LANGUAGES.map((lang) => {
          const isSelected = currentLangCode === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 text-xs focus:bg-slate-100"
            >
              <span>{lang.label}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
