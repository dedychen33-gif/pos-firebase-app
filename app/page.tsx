'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { Sale, Product } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    const productsRef = ref(database, 'products');
    const customersRef = ref(database, 'customers');

    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const salesArray: Sale[] = Object.values(data);
        const today = new Date().setHours(0, 0, 0, 0);
        const todaySales = salesArray.filter(
          (sale) => new Date(sale.saleDate).setHours(0, 0, 0, 0) === today
        );
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        
        setStats((prev) => ({
          ...prev,
          totalSales: salesArray.length,
          todayRevenue,
        }));
      }
    });

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      setStats((prev) => ({
        ...prev,
        totalProducts: data ? Object.keys(data).length : 0,
      }));
    });

    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      setStats((prev) => ({
        ...prev,
        totalCustomers: data ? Object.keys(data).length : 0,
      }));
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  const statCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Penjualan',
      value: stats.totalSales,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Customer',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Ringkasan bisnis Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {card.value}
                      </p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Selamat Datang di POS System
            </h2>
            <p className="text-gray-600">
              Sistem Point of Sale dengan Firebase Realtime Database. Kelola produk,
              customer, supplier, dan transaksi penjualan dengan mudah.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
