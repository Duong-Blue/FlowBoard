
import { Link, Outlet } from "react-router-dom";
import { Toaster } from "../components/ui/sonner";

export default function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-slate-800 text-white p-4">
        <nav>
          <Link to="/" className="mr-4 hover:text-indigo-300">Home</Link>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="bg-slate-800 text-white p-4 text-center">
        © {new Date().getFullYear()} FlowBoard. All rights reserved.
      </footer>
      <Toaster position="top-right" />
    </div>
  );
}
