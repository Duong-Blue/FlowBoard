import { Outlet } from 'react-router-dom';
import { DocsSidebar } from '@/features/docs/components/DocsSidebar';

export default function DocsLayout() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-4">
          <DocsSidebar />
        </div>

        <div className="col-span-1 lg:col-span-9 xl:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
