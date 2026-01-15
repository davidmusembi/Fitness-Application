import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import LiveSession from '@/models/LiveSession';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query: any = {};

    // Admins see their created sessions, Customers see sessions they're invited to
    if (session.user.role === 'Admin') {
      query.adminId = session.user.id;
    } else if (session.user.role === 'Customer') {
      query.invitedCustomers = session.user.id;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized role' },
        { status: 403 }
      );
    }

    if (status) {
      query.status = status;
    }

    const liveSessions = await LiveSession.find(query)
      .populate('adminId invitedCustomers joinedCustomers', 'fullName email username')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: liveSessions,
    });
  } catch (error: any) {
    console.error('Fetch live sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live sessions' },
      { status: 500 }
    );
  }
}
