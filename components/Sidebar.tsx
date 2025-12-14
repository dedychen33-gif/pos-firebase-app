'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Truck,
  Database,
  FolderTree,
  Settings,
  DollarSign,
  Receipt,
} from 'lucide-react';

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Produk' },
  { href: '/customers', icon: Users, label: 'Customer' },
  { href: '/suppliers', icon: Truck, label: 'Supplier' },
  { href: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Order' },
  { href: '/pos', icon: Receipt, label: 'POS / Kasir' },
  { href: '/sales', icon: ShoppingCart, label: 'Penjualan' },
  { href: '/receivables', icon: DollarSign, label: 'Piutang' },
  { href: '/reports', icon: FileText, label: 'Laporan' },
  { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">POS System</h1>
        <p className="text-sm text-primary-200">Firebase Edition</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-100 hover:bg-primary-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
