import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Content from '@/models/Content';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Set cache headers to prevent caching for real-time data
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    // Get current timestamp for real-time tracking
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel execution for better performance
    const [
      totalCustomers,
      totalStaff,
      revenueData,
      monthlyRevenue,
      dailyRevenue,
      pendingOrders,
      paymentsPending,
      totalContent,
      recentOrders,
      revenueTrend,
      newCustomersToday,
      ordersToday
    ] = await Promise.all([
      // Get total customers
      User.countDocuments({ role: 'Customer' }),
      
      // Get total staff
      User.countDocuments({ role: 'Staff' }),
      
      // Calculate total revenue from paid orders
      Order.aggregate([
        { 
          $match: { 
            $or: [
              { paymentStatus: 'paid' },
              { status: 'delivered' }
            ]
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      // Revenue this month from paid orders
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'paid' },
              { status: 'delivered' }
            ],
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      // Revenue today from paid orders
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'paid' },
              { status: 'delivered' }
            ],
            createdAt: { $gte: startOfDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      // Pending orders
      Order.countDocuments({
        status: { $in: ['pending', 'processing'] }
      }),
      
      // Payment pending/due orders with total amount
      Order.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['pending', 'failed'] },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' }
          }
        }
      ]),
      
      // Total content
      Content.countDocuments(),
      
      // Recent orders with populated user data and guest customer info
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'fullName email')
        .select('userId guestCustomer total status paymentStatus createdAt')
        .lean(),
      
      // Revenue trend (last 7 days) from paid orders
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'paid' },
              { status: 'delivered' }
            ],
            createdAt: { 
              $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // New customers today
      User.countDocuments({
        role: 'Customer',
        createdAt: { $gte: startOfDay }
      }),
      
      // Orders today (all orders including pending)
      Order.countDocuments({
        createdAt: { $gte: startOfDay }
      })
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const revenueThisMonth = monthlyRevenue[0]?.total || 0;
    const revenueToday = dailyRevenue[0]?.total || 0;

    const paymentsPendingData = paymentsPending[0] || { count: 0, totalAmount: 0 };

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalStaff,
        totalRevenue,
        revenueThisMonth,
        revenueToday,
        pendingOrders,
        paymentsPending: paymentsPendingData.count,
        paymentsPendingAmount: paymentsPendingData.totalAmount,
        totalContent,
        recentOrders,
        revenueTrend,
        newCustomersToday,
        ordersToday,
        lastUpdated: now.toISOString(),
      },
    }, { headers });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
