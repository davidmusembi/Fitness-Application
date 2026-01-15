import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Content from '@/models/Content';
import Session from '@/models/Session';
import Progress from '@/models/Progress';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Staff') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get assigned customers count
    const assignedCustomers = await User.countDocuments({
      role: 'Customer',
      assignedStaff: session.user.id,
    });

    // Get uploaded content count by this staff member
    const uploadedContent = await Content.countDocuments({
      uploadedBy: session.user.id,
    });

    // Get scheduled sessions for this staff member (where they are creator or participant)
    const scheduledSessions = await Session.countDocuments({
      $or: [
        { createdBy: session.user.id },
        { participants: session.user.id }
      ],
      status: { $in: ['scheduled', 'in-progress'] },
    });

    // Get total views for content uploaded by this staff member
    const staffContent = await Content.find({
      uploadedBy: session.user.id,
    }).select('_id');

    const contentIds = staffContent.map(c => c._id);

    // Count total progress records (views) for this staff's content
    const totalViews = await Progress.countDocuments({
      contentId: { $in: contentIds },
    });

    return NextResponse.json({
      success: true,
      data: {
        assignedCustomers,
        uploadedContent,
        scheduledSessions,
        totalViews,
      },
    });
  } catch (error: any) {
    console.error('Staff stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff statistics' },
      { status: 500 }
    );
  }
}
