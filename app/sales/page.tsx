'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, push, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Plus, Trash2, ShoppingCart, Package, Search } from 'lucide-react';
import { Product, Customer, SaleItem } from '@/lib/types';
import toast from 'react-hot-toast';
import PrintInvoice from '@/components/PrintInvoice';
import { format } from 'date-fns';

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(10);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dueDays, setDueDays] = useState(30);

  useEffect(() => {
    const productsRef = ref(database, 'products');
    const customersRef = ref(database, 'customers');
    const taxRef = ref(database, 'settings/tax');

    const unsubscribeTax = onValue(taxRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.rate !== undefined) {
        setTaxRate(data.rate);
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

    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const customersArray = Object.entries(data).map(([id, cust]: [string, any]) => ({
          id,
          ...cust,
        }));
        setCustomers(customersArray);
      }
    });

    return () => {
      unsubscribeTax();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  // Update cart prices when customer changes
  useEffect(() => {
    if (cart.length > 0 && selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      
      setCart(prevCart => prevCart.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return item;
        
        let customerPrice = product.price;
        if (customer && customer.customPrices) {
          const customPrice = customer.customPrices.find(cp => cp.productId === item.productId);
          if (customPrice) {
            customerPrice = customPrice.customPrice;
          }
        }
        
        return {
          ...item,
          price: customerPrice,
          total: item.quantity * customerPrice
        };
      }));
    }
  }, [selectedCustomer]);

  const getCustomerPrice = (productId: string, basePrice: number) => {
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer || !customer.customPrices) {
      return basePrice;
    }

    const customPrice = customer.customPrices.find(cp => cp.productId === productId);
    return customPrice ? customPrice.customPrice : basePrice;
  };

  const addToCart = (product: Product) => {
    if (!selectedCustomer) {
      toast.error('Pilih customer terlebih dahulu!');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Stok produk habis!');
      return;
    }

    const customerPrice = getCustomerPrice(product.id, product.price);
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Stok tidak mencukupi!');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * customerPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: customerPrice,
        total: customerPrice,
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      toast.error('Stok tidak mencukupi!');
      return;
    }

    const customerPrice = getCustomerPrice(product.id, product.price);
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, price: customerPrice, total: newQuantity * customerPrice }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      toast.error('Pilih customer terlebih dahulu!');
      return;
    }

    if (cart.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomer) {
      toast.error('Pilih customer untuk pembayaran kredit!');
      return;
    }

    try {
      const { subtotal, tax, total } = calculateTotal();
      const timestamp = Date.now();
      
      const customer = customers.find(c => c.id === selectedCustomer);
      
      // Calculate due date for credit payment
      const dueDate = paymentMethod === 'credit' ? timestamp + (dueDays * 24 * 60 * 60 * 1000) : undefined;
      const paymentStatus = paymentMethod === 'credit' ? 'unpaid' : 'paid';
      
      const salesRef = ref(database, 'sales');
      await push(salesRef, {
        customerId: selectedCustomer,
        customerName: customer?.name || '',
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        paymentStatus,
        dueDate,
        saleDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = ref(database, `products/${item.productId}`);
          await update(productRef, {
            stock: product.stock - item.quantity,
            updatedAt: timestamp,
          });
        }
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Prepare invoice data
      const invoice = {
        invoiceNumber,
        date: format(new Date(), 'dd/MM/yyyy HH:mm'),
        customerName: customer?.name || '',
        items: cart.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal,
        tax,
        taxRate,
        discount,
        total,
        paymentMethod,
        paymentStatus: paymentStatus,
        dueDate: dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : undefined
      };
      
      setReceiptData(invoice);
      setShowReceipt(true);
      
      toast.success('Transaksi berhasil!');
      setCart([]);
      setSelectedCustomer('');
      setDiscount(0);
    } catch (error) {
      toast.error('Gagal memproses transaksi');
      console.error(error);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Penjualan Customer</h1>
            <p className="text-gray-600">Transaksi penjualan ke customer terdaftar</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Customer Selection - Required */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Customer <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">-- Pilih Customer --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
                {!selectedCustomer && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Wajib pilih customer untuk melanjutkan</p>
                )}
              </div>

              {/* Products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Produk</h2>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={!selectedCustomer}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        !selectedCustomer 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100'
                          : product.stock === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-primary-50 hover:border-primary-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3 mb-2">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.categoryName}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary-600">
                        Rp {getCustomerPrice(product.id, product.price).toLocaleString('id-ID')}
                      </div>
                      <div className={`text-xs mt-1 ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-500'}`}>
                        Stok: {product.stock}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Keranjang
                </h2>

                <div className="mb-4 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Keranjang kosong
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between mb-3 pb-3 border-b">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.productName}</div>
                          <div className="text-xs text-gray-600">
                            Rp {item.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer' | 'credit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="credit">Kredit</option>
                  </select>
                </div>

                {paymentMethod === 'credit' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jatuh Tempo (Hari)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jatuh tempo: {format(new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border-t pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pajak ({taxRate}%):</span>
                    <span>Rp {tax.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Diskon:</span>
                    <span>- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary-600">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || !selectedCustomer}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Proses Penjualan
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Print Invoice Modal */}
      {showReceipt && receiptData && (
        <PrintInvoice 
          data={receiptData} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
