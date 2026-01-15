import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import LiveSession from '@/models/LiveSession';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const liveSession = await LiveSession.findById(params.id);

    if (!liveSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has ended
    if (liveSession.status === 'ended') {
      return NextResponse.json({
        success: false,
        error: 'This session has ended and cannot be rejoined',
        canJoin: false,
        status: 'ended',
      });
    }

    // Check if user is invited (for customers)
    if (session.user.role === 'Customer') {
      const isInvited = liveSession.invitedCustomers.some(
        (id) => id.toString() === session.user.id
      );

      if (!isInvited) {
        return NextResponse.json({
          success: false,
          error: 'You are not invited to this session',
          canJoin: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      canJoin: true,
      data: {
        _id: liveSession._id,
        sessionId: liveSession.sessionId,
        title: liveSession.title,
        status: liveSession.status,
        startedAt: liveSession.startedAt,
        endedAt: liveSession.endedAt,
      },
    });
  } catch (error: any) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check session status' },
      { status: 500 }
    );
  }
}
