'use client';

import { Bell, User, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Selamat Datang{user ? `, ${user.name}` : ''}
          </h2>
          <p className="text-sm text-gray-600">
            {user?.role === 'admin' ? 'Kelola bisnis Anda dengan mudah' : 'Proses transaksi dengan cepat'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
