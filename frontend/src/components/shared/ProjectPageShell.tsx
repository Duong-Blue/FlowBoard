import React from 'react';
import { ProjectHeader, type ProjectHeaderProps } from './ProjectHeader';

export interface ProjectPageShellProps extends ProjectHeaderProps {
  children: React.ReactNode;
  containerClassName?: string;
  fullHeight?: boolean;
}

export const ProjectPageShell: React.FC<ProjectPageShellProps> = ({
  children,
  containerClassName = '',
  fullHeight = false,
  className = '',
  ...headerProps
}) => {
  return (
    <div
      className={`flex flex-col gap-6 ${
        fullHeight ? 'h-[calc(100vh-4rem)] pb-4' : 'min-h-[calc(100vh-4rem)]'
      } ${containerClassName}`}
    >
      <ProjectHeader className={className} {...headerProps} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
};
