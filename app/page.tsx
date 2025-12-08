// /app/page.tsx (FINAL CODE)

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types/user';
import { Layout } from '@/components/Layout';
import { Marketplace } from '@/components/Marketplace';
import { Inventory } from '@/components/Inventory';
import { OrderList } from '@/components/OrderList';
import { ShipmentManager } from '@/components/ShipmentManager';
import { BlockchainViewer } from '@/components/BlockchainViewer';
import {
  LogIn,
  Edit2,
  Save,
  X,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';

// --- API FETCH UTILITIES ---

const fetchUserById = async (userId: string): Promise<User | null> => {
  const response = await fetch(`/api/wallet?userId=${userId}`);
  if (response.ok) {
    return response.json();
  }
  return null;
};

// --- Initial State Definition ---
const initialSignupForm = {
  name: '',
  email: '',
  password: '',
  role: UserRole.BUYER,
  address: '',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState('profile');
  const [loading, setLoading] = useState(true);

  // Authentication State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sign Up Form State
  const [signupForm, setSignupForm] = useState(initialSignupForm);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [walletAmount, setWalletAmount] = useState('');

  const refreshUser = useCallback(async () => {
    if (currentUser) {
      const refreshed = await fetchUserById(currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
        localStorage.setItem('session_user', JSON.stringify(refreshed));
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const saved = localStorage.getItem('session_user');
    if (saved) {
      const user = JSON.parse(saved);
      fetchUserById(user.id).then((u) => {
        if (u) {
          setCurrentUser(u);
          localStorage.setItem('session_user', JSON.stringify(u));
          if (u.role === UserRole.BUYER) setPage('marketplace');
          else if (u.role === UserRole.SELLER) setPage('orders');
          else setPage('shipments');
        } else {
          localStorage.removeItem('session_user');
          setCurrentUser(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    if (response.ok) {
      const user = await response.json();
      setCurrentUser(user);
      localStorage.setItem('session_user', JSON.stringify(user));
      if (user.role === UserRole.BUYER) setPage('marketplace');
      else if (user.role === UserRole.SELLER) setPage('orders');
      else setPage('shipments');

      // CLEAR LOGIN FORM AFTER SUCCESSFUL LOGIN
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid email or password.');
    }
    setLoading(false);
  };

  // --- SIGN UP HANDLER ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    // Validate address is present if role is not Logistics
    if (signupForm.role !== UserRole.LOGISTICS && !signupForm.address.trim()) {
      setLoginError('Address is required for Buyers and Sellers.');
      setLoading(false);
      return;
    }

    // Prepare payload with default necessary fields
    const payload: User = {
      id: `u_${Date.now()}`,
      wallet_balance: 0,
      ...signupForm,
      // Ensure password is sent for hashing on the server
      password: signupForm.password,
    };

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      // Auto login after successful signup
      setCurrentUser(result);
      localStorage.setItem('session_user', JSON.stringify(result));
      if (result.role === UserRole.BUYER) setPage('marketplace');
      else if (result.role === UserRole.SELLER) setPage('orders');
      else setPage('shipments');

      // CLEAR SIGNUP FORM AFTER SUCCESSFUL SIGNUP
      setSignupForm(initialSignupForm);
    } else {
      setLoginError(result.error || 'Registration failed.');
    }
    setLoading(false);
  };

  // --- LOGOUT HANDLER (MODIFIED) ---
  const handleLogout = () => {
    localStorage.removeItem('session_user');
    setCurrentUser(null);
    setPage('profile');
    setAuthMode('login');

    // CLEAR LOGIN FORM STATE
    setLoginEmail('');
    setLoginPassword('');
  };

  // --- Profile/Wallet Handlers (Unmodified) ---

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setLoading(true);

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, updates: editForm }),
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      localStorage.setItem('session_user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
    } else {
      alert('Failed to save profile.');
    }
    setLoading(false);
  };

  const handleWalletTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!currentUser || !walletAmount) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setLoading(true);

    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        type,
        amount,
        currentBalance: currentUser.wallet_balance,
      }),
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      localStorage.setItem('session_user', JSON.stringify(updatedUser));
      setWalletAmount('');
    } else {
      const errorData = await response.json();
      alert(errorData.error || `Transaction Failed: ${type}`);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
        <span className="text-xl font-bold">
          Loading Supply Chain Portal...
        </span>
      </div>
    );

  // --- LOGIN/SIGNUP SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <span className="text-white text-3xl font-bold">B</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-black mb-2">
            ChainLink Supply
          </h1>
          <p className="text-center text-slate-500 mb-8">
            Blockchain-enabled SCM Portal
          </p>

          {authMode === 'login' ? (
            /* ================== LOGIN FORM ================== */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <LogIn className="mr-2" size={18} />
                )}
                Login
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-black">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setLoginError('');
                      // CLEAR LOGIN FORM
                      setLoginEmail('');
                      setLoginPassword('');
                      // CLEAR SIGNUP FORM
                      setSignupForm(initialSignupForm);
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ================== SIGN UP FORM ================== */
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={signupForm.name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Role
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={signupForm.role}
                  onChange={(e) =>
                    setSignupForm({
                      ...signupForm,
                      role: e.target.value as UserRole,
                      // Clear address if role is switched to Logistics
                      address:
                        e.target.value === UserRole.LOGISTICS
                          ? ''
                          : signupForm.address,
                    })
                  }
                >
                  <option value={UserRole.BUYER}>Buyer</option>
                  <option value={UserRole.SELLER}>Seller</option>
                  <option value={UserRole.LOGISTICS}>Logistics Provider</option>
                </select>
              </div>
              {/* ADDRESS FIELD (Conditional Requirement) */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Address
                  {signupForm.role !== UserRole.LOGISTICS && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {signupForm.role === UserRole.LOGISTICS && (
                    <span className="text-slate-500 ml-1">(Optional)</span>
                  )}
                </label>
                <textarea
                  // Only 'required' if the role is NOT Logistics
                  required={signupForm.role !== UserRole.LOGISTICS}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={signupForm.address}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, address: e.target.value })
                  }
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <UserPlus className="mr-2" size={18} />
                )}
                Create Account
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-black">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                      // CLEAR LOGIN FORM
                      setLoginEmail('');
                      setLoginPassword('');
                      // CLEAR SIGNUP FORM
                      setSignupForm(initialSignupForm);
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
  // --- MAIN APPLICATION LAYOUT (Rest of the component remains the same) ---
  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentPage={page}
      onNavigate={setPage}
    >
      {/* ... (Existing page rendering logic) ... */}
      {page === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">User Profile</h2>
              {!isEditingProfile ? (
                <button
                  onClick={() => {
                    setEditForm({
                      name: currentUser.name,
                      address: currentUser.address,
                    });
                    setIsEditingProfile(true);
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="p-2 text-black hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div className="grid grid-cols-3 border-b py-3 items-center">
                <span className="text-black">Name</span>
                {isEditingProfile ? (
                  <input
                    className="col-span-2 border p-2 rounded"
                    value={editForm.name || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                ) : (
                  <span className="col-span-2 font-medium">
                    {currentUser.name}
                  </span>
                )}
              </div>
              {/* Email */}
              <div className="grid grid-cols-3 border-b py-3">
                <span className="text-black">Email</span>
                <span className="col-span-2 font-medium text-slate-400 cursor-not-allowed">
                  {currentUser.email}
                </span>
              </div>
              {/* Role */}
              <div className="grid grid-cols-3 border-b py-3">
                <span className="text-black">Role</span>
                <span className="col-span-2 font-medium uppercase tracking-wide text-xs bg-slate-100 inline-block py-1 px-2 rounded w-max">
                  {currentUser.role}
                </span>
              </div>
              {/* Address */}
              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-black">Address</span>
                {isEditingProfile ? (
                  <textarea
                    className="col-span-2 border p-2 rounded"
                    value={editForm.address || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                ) : (
                  <span className="col-span-2 font-medium">
                    {currentUser.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Wallet Card - Only for Buyer and Seller */}
          {currentUser.role !== UserRole.LOGISTICS && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-fit">
              <div className="flex items-center space-x-2 mb-6 text-black">
                <Wallet className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold">My Wallet</h2>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 text-white mb-6 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-slate-400 text-sm mb-1">Current Balance</p>
                  <p className="text-3xl font-bold">
                    ${currentUser.wallet_balance.toLocaleString()}
                  </p>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500 rounded-full opacity-20"></div>
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-indigo-500 rounded-full opacity-20"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black uppercase mb-2">
                    Manage Funds
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm mb-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleWalletTransaction('deposit')}
                    className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-2 rounded-lg border border-green-200 hover:bg-green-100"
                    disabled={loading}
                  >
                    <ArrowUpCircle size={18} />
                    <span>Deposit</span>
                  </button>
                  <button
                    onClick={() => handleWalletTransaction('withdraw')}
                    className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 py-2 rounded-lg border border-red-200 hover:bg-red-100"
                    disabled={loading}
                  >
                    <ArrowDownCircle size={18} />
                    <span>Withdraw</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {page === 'marketplace' && currentUser.role === UserRole.BUYER && (
        <Marketplace user={currentUser} refreshUser={refreshUser} />
      )}
      {page === 'inventory' && currentUser.role === UserRole.SELLER && (
        <Inventory user={currentUser} />
      )}
      {page === 'orders' && (
        <OrderList user={currentUser} refreshUser={refreshUser} />
      )}
      {page === 'shipments' && currentUser.role === UserRole.LOGISTICS && (
        <ShipmentManager user={currentUser} />
      )}

      <BlockchainViewer />
    </Layout>
  );
}
