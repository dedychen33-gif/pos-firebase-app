'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, push, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Plus, Eye } from 'lucide-react';
import { PurchaseOrder, Product, Supplier, PurchaseOrderItem } from '@/lib/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const purchaseOrdersRef = ref(database, 'purchaseOrders');
    const productsRef = ref(database, 'products');
    const suppliersRef = ref(database, 'suppliers');

    const unsubscribePO = onValue(purchaseOrdersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const poArray = Object.entries(data).map(([id, po]: [string, any]) => ({
          id,
          ...po,
        }));
        setPurchaseOrders(poArray.sort((a, b) => b.orderDate - a.orderDate));
      } else {
        setPurchaseOrders([]);
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

    const unsubscribeSuppliers = onValue(suppliersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suppliersArray = Object.entries(data).map(([id, supp]: [string, any]) => ({
          id,
          ...supp,
        }));
        setSuppliers(suppliersArray);
      }
    });

    return () => {
      unsubscribePO();
      unsubscribeProducts();
      unsubscribeSuppliers();
    };
  }, []);

  const addItem = () => {
    setItems([...items, {
      productId: '',
      productName: '',
      quantity: 1,
      cost: 0,
      total: 0,
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          cost: product.cost,
          total: product.cost * newItems[index].quantity,
        };
      }
    } else if (field === 'quantity' || field === 'cost') {
      newItems[index][field] = Number(value);
      newItems[index].total = newItems[index].quantity * newItems[index].cost;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error('Pilih supplier!');
      return;
    }

    if (items.length === 0 || items.some(item => !item.productId)) {
      toast.error('Tambahkan minimal 1 produk!');
      return;
    }

    try {
      const timestamp = Date.now();
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      
      const purchaseOrdersRef = ref(database, 'purchaseOrders');
      await push(purchaseOrdersRef, {
        supplierId: selectedSupplier,
        supplierName: supplier?.name || '',
        items,
        totalAmount: calculateTotal(),
        status: 'pending',
        orderDate: timestamp,
        notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      toast.success('Purchase Order berhasil dibuat!');
      setShowModal(false);
      setSelectedSupplier('');
      setItems([]);
      setNotes('');
    } catch (error) {
      toast.error('Gagal membuat Purchase Order');
      console.error(error);
    }
  };

  const shipPO = async (po: PurchaseOrder) => {
    if (confirm('Tandai PO ini sebagai dikirim?')) {
      try {
        const timestamp = Date.now();
        const poRef = ref(database, `purchaseOrders/${po.id}`);
        
        await update(poRef, {
          status: 'shipped',
          shippedDate: timestamp,
          updatedAt: timestamp,
        });

        toast.success('PO berhasil ditandai sebagai dikirim!');
      } catch (error) {
        toast.error('Gagal memproses PO');
        console.error(error);
      }
    }
  };

  const receivePO = async (po: PurchaseOrder) => {
    if (confirm('Tandai PO ini sebagai diterima?')) {
      try {
        const timestamp = Date.now();
        const poRef = ref(database, `purchaseOrders/${po.id}`);
        
        await update(poRef, {
          status: 'received',
          receivedDate: timestamp,
          updatedAt: timestamp,
        });

        for (const item of po.items) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const productRef = ref(database, `products/${item.productId}`);
            await update(productRef, {
              stock: product.stock + item.quantity,
              updatedAt: timestamp,
            });
          }
        }

        toast.success('PO berhasil diterima dan stok diupdate!');
      } catch (error) {
        toast.error('Gagal memproses PO');
        console.error(error);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Purchase Order</h1>
              <p className="text-gray-600">Kelola pembelian dari supplier</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Buat PO</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Belum ada purchase order
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(po.orderDate), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {po.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {po.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            po.status === 'received' ? 'bg-green-100 text-green-800' :
                            po.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            po.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {po.status === 'received' ? 'Diterima' : 
                             po.status === 'shipped' ? 'Dikirim' :
                             po.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {po.status === 'pending' && (
                            <button
                              onClick={() => shipPO(po)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Kirim
                            </button>
                          )}
                          {(po.status === 'pending' || po.status === 'shipped') && (
                            <button
                              onClick={() => receivePO(po)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Terima
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl m-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Buat Purchase Order</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Item
                </label>
                <button
                  onClick={addItem}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Item
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="flex space-x-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Pilih Produk</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.cost}
                      onChange={(e) => updateItem(index, 'cost', e.target.value)}
                      placeholder="Harga"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="w-32 px-3 py-2 bg-gray-100 rounded-lg flex items-center">
                      Rp {item.total.toLocaleString('id-ID')}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSupplier('');
                  setItems([]);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Buat PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
