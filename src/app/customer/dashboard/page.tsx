'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, BookOpen, Clock, TrendingUp, Video } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalContent: number;
  completedContent: number;
  inProgressContent: number;
  completionPercentage: number;
  currentStreak: number;
  weeklyHours: number;
  weeklyGoalsMet: number;
  recentActivity: Array<{
    id: string;
    mediaTitle: string;
    progress: number;
    status: string;
    updatedAt: string;
  }>;
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customer/stats');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        // Don't show error for empty stats, just use defaults
        console.log('No stats available yet');
        setStats({
          totalContent: 0,
          completedContent: 0,
          inProgressContent: 0,
          completionPercentage: 0,
          currentStreak: 0,
          weeklyHours: 0,
          weeklyGoalsMet: 0,
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Set empty stats instead of showing error
      setStats({
        totalContent: 0,
        completedContent: 0,
        inProgressContent: 0,
        completionPercentage: 0,
        currentStreak: 0,
        weeklyHours: 0,
        weeklyGoalsMet: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate weekly chart data (empty initially, will be populated from real data later)
  const weeklyData = [
    { day: 'Mon', hours: 0, completed: 0 },
    { day: 'Tue', hours: 0, completed: 0 },
    { day: 'Wed', hours: 0, completed: 0 },
    { day: 'Thu', hours: 0, completed: 0 },
    { day: 'Fri', hours: 0, completed: 0 },
    { day: 'Sat', hours: 0, completed: 0 },
    { day: 'Sun', hours: 0, completed: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl sm:text-3xl font-bold">
                Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {session?.user?.fitnessGoal && `Goal: ${session.user.fitnessGoal}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/customer/content">
                <Button>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Completion Rate"
            value={`${stats?.completionPercentage || 0}%`}
            description={`${stats?.completedContent || 0} of ${stats?.totalContent || 0} completed`}
            icon={TrendingUp}
            className="bg-emerald-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="Current Streak"
            value={`${stats?.currentStreak || 0} days`}
            description="Keep it going!"
            icon={Activity}
            className="bg-amber-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="This Week"
            value={`${stats?.weeklyHours || 0}h`}
            description={`${stats?.weeklyGoalsMet || 0} goals completed`}
            icon={Clock}
            className="bg-cyan-600 text-white border-none shadow-md"
          />
          <StatsCard
            title="In Progress"
            value={stats?.inProgressContent || 0}
            description="Content you're working on"
            icon={BookOpen}
            className="bg-rose-600 text-white border-none shadow-md"
          />
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your fitness journey at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completed Content</span>
                  <span className="text-sm text-muted-foreground">
                    {stats?.completedContent || 0}/{stats?.totalContent || 0}
                  </span>
                </div>
                <Progress value={stats?.completionPercentage || 0} />
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Quick Stats</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{stats?.weeklyHours || 0}h</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{stats?.currentStreak || 0}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest content interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.mediaTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activity.status === 'completed'
                            ? 'default'
                            : activity.status === 'in-progress'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {activity.progress}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Start exploring content!
                  </p>
                  <Link href="/customer/content">
                    <Button size="sm" className="mt-4">
                      Browse Content
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Chart */}
        <WeeklyChart data={weeklyData} />
      </div>
    </div>
  );
}
