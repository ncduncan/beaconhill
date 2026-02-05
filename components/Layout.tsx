import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Building2, TrendingUp, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-indigo-500" />
            BeaconHill AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">CRE Investment Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/discover" icon={<Search size={20} />} label="Discover" />
          <NavItem to="/underwrite" icon={<TrendingUp size={20} />} label="Underwrite" />
          <NavItem to="/manage" icon={<Building2 size={20} />} label="Manage" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              U
            </div>
            <div>
              <p className="text-sm font-medium text-white">Investor</p>
              <p className="text-xs text-slate-500">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
          : 'hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    {icon}
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default Layout;