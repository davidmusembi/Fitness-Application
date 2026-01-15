'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Calendar, BarChart3 } from 'lucide-react';

interface StaffStats {
  assignedCustomers: number;
  uploadedContent: number;
  scheduledSessions: number;
  totalViews: number;
}

export default function StaffDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/staff/stats');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session?.user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Assigned Customers</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.assignedCustomers || 0}</div>
            <p className="text-xs text-white/75">Active customers</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Uploaded Content</CardTitle>
            <Video className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.uploadedContent || 0}</div>
            <p className="text-xs text-white/75">Total media items</p>
          </CardContent>
        </Card>

        <Card className="bg-green-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Scheduled Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.scheduledSessions || 0}</div>
            <p className="text-xs text-white/75">Upcoming sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalViews || 0}</div>
            <p className="text-xs text-white/75">Content views</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">No recent uploads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">No upcoming sessions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
