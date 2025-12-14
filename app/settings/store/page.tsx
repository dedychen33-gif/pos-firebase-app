'use client';

import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Store, Save, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoreSettingsPage() {
  const [storeName, setStoreName] = useState('POS System');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'settings/store');
    
    // Set timeout untuk loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error('Gagal memuat data. Menggunakan data default.');
    }, 5000);
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      clearTimeout(timeoutId);
      const data = snapshot.val();
      if (data) {
        setStoreName(data.name || 'POS System');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setLogoUrl(data.logoUrl || '');
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(timeoutId);
      console.error('Error loading store settings:', error);
      toast.error('Gagal memuat data toko');
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const handleSave = async () => {
    try {
      const settingsRef = ref(database, 'settings/store');
      await set(settingsRef, {
        name: storeName,
        address,
        phone,
        email,
        logoUrl,
        updatedAt: Date.now(),
      });
      toast.success('Pengaturan toko berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
      console.error(error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `logos/${timestamp}_${file.name}`;
      const imageRef = storageRef(storage, fileName);

      // Upload file with timeout
      const uploadTask = uploadBytesResumable(imageRef, file);

      // Set timeout untuk upload (30 detik)
      const uploadTimeout = setTimeout(() => {
        uploadTask.cancel();
        toast.error('Upload timeout. Coba lagi atau gunakan URL logo.');
        setUploading(false);
        setUploadProgress(0);
      }, 30000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          clearTimeout(uploadTimeout);
          console.error('Upload error:', error);
          if (error.code === 'storage/unauthorized') {
            toast.error('Tidak ada izin upload. Gunakan URL logo sebagai gantinya.');
          } else {
            toast.error('Gagal upload gambar. Coba gunakan URL logo.');
          }
          setUploading(false);
          setUploadProgress(0);
        },
        async () => {
          clearTimeout(uploadTimeout);
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setLogoUrl(downloadURL);
          setUploading(false);
          setUploadProgress(0);
          toast.success('Logo berhasil diupload!');
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Gagal upload gambar. Gunakan URL logo sebagai gantinya.');
      setUploading(false);
      setUploadProgress(0);
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
            <h1 className="text-3xl font-bold text-gray-800">Info Toko</h1>
            <p className="text-gray-600">Kelola informasi toko untuk invoice dan struk</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Informasi Toko</h2>
                <p className="text-sm text-gray-600">Data ini akan muncul di invoice dan struk</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Toko <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nama Toko Anda"
                  required
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Logo (Opsional)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com/logo.png atau upload file"
                      disabled={uploading}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {uploading && (
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Maks. 2MB (JPG, PNG, GIF)</p>
                </div>
                {logoUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      className="h-16 object-contain border border-gray-200 rounded p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        toast.error('URL logo tidak valid');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telepon <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="(021) 1234567"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Informasi</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Informasi ini akan muncul di invoice dan struk penjualan</li>
              <li>• Logo akan ditampilkan di header invoice (jika diisi)</li>
              <li>• Pastikan URL logo dapat diakses secara publik</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
