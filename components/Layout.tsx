// /components/Layout.tsx

'use client'; // This must be a Client Component to handle navigation state

import React from 'react';
import { User, UserRole } from '@/types/user'; // Use absolute import path for types
import {
  LogOut,
  Package,
  ShoppingCart,
  Truck,
  User as UserIcon,
  Boxes,
} from 'lucide-react';

// Define the props interface for clarity
interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  onLogout,
  currentPage,
  onNavigate,
}) => {
  // Helper Component for Navigation Items
  const NavItem = ({
    page,
    icon: Icon,
    label,
  }: {
    page: string;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        currentPage === page
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              BlockChain<span className="text-blue-600">SCM</span>
            </span>
          </div>
          <div className="mt-4 px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentUser.role} Portal
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Common */}
          <NavItem page="profile" icon={UserIcon} label="My Profile" />

          {/* Role Based Navigation */}
          {currentUser.role === UserRole.BUYER && (
            <>
              <NavItem
                page="marketplace"
                icon={ShoppingCart}
                label="Marketplace"
              />
              <NavItem page="orders" icon={Package} label="My Orders" />
            </>
          )}

          {currentUser.role === UserRole.SELLER && (
            <>
              <NavItem page="inventory" icon={Boxes} label="Inventory" />
              <NavItem page="orders" icon={Package} label="Incoming Orders" />
            </>
          )}

          {currentUser.role === UserRole.LOGISTICS && (
            <>
              <NavItem page="shipments" icon={Truck} label="Active Shipments" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">
            {currentPage.replace('-', ' ')}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Local Node Active
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};
