import React from 'react';
import { useTranslation } from 'react-i18next';

const MockSection = ({ title, description, mockUi }: { title: string, description: string, mockUi: React.ReactNode }) => (
  <section className="flex flex-col md:flex-row gap-8 py-16 items-center border-b border-gray-200 dark:border-gray-800">
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
    </div>
    <div className="flex-1 w-full">
      {mockUi}
    </div>
  </section>
);

export const ProductPage: React.FC = () => {
  const { t } = useTranslation('public');

  return (
    <div className="container mx-auto px-4 py-8">
      <MockSection
        title={t('product.workspace')}
        description={t('product.workspaceDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="h-12 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
              <div className="h-12 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
              <div className="h-12 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
              <div className="h-12 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
            </div>
          </div>
        }
      />
      <MockSection
        title={t('product.projects')}
        description={t('product.projectsDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 flex flex-col gap-2">
            <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 w-full"></div>
            <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 w-3/4"></div>
            <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 w-1/2"></div>
          </div>
        }
      />
      <MockSection
        title={t('product.roadmap')}
        description={t('product.roadmapDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 flex flex-col gap-4">
            <div className="h-8 bg-blue-100 dark:bg-blue-900 rounded w-full"></div>
            <div className="h-8 bg-blue-200 dark:bg-blue-800 rounded w-5/6"></div>
            <div className="h-8 bg-blue-300 dark:bg-blue-700 rounded w-2/3"></div>
          </div>
        }
      />
      <MockSection
        title={t('product.issues')}
        description={t('product.issuesDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 flex items-center px-4 gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ))}
          </div>
        }
      />
      <MockSection
        title={t('product.work')}
        description={t('product.workDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 grid grid-cols-3 gap-2">
            <div className="col-span-2 h-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
            <div className="col-span-1 h-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
          </div>
        }
      />
      <MockSection
        title={t('product.collaboration')}
        description={t('product.collaborationDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 flex flex-col justify-end gap-2">
            <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 w-11/12 ml-auto"></div>
            <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 w-11/12"></div>
          </div>
        }
      />
      <MockSection
        title={t('product.views')}
        description={t('product.viewsDesc')}
        mockUi={
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 h-64 flex gap-4">
            <div className="w-1/3 h-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
            <div className="w-2/3 h-full bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
          </div>
        }
      />
    </div>
  );
};
