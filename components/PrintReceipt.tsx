'use client';

import { useEffect } from 'react';

interface ReceiptData {
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
}

interface PrintReceiptProps {
  data: ReceiptData;
  onClose: () => void;
}

export default function PrintReceipt({ data, onClose }: PrintReceiptProps) {
  useEffect(() => {
    // Auto print when component mounts
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
        className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4 print:shadow-none print:m-0 print:max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen view - with close button */}
        <div className="print:hidden p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Struk Transaksi</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Receipt content - will be printed */}
        <div className="p-8 print:p-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">POS System</h1>
            <p className="text-sm text-gray-600">Struk Penjualan</p>
            <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
          </div>

          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">No. Invoice:</span>
              <span className="font-semibold">{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Tanggal:</span>
              <span>{data.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span>{data.customerName}</span>
            </div>
          </div>

          <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

          {/* Items */}
          <div className="mb-4">
            {data.items.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between font-medium">
                  <span>{item.name}</span>
                  <span>Rp {item.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {data.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak ({data.taxRate}%):</span>
              <span>Rp {data.tax.toLocaleString('id-ID')}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon:</span>
                <span>- Rp {data.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>Rp {data.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

          <div className="text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Metode Pembayaran:</span>
              <span className="font-semibold uppercase">{data.paymentMethod}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 mt-6">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="mt-1">Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
        </div>

        {/* Print button - only visible on screen */}
        <div className="print:hidden p-6 border-t flex space-x-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            🖨️ Print Struk
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
