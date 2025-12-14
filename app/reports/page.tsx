'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Sale, Product } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()).getTime(),
    end: endOfMonth(new Date()).getTime(),
  });

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    const productsRef = ref(database, 'products');

    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const salesArray = Object.entries(data).map(([id, sale]: [string, any]) => ({
          id,
          ...sale,
        }));
        setSales(salesArray);
      } else {
        setSales([]);
      }
    });

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, prod]: [string, any]) => ({
          id,
          ...prod,
        }));
        setProducts(productsArray);
      }
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, []);

  const filteredSales = sales.filter(
    (sale) => sale.saleDate >= dateRange.start && sale.saleDate <= dateRange.end
  );

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const topProducts = products
    .map((product) => {
      const soldQuantity = filteredSales.reduce((sum, sale) => {
        const item = sale.items.find((i: any) => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);
      return { ...product, soldQuantity };
    })
    .filter((p) => p.soldQuantity > 0)
    .sort((a, b) => b.soldQuantity - a.soldQuantity)
    .slice(0, 10);

  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock);

  const dailySales = filteredSales.reduce((acc: any, sale) => {
    const date = format(new Date(sale.saleDate), 'dd/MM');
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, transactions: 0 };
    }
    acc[date].revenue += sale.total;
    acc[date].transactions += 1;
    return acc;
  }, {});

  const chartData = Object.values(dailySales).slice(-7);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Laporan</h1>
            <p className="text-gray-600">Analisis penjualan dan stok</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Pendapatan</div>
              <div className="text-2xl font-bold text-primary-600">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Transaksi</div>
              <div className="text-2xl font-bold text-gray-800">
                {totalTransactions}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Rata-rata Transaksi</div>
              <div className="text-2xl font-bold text-gray-800">
                Rp {averageTransaction.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Grafik Penjualan (7 Hari Terakhir)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#0ea5e9" name="Pendapatan" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Produk Terlaris
              </h2>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada data</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.categoryName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {product.soldQuantity} terjual
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Stok Menipis
              </h2>
              <div className="space-y-3">
                {lowStockProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Semua stok aman</p>
                ) : (
                  lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.categoryName}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          Stok: {product.stock}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {product.minStock}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
