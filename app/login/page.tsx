'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogIn, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User authenticated:', user.uid, user.email);

      // Determine role based on email (simplified approach)
      let userName = 'User';
      let userRole = 'kasir';
      
      if (user.email === 'admin@pos.com') {
        userName = 'Admin POS';
        userRole = 'admin';
      } else if (user.email === 'kasir@pos.com') {
        userName = 'Kasir POS';
        userRole = 'kasir';
      }
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        email: user.email,
        name: userName,
        role: userRole
      }));

      toast.success(`Selamat datang, ${userName}!`);
      
      // Redirect based on role
      setTimeout(() => {
        if (userRole === 'admin') {
          router.push('/');
        } else {
          router.push('/pos');
        }
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Email atau password salah');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Format email tidak valid');
      } else if (error.message === 'Database timeout') {
        toast.error('Koneksi database timeout. Coba lagi.');
      } else if (error.code === 'PERMISSION_DENIED') {
        toast.error('Akses ditolak. Periksa database rules.');
      } else {
        toast.error(`Gagal login: ${error.message || 'Silakan coba lagi'}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-primary-100 rounded-full mb-4">
            <LogIn className="w-12 h-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">POS System</h1>
          <p className="text-gray-600">Silakan login untuk melanjutkan</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Demo Accounts:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-semibold text-blue-800">Admin</p>
              <p className="text-blue-600">admin@pos.com / admin123</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-semibold text-green-800">Kasir</p>
              <p className="text-green-600">kasir@pos.com / kasir123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
