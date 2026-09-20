import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Menu } from 'lucide-react';
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '#features' },
    { name: 'Workflow', href: '#workflow' },
    { name: 'Highlights', href: '#highlights' },
  ];

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          aria-label="FlowBoard home"
          className="flex items-center gap-2 font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">FlowBoard</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link to="/workspace">Go to workspace</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-slate-700 hover:text-slate-900">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col justify-between w-full max-w-xs p-6">
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
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">FlowBoard</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <nav aria-label="Mobile navigation" className="flex flex-col space-y-4 pt-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={handleLinkClick}
                    className="text-base font-medium text-slate-700 hover:text-indigo-600 transition-colors py-1"
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-200">
              {isAuthenticated ? (
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLinkClick}>
                  <Link to="/workspace">Go to workspace</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full border-slate-300 text-slate-700" onClick={handleLinkClick}>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLinkClick}>
                    <Link to="/register">Get started</Link>
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
