# POS Firebase App

Aplikasi Point of Sale (POS) modern dengan Firebase Realtime Database, dibangun menggunakan Next.js, TypeScript, dan TailwindCSS.

## ✨ Fitur

### Core Features
- ✅ **Master Produk** - Tambah, edit, hapus produk dengan kategori
- ✅ **Master Customer** - Kelola data customer
- ✅ **Master Supplier** - Kelola data supplier
- ✅ **Kategori Produk** - Kelola kategori yang dapat diedit dari web dan Android
- ✅ **Purchase Order** - Buat PO dari supplier dan update stok otomatis
- ✅ **Point of Sale (POS)** - Sistem transaksi penjualan yang mudah
- ✅ **Laporan** - Laporan penjualan, stok, dan analisis bisnis
- ✅ **Backup/Restore** - Backup dan restore database dalam format JSON
- ✅ **Firebase Realtime Database** - Sinkronisasi real-time antara web dan Android

### Fitur Tambahan
- 📊 Dashboard dengan statistik real-time
- 📈 Grafik penjualan
- 🔔 Notifikasi stok menipis
- 💰 Perhitungan pajak dan diskon otomatis
- 📱 Responsive design untuk semua perangkat
- 🎨 UI modern dengan TailwindCSS

## 🚀 Teknologi

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Realtime Database
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Firebase Account
- Vercel Account (untuk deployment)

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd pos-firebase-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Realtime Database**
3. Set database rules ke mode development (untuk testing):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**⚠️ PENTING**: Untuk production, gunakan rules yang lebih aman dengan authentication.

4. Copy konfigurasi Firebase dari Project Settings

### 4. Environment Variables

1. Copy file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Isi dengan konfigurasi Firebase Anda:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📦 Build untuk Production

```bash
npm run build
npm start
```

## 🌐 Deploy ke Vercel

### Otomatis via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Manual via Vercel Dashboard

1. Push code ke GitHub/GitLab/Bitbucket
2. Import project di [Vercel](https://vercel.com)
3. Tambahkan environment variables di Vercel dashboard
4. Deploy!

## 📱 Struktur Database Firebase

```
{
  "categories": {
    "categoryId": {
      "name": "string",
      "description": "string",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "products": {
    "productId": {
      "name": "string",
      "categoryId": "string",
      "categoryName": "string",
      "sku": "string",
      "price": "number",
      "cost": "number",
      "stock": "number",
      "minStock": "number",
      "description": "string",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "customers": {
    "customerId": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "suppliers": {
    "supplierId": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "purchaseOrders": {
    "poId": {
      "supplierId": "string",
      "supplierName": "string",
      "items": [],
      "totalAmount": "number",
      "status": "pending|received|cancelled",
      "orderDate": "number",
      "receivedDate": "number",
      "notes": "string",
      "createdAt": "number",
      "updatedAt": "number"
    }
  },
  "sales": {
    "saleId": {
      "customerId": "string",
      "customerName": "string",
      "items": [],
      "subtotal": "number",
      "tax": "number",
      "discount": "number",
      "total": "number",
      "paymentMethod": "cash|card|transfer",
      "saleDate": "number",
      "createdAt": "number",
      "updatedAt": "number"
    }
  }
}
```

## 🔐 Security Best Practices

Untuk production, update Firebase Realtime Database rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

Dan implementasikan Firebase Authentication.

## 📝 License

MIT

## 👨‍💻 Developer

Dibuat dengan ❤️ menggunakan Next.js dan Firebase

---

**Happy Coding! 🚀**
