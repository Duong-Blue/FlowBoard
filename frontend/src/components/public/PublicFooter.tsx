import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xl">
              <LayoutDashboard className="h-6 w-6 text-indigo-600" />
              <span>FlowBoard</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Organized project management for structured engineering teams.
            </p>
            <div className="flex items-center text-xs font-medium text-slate-600 pt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <span>All systems operational</span>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-slate-900 transition-colors">
                  Workflow
                </a>
              </li>
              <li>
                <a href="#highlights" className="hover:text-slate-900 transition-colors">
                  Highlights
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <span
                  className="inline-flex items-center gap-2 text-slate-400 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  Documentation
                  <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </span>
              </li>
              <li>
                <span
                  className="inline-flex items-center gap-2 text-slate-400 cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  Changelog
                  <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    Coming soon
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Account */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
              Account
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/login" className="hover:text-slate-900 transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-slate-900 transition-colors">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-left">
            © 2026 FlowBoard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
