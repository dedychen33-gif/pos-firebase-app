'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Percent, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaxSettingsPage() {
  const [taxRate, setTaxRate] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(database, 'settings/tax');
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.rate !== undefined) {
        setTaxRate(data.rate);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      const settingsRef = ref(database, 'settings/tax');
      await set(settingsRef, {
        rate: Number(taxRate),
        updatedAt: Date.now(),
      });
      toast.success('Pengaturan pajak berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          </main>
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
            <h1 className="text-3xl font-bold text-gray-800">Pengaturan Pajak</h1>
            <p className="text-gray-600">Atur persentase pajak untuk transaksi penjualan</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Persentase Pajak</h2>
                <p className="text-sm text-gray-600">Pajak akan diterapkan pada semua transaksi di POS</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persentase Pajak (%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                />
                <span className="text-2xl font-bold text-gray-700">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Contoh: Jika subtotal Rp 100.000 dengan pajak {taxRate}%, maka pajak = Rp {(100000 * taxRate / 100).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview Perhitungan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">Rp 100.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pajak ({taxRate}%):</span>
                  <span className="font-medium text-purple-600">Rp {(100000 * taxRate / 100).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-semibold">Total:</span>
                  <span className="font-bold text-lg">Rp {(100000 + (100000 * taxRate / 100)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Informasi</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Pajak akan diterapkan secara otomatis di halaman POS</li>
              <li>• Perubahan akan langsung berlaku untuk transaksi baru</li>
              <li>• Pajak dihitung dari subtotal sebelum diskon</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
