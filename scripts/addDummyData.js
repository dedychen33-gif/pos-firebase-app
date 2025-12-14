const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set } = require('firebase/database');

// Firebase configuration - ganti dengan config Anda
const firebaseConfig = {
  apiKey: "AIzaSyCg9HHuBs4giYxFkKMG2-fCe1idSKK6tr0",
  authDomain: "sjaposfirebase.firebaseapp.com",
  databaseURL: "https://sjaposfirebase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sjaposfirebase",
  storageBucket: "sjaposfirebase.firebasestorage.app",
  messagingSenderId: "670386053170",
  appId: "1:670386053170:web:0d2ef2f98e6c6a8384af03"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const generateBarcode = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

const generateSKU = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SJA${randomNum}`;
};

async function addDummyData() {
  try {
    console.log('🔥 Menambahkan data dummy ke Firebase...\n');

    // 1. Tambah Kategori
    console.log('📁 Menambahkan kategori...');
    const categoriesRef = ref(database, 'categories');
    const timestamp = Date.now();

    const categories = [
      { name: 'Makanan', description: 'Produk makanan dan snack' },
      { name: 'Minuman', description: 'Minuman segar dan kemasan' },
      { name: 'Sembako', description: 'Kebutuhan pokok sehari-hari' },
      { name: 'Elektronik', description: 'Peralatan elektronik' },
      { name: 'Alat Tulis', description: 'Perlengkapan kantor dan sekolah' }
    ];

    const categoryIds = [];
    for (const cat of categories) {
      const newCatRef = push(categoriesRef);
      await set(newCatRef, {
        ...cat,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      categoryIds.push({ id: newCatRef.key, name: cat.name });
      console.log(`  ✓ ${cat.name}`);
    }

    console.log('\n📦 Menambahkan produk...');
    const productsRef = ref(database, 'products');

    // 2. Tambah Produk
    const products = [
      // Makanan
      { name: 'Indomie Goreng', categoryId: categoryIds[0].id, categoryName: categoryIds[0].name, price: 3500, cost: 2800, stock: 100, minStock: 20, description: 'Mie instan rasa goreng' },
      { name: 'Chitato Sapi Panggang', categoryId: categoryIds[0].id, categoryName: categoryIds[0].name, price: 12000, cost: 9500, stock: 50, minStock: 10, description: 'Keripik kentang rasa sapi panggang' },
      { name: 'Oreo Original', categoryId: categoryIds[0].id, categoryName: categoryIds[0].name, price: 8500, cost: 7000, stock: 60, minStock: 15, description: 'Biskuit sandwich coklat' },
      { name: 'Roti Tawar Sari Roti', categoryId: categoryIds[0].id, categoryName: categoryIds[0].name, price: 15000, cost: 12000, stock: 30, minStock: 5, description: 'Roti tawar kemasan' },
      
      // Minuman
      { name: 'Aqua 600ml', categoryId: categoryIds[1].id, categoryName: categoryIds[1].name, price: 4000, cost: 3200, stock: 150, minStock: 30, description: 'Air mineral kemasan' },
      { name: 'Teh Botol Sosro', categoryId: categoryIds[1].id, categoryName: categoryIds[1].name, price: 5000, cost: 4000, stock: 80, minStock: 20, description: 'Teh dalam botol' },
      { name: 'Coca Cola 330ml', categoryId: categoryIds[1].id, categoryName: categoryIds[1].name, price: 6500, cost: 5200, stock: 70, minStock: 15, description: 'Minuman bersoda' },
      { name: 'Susu Ultra Milk 1L', categoryId: categoryIds[1].id, categoryName: categoryIds[1].name, price: 18000, cost: 15000, stock: 40, minStock: 10, description: 'Susu UHT full cream' },
      
      // Sembako
      { name: 'Beras Premium 5kg', categoryId: categoryIds[2].id, categoryName: categoryIds[2].name, price: 75000, cost: 65000, stock: 50, minStock: 10, description: 'Beras kualitas premium' },
      { name: 'Minyak Goreng Bimoli 2L', categoryId: categoryIds[2].id, categoryName: categoryIds[2].name, price: 35000, cost: 30000, stock: 60, minStock: 15, description: 'Minyak goreng kemasan' },
      { name: 'Gula Pasir 1kg', categoryId: categoryIds[2].id, categoryName: categoryIds[2].name, price: 15000, cost: 13000, stock: 80, minStock: 20, description: 'Gula pasir putih' },
      { name: 'Telur Ayam 1kg', categoryId: categoryIds[2].id, categoryName: categoryIds[2].name, price: 28000, cost: 25000, stock: 45, minStock: 10, description: 'Telur ayam segar' },
      
      // Elektronik
      { name: 'Baterai AA Alkaline', categoryId: categoryIds[3].id, categoryName: categoryIds[3].name, price: 15000, cost: 12000, stock: 100, minStock: 20, description: 'Baterai AA 4 pcs' },
      { name: 'Kabel USB Type-C', categoryId: categoryIds[3].id, categoryName: categoryIds[3].name, price: 25000, cost: 18000, stock: 40, minStock: 10, description: 'Kabel charger USB-C' },
      { name: 'Powerbank 10000mAh', categoryId: categoryIds[3].id, categoryName: categoryIds[3].name, price: 150000, cost: 120000, stock: 20, minStock: 5, description: 'Powerbank portable' },
      
      // Alat Tulis
      { name: 'Pulpen Standard AE7', categoryId: categoryIds[4].id, categoryName: categoryIds[4].name, price: 2500, cost: 1800, stock: 200, minStock: 50, description: 'Pulpen tinta hitam' },
      { name: 'Buku Tulis 58 Lembar', categoryId: categoryIds[4].id, categoryName: categoryIds[4].name, price: 5000, cost: 3500, stock: 150, minStock: 30, description: 'Buku tulis bergaris' },
      { name: 'Pensil 2B Faber Castell', categoryId: categoryIds[4].id, categoryName: categoryIds[4].name, price: 3000, cost: 2200, stock: 180, minStock: 40, description: 'Pensil kayu 2B' },
      { name: 'Penghapus Putih', categoryId: categoryIds[4].id, categoryName: categoryIds[4].name, price: 2000, cost: 1500, stock: 250, minStock: 50, description: 'Penghapus karet putih' },
      { name: 'Spidol Whiteboard', categoryId: categoryIds[4].id, categoryName: categoryIds[4].name, price: 8000, cost: 6000, stock: 60, minStock: 15, description: 'Spidol papan tulis' }
    ];

    for (const product of products) {
      const newProdRef = push(productsRef);
      await set(newProdRef, {
        ...product,
        barcode: generateBarcode(),
        sku: generateSKU(),
        isBundle: false,
        imageUrl: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });
      console.log(`  ✓ ${product.name} - Rp ${product.price.toLocaleString('id-ID')}`);
    }

    console.log('\n✅ Data dummy berhasil ditambahkan!');
    console.log(`📊 Total: ${categories.length} kategori, ${products.length} produk`);
    console.log('\n🌐 Buka aplikasi di http://localhost:3000');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDummyData();
