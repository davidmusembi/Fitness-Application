import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Progress from '@/models/Progress';
import Content from '@/models/Content';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Customer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch all progress records for the user
    const progressRecords = await Progress.find({
      userId: session.user.id
    }).populate('contentId');

    // Get total available media
    const totalMedia = await Content.countDocuments();

    // Calculate stats
    const completedContent = progressRecords.filter(
      (p) => p.status === 'completed'
    ).length;

    const inProgressContent = progressRecords.filter(
      (p) => p.status === 'in-progress'
    ).length;

    const completionPercentage = totalMedia > 0
      ? Math.round((completedContent / totalMedia) * 100)
      : 0;

    // Calculate current streak
    const currentStreak = calculateStreak(progressRecords);

    // Calculate weekly summary
    const weeklySummary = calculateWeeklySummary(progressRecords);

    // Recent activity
    const recentActivity = progressRecords
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((p: any) => ({
        id: p._id,
        mediaTitle: p.contentId?.title || 'Unknown',
        progress: p.progress,
        status: p.status,
        updatedAt: p.updatedAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalContent: totalMedia,
        completedContent,
        inProgressContent,
        completionPercentage,
        currentStreak,
        weeklyHours: weeklySummary.hoursEngaged,
        weeklyGoalsMet: weeklySummary.itemsCompleted,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// Helper function to calculate streak
function calculateStreak(progressRecords: any[]): number {
  if (progressRecords.length === 0) return 0;

  // Sort by update date descending
  const sorted = progressRecords
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const record of sorted) {
    const recordDate = new Date(record.updatedAt);
    recordDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

// Helper function to calculate weekly summary
function calculateWeeklySummary(progressRecords: any[]): {
  hoursEngaged: number;
  itemsCompleted: number;
} {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekRecords = progressRecords.filter(
    (p) => new Date(p.updatedAt) >= oneWeekAgo
  );

  const itemsCompleted = weekRecords.filter(
    (p) => p.status === 'completed'
  ).length;

  // Estimate hours based on progress (rough calculation)
  const hoursEngaged = weekRecords.reduce((total, record) => {
    // Assume average content is 30 minutes
    const estimatedMinutes = (record.progress / 100) * 30;
    return total + estimatedMinutes / 60;
  }, 0);

  return {
    hoursEngaged: Math.round(hoursEngaged * 10) / 10,
    itemsCompleted,
  };
}
