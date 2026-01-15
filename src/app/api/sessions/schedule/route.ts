import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import ScheduledSession from '@/models/ScheduledSession';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, scheduledFor, duration, customerId } = body;

    if (!title || !scheduledFor || !customerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create scheduled session
    const scheduledSession = await ScheduledSession.create({
      title,
      description,
      scheduledFor: new Date(scheduledFor),
      duration: duration || 60,
      customerId,
      createdBy: session.user.id,
      status: 'pending',
      notificationSent: false,
    });

    // Create notification for customer
    await Notification.create({
      userId: customerId,
      type: 'session_scheduled',
      title: 'New Session Scheduled',
      message: `A new session "${title}" has been scheduled for ${new Date(scheduledFor).toLocaleString()}`,
      relatedId: scheduledSession._id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      data: scheduledSession,
      message: 'Session scheduled successfully',
    });
  } catch (error: any) {
    console.error('Error scheduling session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    let query = {};
    
    if (session.user.role === 'Customer') {
      query = { customerId: session.user.id };
    }

    const scheduledSessions = await ScheduledSession.find(query)
      .populate('customerId', 'fullName email')
      .populate('createdBy', 'fullName')
      .sort({ scheduledFor: 1 });

    return NextResponse.json({
      success: true,
      data: scheduledSessions,
    });
  } catch (error: any) {
    console.error('Error fetching scheduled sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled sessions' },
      { status: 500 }
    );
  }
}
