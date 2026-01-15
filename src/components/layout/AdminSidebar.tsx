'use client';

import Sidebar from './Sidebar';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Video,
  DollarSign,
  BarChart3,
  Calendar,
  FileText,
  Package,
  UserCog,
} from 'lucide-react';

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: UserCog,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: ShoppingBag,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: Package,
  },
  {
    label: 'Content Library',
    href: '/admin/content',
    icon: Video,
  },
  {
    label: 'Transactions',
    href: '/admin/transactions',
    icon: DollarSign,
  },
  {
    label: 'Live Sessions',
    href: '/admin/live-sessions',
    icon: Video,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

export default function AdminSidebar() {
  return <Sidebar items={adminNavItems} role="Admin" />;
}
