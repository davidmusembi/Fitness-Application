'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, ShoppingCart, FileVideo, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import { toast } from 'sonner';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Role check is handled by the admin layout server-side, no need for client-side check
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'Admin') {
      fetchStats();
      
      // Set up auto-refresh every 30 seconds for real-time data
      const interval = setInterval(() => {
        fetchStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        // Only show success toast for manual refreshes, not auto-refreshes
        if (!showLoading) {
          console.log('Dashboard stats updated automatically');
        }
      } else {
        console.error('Stats API error:', data.error);
        toast.error(data.error || 'Failed to load statistics');
      }
    } catch (error: any) {
      console.error('Fetch stats error:', error);
      toast.error('Failed to load statistics: ' + error.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Platform overview and management</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Customers"
            value={stats?.totalCustomers || 0}
            description="Active users"
            icon={Users}
            className="bg-blue-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
            description="All time"
            icon={DollarSign}
            className="bg-green-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="This Month"
            value={`$${(stats?.revenueThisMonth || 0).toFixed(2)}`}
            description="Monthly revenue"
            icon={TrendingUp}
            className="bg-purple-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            description="Need attention"
            icon={ShoppingCart}
            className="bg-orange-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="Payment Due"
            value={`$${(stats?.paymentsPendingAmount || 0).toFixed(2)}`}
            description={`${stats?.paymentsPending || 0} orders pending`}
            icon={DollarSign}
            className="bg-red-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="Total Content"
            value={stats?.totalContent || 0}
            description="Media items"
            icon={FileVideo}
            className="bg-indigo-600 text-white border-none shadow-md"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Revenue Chart */}
          <Card className="h-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription className="text-sm">Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats?.revenueTrend && stats.revenueTrend.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <AreaChart data={stats.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="var(--color-revenue)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="h-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              <Link href="/admin/customers">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                  <Users className="mr-2 h-3 w-3" />
                  Manage Customers
                </Button>
              </Link>
              <Link href="/admin/content">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                  <FileVideo className="mr-2 h-3 w-3" />
                  Manage Content
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                  <ShoppingCart className="mr-2 h-3 w-3" />
                  Manage Products
                </Button>
              </Link>
              <Link href="/admin/transactions">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                  <DollarSign className="mr-2 h-3 w-3" />
                  View Transactions
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-sm">
                  <TrendingUp className="mr-2 h-3 w-3" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="h-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription className="text-sm">Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs py-1">Customer</TableHead>
                      <TableHead className="text-xs py-1">Email</TableHead>
                      <TableHead className="text-xs py-1">Total</TableHead>
                      <TableHead className="text-xs py-1">Status</TableHead>
                      <TableHead className="text-xs py-1">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.slice(0, 5).map((order: any) => {
                      // Get customer name from either userId or guestCustomer
                      const customerName = order.userId?.fullName || order.guestCustomer?.fullName || 'Unknown Customer';
                      const customerEmail = order.userId?.email || order.guestCustomer?.email || 'No email provided';
                      const customerType = order.userId ? 'Registered' : 'Guest';
                      
                      return (
                      <TableRow key={order._id} className="h-10">
                        <TableCell className="py-1">
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm">{customerName}</div>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {customerType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 text-sm">{customerEmail}</TableCell>
                        <TableCell className="py-1 text-sm">${order.total.toFixed(2)}</TableCell>
                        <TableCell className="py-1">
                          <Badge
                            variant={
                              order.status === 'delivered'
                                ? 'default'
                                : order.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs px-1.5 py-0.5 h-5"
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">No recent orders</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
