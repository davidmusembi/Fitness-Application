'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from '@/components/notifications/NotificationBell';

interface HeaderProps {
  role: 'Admin' | 'Staff' | 'Customer';
  profileLink: string;
  settingsLink?: string;
}

export default function Header({ role, profileLink, settingsLink }: HeaderProps) {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const getRoleColor = () => {
    switch (role) {
      case 'Admin':
        return 'from-purple-600 to-purple-700';
      case 'Staff':
        return 'from-blue-600 to-blue-700';
      case 'Customer':
        return 'from-green-600 to-green-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Staff':
        return 'bg-blue-100 text-blue-800';
      case 'Customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Welcome Message */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
            </h2>
          </div>
          <div className="md:hidden">
            <h2 className="text-base font-semibold text-gray-900">
              Hello, {session?.user?.name?.split(' ')[0] || 'User'}!
            </h2>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-gray-100">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${getRoleColor()} text-sm font-semibold text-white shadow-md`}>
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:flex md:flex-col md:items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'User'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getRoleBadgeColor()}`}>
                    {role}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileLink} className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {settingsLink && (
                <DropdownMenuItem asChild>
                  <Link href={settingsLink} className="flex cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
