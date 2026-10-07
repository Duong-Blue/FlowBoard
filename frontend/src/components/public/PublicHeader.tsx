import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Moon, Sun } from 'lucide-react';
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function PublicHeader() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { theme, setTheme } = useTheme();

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          aria-label="FlowBoard home"
          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <img src="/logo.png" alt="FlowBoard logo" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">FlowBoard</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          <Link
            to="/product"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {t('header.product', 'Product')}
          </Link>
          <Link
            to="/docs"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {t('header.docs', 'Docs')}
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link to="/workspace">{t('header.goToWorkspace', 'Go to Workspace')}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                <Link to="/login">{t('header.signIn', 'Sign in')}</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link to="/register">{t('header.getStarted', 'Get Started')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-slate-700 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <LanguageSwitcher />
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-700 dark:text-slate-300"
                aria-label={t('header.openMenu', 'Open menu')}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="right" className="flex flex-col justify-between w-full max-w-xs p-6 dark:bg-slate-950">
            <div className="space-y-6">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <Link
                    to="/"
                    aria-label="FlowBoard home"
                    onClick={handleLinkClick}
                    className="flex items-center gap-2"
                  >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <img src="/logo.png" alt="FlowBoard logo" className="h-5 w-5" />
                  </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">FlowBoard</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-4 pt-2">
                <Link
                  to="/product"
                  onClick={handleLinkClick}
                  className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
                >
                  {t('header.product', 'Product')}
                </Link>
                <Link
                  to="/docs"
                  onClick={handleLinkClick}
                  className="text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
                >
                  {t('header.docs', 'Docs')}
                </Link>
              </nav>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              {isAuthenticated ? (
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLinkClick}>
                  <Link to="/workspace">{t('header.goToWorkspace', 'Go to Workspace')}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300" onClick={handleLinkClick}>
                    <Link to="/login">{t('header.signIn', 'Sign in')}</Link>
                  </Button>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLinkClick}>
                    <Link to="/register">{t('header.getStarted', 'Get Started')}</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
