'use client';

import Sidebar from './Sidebar';
import {
  LayoutDashboard,
  Video,
} from 'lucide-react';

const staffNavItems = [
  {
    label: 'Dashboard',
    href: '/staff/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Content Library',
    href: '/staff/content',
    icon: Video,
  },
];

export default function StaffSidebar() {
  return <Sidebar items={staffNavItems} role="Staff" />;
}
