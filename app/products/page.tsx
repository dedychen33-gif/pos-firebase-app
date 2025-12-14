'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Plus, Edit2, Trash2, Package, AlertTriangle, Image as ImageIcon, X } from 'lucide-react';
import { Product, Category, BundleItem } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    barcode: '',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    description: '',
    imageUrl: '',
    isBundle: false,
    bundleItems: [] as BundleItem[],
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedBundleProduct, setSelectedBundleProduct] = useState('');
  const [bundleQuantity, setBundleQuantity] = useState(1);

  const generateBarcode = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  const generateSKU = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `SJA${randomNum}`;
  };

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const addBundleItem = () => {
    if (!selectedBundleProduct || bundleQuantity <= 0) {
      toast.error('Pilih produk dan masukkan jumlah yang valid');
      return;
    }
    const product = products.find(p => p.id === selectedBundleProduct);
    if (!product) return;
    
    const existingItem = formData.bundleItems.find(item => item.productId === selectedBundleProduct);
    if (existingItem) {
      toast.error('Produk sudah ada dalam paket');
      return;
    }

    setFormData({
      ...formData,
      bundleItems: [...formData.bundleItems, {
        productId: product.id,
        productName: product.name,
        quantity: bundleQuantity,
      }],
    });
    setSelectedBundleProduct('');
    setBundleQuantity(1);
  };

  const removeBundleItem = (productId: string) => {
    setFormData({
      ...formData,
      bundleItems: formData.bundleItems.filter(item => item.productId !== productId),
    });
  };

  const calculateBundleCost = () => {
    if (!formData.isBundle || formData.bundleItems.length === 0) {
      return 0;
    }
    return formData.bundleItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.cost * item.quantity : 0);
    }, 0);
  };

  useEffect(() => {
    if (formData.isBundle) {
      const bundleCost = calculateBundleCost();
      if (bundleCost !== formData.cost) {
        setFormData(prev => ({ ...prev, cost: bundleCost }));
      }
    }
  }, [formData.bundleItems, formData.isBundle]);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const categoriesRef = ref(database, 'categories');

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsArray = Object.entries(data).map(([id, prod]: [string, any]) => ({
          id,
          ...prod,
        }));
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesArray = Object.entries(data).map(([id, cat]: [string, any]) => ({
          id,
          ...cat,
        }));
        setCategories(categoriesArray);
      } else {
        setCategories([]);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const timestamp = Date.now();
      const category = categories.find(c => c.id === formData.categoryId);
      
      if (formData.isBundle && formData.bundleItems.length === 0) {
        toast.error('Produk paket harus memiliki minimal 1 item');
        return;
      }

      const bundleCost = formData.isBundle ? calculateBundleCost() : Number(formData.cost);
      
      const productData = {
        ...formData,
        name: capitalizeWords(formData.name),
        categoryName: category?.name || '',
        price: Number(formData.price),
        cost: bundleCost,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        isBundle: formData.isBundle,
        bundleItems: formData.isBundle ? formData.bundleItems : [],
        imageUrl: formData.imageUrl || '',
      };
      
      if (editingProduct) {
        const productRef = ref(database, `products/${editingProduct.id}`);
        await update(productRef, {
          ...productData,
          updatedAt: timestamp,
        });
        toast.success('Produk berhasil diupdate!');
      } else {
        const productsRef = ref(database, 'products');
        await push(productsRef, {
          ...productData,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        toast.success('Produk berhasil ditambahkan!');
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Gagal menyimpan produk');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      barcode: generateBarcode(),
      sku: generateSKU(),
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 0,
      description: '',
      imageUrl: '',
      isBundle: false,
      bundleItems: [],
    });
    setImagePreview('');
    setSelectedBundleProduct('');
    setBundleQuantity(1);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      barcode: product.barcode,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      isBundle: product.isBundle || false,
      bundleItems: product.bundleItems || [],
    });
    setImagePreview(product.imageUrl || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        const productRef = ref(database, `products/${id}`);
        await remove(productRef);
        toast.success('Produk berhasil dihapus!');
      } catch (error) {
        toast.error('Gagal menghapus produk');
        console.error(error);
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Produk</h1>
              <p className="text-gray-600">Kelola produk Anda</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Belum ada produk</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">{product.barcode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Rp {product.price.toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm ${product.stock <= product.minStock ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                              {product.stock}
                            </span>
                            {product.stock <= product.minStock && (
                              <AlertTriangle className="w-4 h-4 text-red-600 ml-1" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama produk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isBundle}
                        onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked, bundleItems: e.target.checked ? formData.bundleItems : [] })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Produk Paket/Bundle</span>
                    </label>
                    <span className="text-xs text-gray-500">Centang jika produk ini adalah paket dari beberapa produk</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barcode
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          required
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                          placeholder="9 digit"
                          maxLength={9}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          required
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="SJA123456"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
              
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga Jual
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga Beli
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                        disabled={formData.isBundle}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={formData.isBundle ? 'Auto-calculated from bundle items' : ''}
                      />
                      {formData.isBundle && (
                        <p className="text-xs text-gray-500 mt-1">
                          Harga modal dihitung otomatis dari item paket
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Minimum
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {formData.isBundle && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Paket
                      </label>
                      <div className="space-y-2 mb-3">
                        {formData.bundleItems.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{item.productName} x {item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => removeBundleItem(item.productId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <select
                          value={selectedBundleProduct}
                          onChange={(e) => setSelectedBundleProduct(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          <option value="">Pilih Produk</option>
                          {products.filter(p => !p.isBundle && p.id !== editingProduct?.id).map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={bundleQuantity}
                          onChange={(e) => setBundleQuantity(Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          placeholder="Qty"
                        />
                        <button
                          type="button"
                          onClick={addBundleItem}
                          className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Produk
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <label className="cursor-pointer">
                            <span className="text-sm text-primary-600 hover:text-primary-700">Upload gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">Max 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingProduct ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
