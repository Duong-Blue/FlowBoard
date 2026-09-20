import { Outlet } from "react-router-dom";
import { Toaster } from "../components/ui/sonner";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
      <Toaster position="top-right" />
    </div>
  );
}
