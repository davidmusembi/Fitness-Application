'use client';

import Sidebar from './Sidebar';
import {
  LayoutDashboard,
  Video,
  User,
  Library,
  ShoppingBag,
  History,
} from 'lucide-react';

const customerNavItems = [
  {
    label: 'Dashboard',
    href: '/customer/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Content Library',
    href: '/customer/content',
    icon: Library,
  },
  {
    label: 'Live Sessions',
    href: '/customer/live-sessions',
    icon: Video,
  },
  {
    label: 'Shop Supplements',
    href: '/customer/shop',
    icon: ShoppingBag,
  },
  {
    label: 'Watch History',
    href: '/customer/history',
    icon: History,
  },
  {
    label: 'Profile',
    href: '/customer/profile',
    icon: User,
  },
];

export default function CustomerSidebar() {
  return <Sidebar items={customerNavItems} role="Customer" />;
}
