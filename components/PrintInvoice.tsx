'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  dueDate?: string;
}

interface PrintInvoiceProps {
  data: InvoiceData;
  onClose: () => void;
}

export default function PrintInvoice({ data, onClose }: PrintInvoiceProps) {
  const [storeInfo, setStoreInfo] = useState({
    name: 'POS System',
    address: 'Jl. Contoh No. 123',
    phone: '(021) 1234567',
    email: 'email@example.com',
    logoUrl: ''
  });

  useEffect(() => {
    const storeRef = ref(database, 'settings/store');
    const unsubscribe = onValue(storeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStoreInfo({
          name: data.name || 'POS System',
          address: data.address || 'Jl. Contoh No. 123',
          phone: data.phone || '(021) 1234567',
          email: data.email || 'email@example.com',
          logoUrl: data.logoUrl || ''
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center print:bg-white"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 print:shadow-none print:m-0 print:max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="print:hidden p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Invoice Penjualan</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8 print:p-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                {storeInfo.logoUrl && (
                  <img 
                    src={storeInfo.logoUrl} 
                    alt="Logo" 
                    className="h-16 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold mb-1">{storeInfo.name}</h1>
                  <p className="text-sm text-gray-600">{storeInfo.address}</p>
                  <p className="text-sm text-gray-600">Telp: {storeInfo.phone}</p>
                  {storeInfo.email && (
                    <p className="text-sm text-gray-600">Email: {storeInfo.email}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-primary-600 mb-2">INVOICE</h2>
                <p className="text-sm font-semibold">No. Invoice</p>
                <p className="text-lg font-bold">{data.invoiceNumber}</p>
                <p className="text-sm text-gray-600 mt-2">Tanggal: {data.date}</p>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-300 my-6"></div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Kepada:</h3>
              <p className="font-semibold">{data.customerName}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Status Pembayaran:</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                data.paymentStatus === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {data.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
              {data.dueDate && (
                <p className="text-sm text-gray-600 mt-2">
                  Jatuh Tempo: <span className="font-semibold">{data.dueDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Qty</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Harga</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right font-semibold">Rp {item.total.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span>Subtotal:</span>
                <span>Rp {data.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span>Pajak ({data.taxRate}%):</span>
                <span>Rp {data.tax.toLocaleString('id-ID')}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between py-2 text-sm text-red-600">
                  <span>Diskon:</span>
                  <span>- Rp {data.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 mt-2 pt-2 flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span className="text-primary-600">Rp {data.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Metode Pembayaran:</span>
              <span className="font-semibold uppercase">{data.paymentMethod}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Terima kasih atas kepercayaan Anda!</p>
              <p>Untuk pertanyaan, hubungi: (021) 1234567 atau email@example.com</p>
            </div>
          </div>

          {/* Terms (for credit) */}
          {data.paymentStatus === 'unpaid' && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2">Syarat & Ketentuan:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Pembayaran harus dilakukan sebelum tanggal jatuh tempo</li>
                <li>• Keterlambatan pembayaran dapat dikenakan denda</li>
                <li>• Hubungi kami jika ada kendala pembayaran</li>
              </ul>
            </div>
          )}
        </div>

        {/* Print button */}
        <div className="print:hidden p-6 border-t flex space-x-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
