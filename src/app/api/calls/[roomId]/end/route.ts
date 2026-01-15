import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import CallSession from '@/models/CallSession';

interface RouteParams {
  params: Promise<{
    roomId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { roomId } = await params;
    const callSession = await CallSession.findOne({ roomId });

    if (!callSession) {
      return NextResponse.json(
        { success: false, error: 'Call session not found' },
        { status: 404 }
      );
    }

    // Verify user is part of the call
    const isParticipant =
      callSession.adminId.toString() === session.user.id ||
      callSession.customerId.toString() === session.user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to end this call' },
        { status: 403 }
      );
    }

    // Calculate duration if call was active
    let duration = 0;
    if (callSession.startedAt) {
      duration = Math.floor(
        (new Date().getTime() - callSession.startedAt.getTime()) / 1000
      );
    }

    // Update call session
    callSession.status = 'ended';
    callSession.endedAt = new Date();
    callSession.duration = duration;
    await callSession.save();

    return NextResponse.json({
      success: true,
      data: callSession,
    });
  } catch (error: any) {
    console.error('End call error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
