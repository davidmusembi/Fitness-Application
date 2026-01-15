import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import LiveSession from '@/models/LiveSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    await connectDB();

    const liveSession = await LiveSession.findOne({
      sessionId: sessionId,
    }).populate('adminId invitedCustomers joinedCustomers', 'fullName email username');

    if (!liveSession) {
      return NextResponse.json(
        { success: false, error: 'Live session not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this session
    const adminId = liveSession.adminId?._id?.toString() || liveSession.adminId?.toString();
    const userId = session.user.id;

    console.log('Authorization check:', {
      sessionId,
      userId,
      adminId,
      invitedCount: liveSession.invitedCustomers?.length || 0,
    });

    const isAdmin = adminId === userId;
    const isInvited = liveSession.invitedCustomers.some(
      (customer: any) => {
        const customerId = customer?._id?.toString() || customer?.toString();
        return customerId === userId;
      }
    );

    console.log('Authorization result:', { isAdmin, isInvited });

    if (!isAdmin && !isInvited) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to join this session. Only the host or invited participants can access it.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: liveSession,
    });
  } catch (error: any) {
    console.error('Get live session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, userId } = await request.json();
    const { sessionId } = await params;

    await connectDB();

    const liveSession = await LiveSession.findOne({
      sessionId: sessionId,
    });

    if (!liveSession) {
      return NextResponse.json(
        { success: false, error: 'Live session not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'start') {
      // Only admin can start
      if (liveSession.adminId.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Only admin can start the session' },
          { status: 403 }
        );
      }

      liveSession.status = 'live';
      liveSession.startedAt = new Date();
    } else if (action === 'join') {
      // Add user to joinedCustomers if not already there
      const userIdToAdd = userId || session.user.id;
      if (!liveSession.joinedCustomers.includes(userIdToAdd)) {
        liveSession.joinedCustomers.push(userIdToAdd);
      }
    } else if (action === 'leave') {
      // Remove user from joinedCustomers
      const userIdToRemove = userId || session.user.id;
      liveSession.joinedCustomers = liveSession.joinedCustomers.filter(
        (id: any) => id.toString() !== userIdToRemove
      );
    }

    await liveSession.save();
    await liveSession.populate('adminId invitedCustomers joinedCustomers', 'fullName email username');

    return NextResponse.json({
      success: true,
      data: liveSession,
    });
  } catch (error: any) {
    console.error('Update live session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update live session' },
      { status: 500 }
    );
  }
}
