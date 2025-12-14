'use client';

import { useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Download, Upload, Database } from 'lucide-react';
import { BackupData } from '@/lib/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function BackupPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const dbRef = ref(database);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const data: BackupData = {
          ...snapshot.val(),
          timestamp: Date.now(),
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pos-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Backup berhasil didownload!');
      } else {
        toast.error('Tidak ada data untuk dibackup');
      }
    } catch (error) {
      toast.error('Gagal membuat backup');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Yakin ingin restore data? Data saat ini akan ditimpa!')) {
      event.target.value = '';
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      const dbRef = ref(database);
      await set(dbRef, {
        products: data.products || {},
        categories: data.categories || {},
        customers: data.customers || {},
        suppliers: data.suppliers || {},
        purchaseOrders: data.purchaseOrders || {},
        sales: data.sales || {},
      });

      toast.success('Data berhasil direstore!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Gagal restore data. Pastikan file backup valid.');
      console.error(error);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Backup & Restore</h1>
            <p className="text-gray-600">Kelola backup database Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Backup Database
                </h2>
                <p className="text-gray-600 mb-6">
                  Download semua data dalam format JSON untuk backup
                </p>
                <button
                  onClick={handleBackup}
                  disabled={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>{isLoading ? 'Memproses...' : 'Download Backup'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Restore Database
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload file backup untuk mengembalikan data
                </p>
                <label className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>{isLoading ? 'Memproses...' : 'Upload Backup'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    disabled={isLoading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <Database className="w-6 h-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Informasi Penting</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Backup akan menyimpan semua data: produk, kategori, customer, supplier, PO, dan transaksi</li>
                  <li>• File backup dalam format JSON dapat dibuka dengan text editor</li>
                  <li>• Restore akan menimpa semua data yang ada saat ini</li>
                  <li>• Disarankan untuk backup secara berkala</li>
                  <li>• Simpan file backup di tempat yang aman</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
