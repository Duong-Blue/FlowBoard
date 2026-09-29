import { Outlet } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
