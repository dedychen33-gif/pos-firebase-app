'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { FolderTree, Database, ChevronRight, Percent, Store } from 'lucide-react';

const settingsMenu = [
  {
    title: 'Info Toko',
    description: 'Logo dan alamat toko',
    icon: Store,
    href: '/settings/store',
    color: 'bg-indigo-500',
  },
  {
    title: 'Pajak',
    description: 'Atur persentase pajak',
    icon: Percent,
    href: '/settings/tax',
    color: 'bg-purple-500',
  },
  {
    title: 'Kategori',
    description: 'Kelola kategori produk',
    icon: FolderTree,
    href: '/categories',
    color: 'bg-blue-500',
  },
  {
    title: 'Backup/Restore',
    description: 'Backup dan restore data',
    icon: Database,
    href: '/backup',
    color: 'bg-green-500',
  },
];

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Pengaturan</h1>
            <p className="text-gray-600">Kelola pengaturan sistem Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsMenu.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${item.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
