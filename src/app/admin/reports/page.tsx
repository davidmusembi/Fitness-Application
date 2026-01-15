'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, ShoppingBag, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    newUsersThisMonth: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data from APIs
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/orders'),
        fetch('/api/products'),
      ]);

      const usersData = await usersRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      if (usersData.success && ordersData.success && productsData.success) {
        const users = usersData.data || [];
        const orders = ordersData.data || [];
        const products = productsData.data || [];

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const newUsersThisMonth = users.filter((u: any) =>
          new Date(u.createdAt) >= thisMonthStart
        ).length;

        const thisMonthOrders = orders.filter((o: any) =>
          new Date(o.createdAt) >= thisMonthStart
        );

        const revenueThisMonth = thisMonthOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        setStats({
          totalUsers: users.length,
          totalOrders: orders.length,
          totalRevenue: totalRevenue,
          totalProducts: products.length,
          newUsersThisMonth: newUsersThisMonth,
          ordersThisMonth: thisMonthOrders.length,
          revenueThisMonth: revenueThisMonth,
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm md:text-base text-gray-600">View platform statistics and generate reports</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="users">Users Report</SelectItem>
            <SelectItem value="sales">Sales Report</SelectItem>
            <SelectItem value="products">Products Report</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>


      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Overview Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.newUsersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.ordersThisMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  ${stats.revenueThisMonth.toFixed(2)} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <ShoppingBag className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-gray-500 mt-1">Active listings</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
                <CardDescription>Revenue and orders breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">This Month</span>
                  <span className="text-sm font-bold text-green-600">${stats.revenueThisMonth.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Orders This Month</span>
                  <span className="text-sm font-bold">{stats.ordersThisMonth}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Average Order Value</span>
                  <span className="text-sm font-bold">
                    ${stats.ordersThisMonth > 0 ? (stats.revenueThisMonth / stats.ordersThisMonth).toFixed(2) : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Growth
                </CardTitle>
                <CardDescription>User registration trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Total Users</span>
                  <span className="text-sm font-bold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">New This Month</span>
                  <span className="text-sm font-bold text-green-600">+{stats.newUsersThisMonth}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {stats.totalUsers > 0 ? ((stats.newUsersThisMonth / stats.totalUsers) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
