'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { DollarSign, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: 'paid' | 'unpaid';
  saleDate: number;
  paidDate?: number;
  createdAt: number;
  updatedAt: number;
}

export default function ReceivablesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    const salesRef = ref(database, 'sales');

    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const salesArray = Object.entries(data)
          .map(([id, sale]: [string, any]) => ({
            id,
            ...sale,
          }))
          .filter((sale: Sale) => sale.paymentMethod === 'credit')
          .sort((a, b) => b.saleDate - a.saleDate);
        setSales(salesArray);
      } else {
        setSales([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsPaid = async (sale: Sale) => {
    if (confirm(`Tandai transaksi dari ${sale.customerName} sebagai lunas?`)) {
      try {
        const timestamp = Date.now();
        const saleRef = ref(database, `sales/${sale.id}`);
        
        await update(saleRef, {
          paymentStatus: 'paid',
          paidDate: timestamp,
          updatedAt: timestamp,
        });

        toast.success('Transaksi berhasil ditandai sebagai lunas!');
      } catch (error) {
        toast.error('Gagal memproses pembayaran');
        console.error(error);
      }
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (filter === 'unpaid') return sale.paymentStatus !== 'paid';
    if (filter === 'paid') return sale.paymentStatus === 'paid';
    return true;
  });

  const totalUnpaid = sales
    .filter((sale) => sale.paymentStatus !== 'paid')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalPaid = sales
    .filter((sale) => sale.paymentStatus === 'paid')
    .reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Piutang</h1>
            <p className="text-gray-600">Kelola piutang customer</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Piutang</p>
                  <p className="text-2xl font-bold text-gray-800">
                    Rp {(totalUnpaid + totalPaid).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Belum Lunas</p>
                  <p className="text-2xl font-bold text-red-600">
                    Rp {totalUnpaid.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sudah Lunas</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {totalPaid.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilter('unpaid')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'unpaid'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Belum Lunas ({sales.filter((s) => s.paymentStatus !== 'paid').length})
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'paid'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sudah Lunas ({sales.filter((s) => s.paymentStatus === 'paid').length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'all'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Semua ({sales.length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Lunas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {filter === 'unpaid' && 'Tidak ada piutang yang belum lunas'}
                        {filter === 'paid' && 'Tidak ada piutang yang sudah lunas'}
                        {filter === 'all' && 'Belum ada transaksi kredit'}
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(sale.saleDate), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {sale.total.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sale.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sale.paidDate ? format(new Date(sale.paidDate), 'dd/MM/yyyy HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {sale.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => markAsPaid(sale)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Tandai Lunas
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
