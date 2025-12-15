'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { localCache } from '@/lib/localCache';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Plus, Edit2, Trash2, Users, X, ChevronDown, ChevronUp, Package, DollarSign } from 'lucide-react';
import { Customer, Product, CustomerPrice } from '@/lib/types';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    customPrices: [] as CustomerPrice[],
  });
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingPrices, setEditingPrices] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Load dari cache dulu untuk instant loading
    const cachedCustomers = localCache.get('customers');
    const cachedProducts = localCache.get('products');

    if (cachedCustomers) {
      setCustomers(cachedCustomers);
      console.log('📦 Loaded customers from cache');
    }

    if (cachedProducts) {
      setProducts(cachedProducts);
      console.log('📦 Loaded products from cache');
    }

    // Jika ada cache, langsung set loading false
    if (cachedCustomers && cachedProducts) {
      setLoading(false);
    }

    const customersRef = ref(database, 'customers');
    const productsRef = ref(database, 'products');

    let customersLoaded = false;
    let productsLoaded = false;

    // Set timeout untuk loading dari Firebase
    const timeoutId = setTimeout(() => {
      setLoading(false);
      if (!customersLoaded || !productsLoaded) {
        if (!cachedCustomers || !cachedProducts) {
          toast.error('Gagal memuat data dari server. Menggunakan data cache.');
        }
      }
    }, 5000);

    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersArray = Object.entries(data).map(([id, cust]: [string, any]) => ({
          id,
          ...cust,
        }));
        setCustomers(customersArray);
        localCache.set('customers', customersArray); // Save to cache
        console.log('🔄 Synced customers from Firebase');
      } else {
        setCustomers([]);
        localCache.set('customers', []);
      }
      customersLoaded = true;
      if (productsLoaded) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading customers:', error);
      if (!cachedCustomers) {
        toast.error('Gagal memuat data customer');
      }
      customersLoaded = true;
      if (productsLoaded) {
        clearTimeout(timeoutId);
        setLoading(false);
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
        localCache.set('products', productsArray); // Save to cache
        console.log('🔄 Synced products from Firebase');
      } else {
        setProducts([]);
        localCache.set('products', []);
      }
      productsLoaded = true;
      if (customersLoaded) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error loading products:', error);
      if (!cachedProducts) {
        toast.error('Gagal memuat data produk');
      }
      productsLoaded = true;
      if (customersLoaded) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const timestamp = Date.now();
      
      if (editingCustomer) {
        const customerRef = ref(database, `customers/${editingCustomer.id}`);
        await update(customerRef, {
          ...formData,
          updatedAt: timestamp,
        });
        toast.success('Customer berhasil diupdate!');
      } else {
        const customersRef = ref(database, 'customers');
        await push(customersRef, {
          ...formData,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        toast.success('Customer berhasil ditambahkan!');
      }
      
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', address: '', customPrices: [] });
      setSelectedProduct('');
      setCustomPrice(0);
      setEditingCustomer(null);
    } catch (error) {
      toast.error('Gagal menyimpan customer');
      console.error(error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedProduct('');
    setCustomPrice(0);
    setSearchQuery('');
    setShowDropdown(false);
    setEditingPrices({}); // Clear editing prices when selecting new customer
  };

  const addCustomPriceToCustomer = async () => {
    if (!selectedCustomer || !selectedProduct || customPrice <= 0) {
      toast.error('Pilih produk dan masukkan harga yang valid');
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Validasi: harga minimal 15% di atas harga modal (cost)
    const minPrice = product.cost * 1.15;
    if (customPrice < minPrice) {
      toast.error(`Harga minimal Rp ${Math.round(minPrice).toLocaleString('id-ID')} (15% di atas harga modal Rp ${product.cost.toLocaleString('id-ID')})`);
      return;
    }
    
    const currentPrices = selectedCustomer.customPrices || [];
    const existingPrice = currentPrices.find((cp: CustomerPrice) => cp.productId === selectedProduct);
    if (existingPrice) {
      toast.error('Produk sudah ada dalam daftar harga khusus');
      return;
    }

    try {
      const customerRef = ref(database, `customers/${selectedCustomer.id}`);
      await update(customerRef, {
        customPrices: [...currentPrices, {
          productId: product.id,
          customPrice: customPrice,
        }],
        updatedAt: Date.now(),
      });
      toast.success('Harga khusus berhasil ditambahkan!');
      setSelectedProduct('');
      setCustomPrice(0);
      setSearchQuery('');
      setShowDropdown(false);
    } catch (error) {
      toast.error('Gagal menambahkan harga khusus');
      console.error(error);
    }
  };

  const removeCustomPriceFromCustomer = async (productId: string) => {
    if (!selectedCustomer) return;
    
    try {
      const currentPrices = selectedCustomer.customPrices || [];
      const customerRef = ref(database, `customers/${selectedCustomer.id}`);
      await update(customerRef, {
        customPrices: currentPrices.filter((cp: CustomerPrice) => cp.productId !== productId),
        updatedAt: Date.now(),
      });
      toast.success('Harga khusus berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus harga khusus');
      console.error(error);
    }
  };

  const addCustomPrice = () => {
    if (!selectedProduct || customPrice <= 0) {
      toast.error('Pilih produk dan masukkan harga yang valid');
      return;
    }
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Validasi: harga minimal 15% di atas harga modal (cost)
    const minPrice = product.cost * 1.15;
    if (customPrice < minPrice) {
      toast.error(`Harga minimal Rp ${Math.round(minPrice).toLocaleString('id-ID')} (15% di atas harga modal Rp ${product.cost.toLocaleString('id-ID')})`);
      return;
    }
    
    const existingPrice = formData.customPrices.find(cp => cp.productId === selectedProduct);
    if (existingPrice) {
      toast.error('Produk sudah ada dalam daftar harga khusus');
      return;
    }

    setFormData({
      ...formData,
      customPrices: [...formData.customPrices, {
        productId: product.id,
        customPrice: customPrice,
      }],
    });
    setSelectedProduct('');
    setCustomPrice(0);
  };

  const removeCustomPrice = (productId: string) => {
    setFormData({
      ...formData,
      customPrices: formData.customPrices.filter(cp => cp.productId !== productId),
    });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || '',
      customPrices: customer.customPrices || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus customer ini?')) {
      try {
        const customerRef = ref(database, `customers/${id}`);
        await remove(customerRef);
        toast.success('Customer berhasil dihapus!');
      } catch (error) {
        toast.error('Gagal menghapus customer');
        console.error(error);
      }
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', customPrices: [] });
    setSelectedProduct('');
    setCustomPrice(0);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data customer...</p>
              </div>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Customer</h1>
              <p className="text-gray-600">Kelola data customer Anda</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Customer</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telepon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alamat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Belum ada customer</p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {customer.address || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSelectCustomer(customer)}
                            className="text-amber-600 hover:text-amber-900 mr-3"
                            title="Atur Harga Khusus"
                          >
                            <DollarSign className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus Customer"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
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

      {/* Modal for Custom Prices */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Atur Harga Khusus - {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Kosongkan harga untuk menggunakan harga default produk
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Modal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Default</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min. Harga Khusus (15%)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const existingPrice = selectedCustomer.customPrices?.find(cp => cp.productId === product.id);
                    const minPrice = Math.round(product.cost * 1.15);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.categoryName}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          Rp {product.cost.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          Rp {product.price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                          Rp {minPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <input
                            key={`${product.id}-${existingPrice?.customPrice || 'empty'}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            defaultValue={existingPrice?.customPrice || ''}
                            onFocus={(e) => {
                              // Store initial value in editing state
                              setEditingPrices(prev => ({
                                ...prev,
                                [product.id]: e.target.value
                              }));
                            }}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Only allow numbers
                              if (inputValue === '' || /^\d+$/.test(inputValue)) {
                                setEditingPrices(prev => ({
                                  ...prev,
                                  [product.id]: inputValue
                                }));
                              } else {
                                // Revert to last valid value
                                e.target.value = editingPrices[product.id] || '';
                              }
                            }}
                            onBlur={async (e) => {
                              const inputValue = e.target.value;
                              const value = inputValue === '' ? 0 : Number(inputValue);
                              
                              const currentPrices = selectedCustomer.customPrices || [];
                              const existingIndex = currentPrices.findIndex((cp: CustomerPrice) => cp.productId === product.id);
                              
                              if (inputValue === '' || value === 0) {
                                // Remove custom price
                                if (existingIndex >= 0) {
                                  const newPrices = currentPrices.filter((cp: CustomerPrice) => cp.productId !== product.id);
                                  const customerRef = ref(database, `customers/${selectedCustomer.id}`);
                                  await update(customerRef, {
                                    customPrices: newPrices,
                                    updatedAt: Date.now(),
                                  });
                                  toast.success('Harga khusus dihapus');
                                }
                                setEditingPrices(prev => {
                                  const newPrices = { ...prev };
                                  delete newPrices[product.id];
                                  return newPrices;
                                });
                              } else if (!isNaN(value)) {
                                if (value < minPrice) {
                                  toast.error(`Harga minimal Rp ${minPrice.toLocaleString('id-ID')}`);
                                  // Don't save, just clear editing state
                                  setEditingPrices(prev => {
                                    const newPrices = { ...prev };
                                    delete newPrices[product.id];
                                    return newPrices;
                                  });
                                } else {
                                  // Valid price, save to Firebase
                                  let newPrices;
                                  if (existingIndex >= 0) {
                                    newPrices = [...currentPrices];
                                    newPrices[existingIndex] = { productId: product.id, customPrice: value };
                                  } else {
                                    newPrices = [...currentPrices, { productId: product.id, customPrice: value }];
                                  }
                                  
                                  const customerRef = ref(database, `customers/${selectedCustomer.id}`);
                                  await update(customerRef, {
                                    customPrices: newPrices,
                                    updatedAt: Date.now(),
                                  });
                                  
                                  toast.success('Harga khusus berhasil disimpan');
                                  
                                  // Clear local editing state after save
                                  setEditingPrices(prev => {
                                    const newPrices = { ...prev };
                                    delete newPrices[product.id];
                                    return newPrices;
                                  });
                                }
                              }
                            }}
                            placeholder="Default"
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {selectedCustomer.customPrices?.length || 0} produk dengan harga khusus
              </p>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingCustomer ? 'Edit Customer' : 'Tambah Customer'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    setFormData({ name: '', email: '', phone: '', address: '', customPrices: [] });
                    setSelectedProduct('');
                    setCustomPrice(0);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingCustomer ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
