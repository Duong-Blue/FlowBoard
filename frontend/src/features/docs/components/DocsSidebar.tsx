import { NavLink } from 'react-router-dom';

export function DocsSidebar() {
  const navLinks = [
    { to: '/docs', label: 'Introduction' },
    { to: '/docs/getting-started', label: 'Getting Started' },
    { to: '/docs/workspace', label: 'Workspace' },
    { to: '/docs/projects', label: 'Projects' },
    { to: '/docs/roadmap', label: 'Roadmap' },
    { to: '/docs/issues', label: 'Issues' },
    { to: '/docs/work', label: 'Work' },
  ];

  return (
    <div className="flex flex-col gap-4 text-slate-600 dark:text-slate-400">
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex items-center px-3 py-1.5 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}
