import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';

// GET - List orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    let query: any = {};

    // Customers can only see their own orders
    if (session.user.role === 'Customer') {
      query.userId = session.user.id;
    }
    // Admin can see all orders

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email')
      .populate('products.productId', 'name imageUrl');

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
