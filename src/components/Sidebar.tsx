import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Package,
  Truck,
  Calculator,
  Sparkles,
  Moon,
  Sun,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useUIStore } from '../store';

interface SidebarProps {
  userProfile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ userProfile }) => {
  const { isMobileMenuOpen, setMobileMenuOpen, isDarkMode, toggleDarkMode } = useUIStore();
  const menuItems: { path: string; label: string; icon: React.ReactNode; testId: string }[] = [
    {
      path: '/',
      label: 'Tableau de bord',
      icon: <LayoutDashboard size={20} />,
      testId: 'nav-dashboard',
    },
    {
      path: '/invoices',
      label: 'Devis & Factures',
      icon: <FileText size={20} />,
      testId: 'nav-invoices',
    },
    { path: '/clients', label: 'Clients', icon: <Users size={20} />, testId: 'nav-clients' },
    {
      path: '/suppliers',
      label: 'Fournisseurs',
      icon: <Truck size={20} />,
      testId: 'nav-suppliers',
    },
    { path: '/products', label: 'Catalogue', icon: <Package size={20} />, testId: 'nav-products' },
    {
      path: '/accounting',
      label: 'Comptabilité',
      icon: <Calculator size={20} />,
      testId: 'nav-accounting',
    },
    { path: '/ai', label: 'Assistant IA', icon: <Sparkles size={20} />, testId: 'nav-ai' },
    {
      path: '/settings',
      label: 'Paramètres',
      icon: <Settings size={20} />,
      testId: 'nav-settings',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        data-testid="sidebar"
        className={`
        fixed top-0 left-0 z-30 h-screen w-80 bg-card/80 dark:bg-card/80 backdrop-blur-2xl text-muted-foreground transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-r border-border shadow-premium
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-4 p-10 mb-2">
          {userProfile.logo ? (
            <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-2xl shadow-premium border border-border">
              <img src={userProfile.logo} alt="Logo" className="max-h-full max-w-full" />
            </div>
          ) : (
            <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-2xl shadow-premium border border-border bg-white p-2">
              <img src="/logo.svg" alt="App Logo" className="max-h-full max-w-full" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tighter leading-none italic uppercase">
              {userProfile.companyName || 'Micro'}
              {!userProfile.companyName && (
                <span className="block text-primary not-italic font-bold tracking-tight">
                  Gestion
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-6 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 px-4 mt-6 opacity-40">
            Navigation principale
          </div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden
                ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <span className="relative z-10 transition-transform group-hover:scale-110 duration-300">
                {item.icon}
              </span>
              <span className="relative z-10 tracking-tight">{item.label}</span>
              {/* Subtle hover effect for inactive items */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Dark Mode Toggle Footer */}
        <div className="absolute bottom-0 w-full p-6 space-y-4 bg-gradient-to-t from-card to-transparent border-t border-border/50">
          <button
            data-testid="theme-toggle"
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-muted/50 text-foreground hover:bg-muted transition-all duration-300 border border-border/50 group"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Sun
                  size={20}
                  className="text-amber-500 group-hover:rotate-45 transition-transform duration-500"
                />
              ) : (
                <Moon
                  size={20}
                  className="text-primary group-hover:-rotate-12 transition-transform duration-500"
                />
              )}
              <span className="text-xs font-black uppercase tracking-widest mt-0.5">
                {isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
              </span>
            </div>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <div
                className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`}
              />
            </div>
          </button>

          <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all cursor-pointer group shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary border border-primary/20 shadow-soft group-hover:scale-105 transition-transform">
              {userProfile.companyName?.substring(0, 2).toUpperCase() || 'ME'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-black text-foreground truncate tracking-tight">
                {userProfile.companyName || 'Ma Micro-Gestion'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse"></span>
                Propriétaire
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
