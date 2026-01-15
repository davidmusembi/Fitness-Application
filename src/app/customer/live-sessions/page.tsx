'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Clock, Calendar, Play, User } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerLiveSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'Customer') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'Customer') {
      fetchLiveSessions();
    }
  }, [session, filterStatus]);

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all'
        ? '/api/live-sessions'
        : `/api/live-sessions?status=${filterStatus}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setLiveSessions(data.data);
      } else {
        toast.error(data.error || 'Failed to load live sessions');
      }
    } catch (error) {
      toast.error('Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId: string, session: any) => {
    // Check if session has ended
    if (session.status === 'ended') {
      toast.error('This session has ended and cannot be rejoined');
      return;
    }

    // Check if session is scheduled and not yet live
    if (session.status === 'scheduled') {
      if (session.scheduledFor) {
        const scheduledTime = new Date(session.scheduledFor);
        const now = new Date();
        if (now < scheduledTime) {
          toast.error(`This session is scheduled for ${formatDate(session.scheduledFor)}`);
          return;
        }
      } else {
        toast.error('This session has not started yet');
        return;
      }
    }

    // Only allow joining live sessions
    if (session.status !== 'live') {
      toast.error('This session is not currently live');
      return;
    }

    try {
      // Navigate to the live session
      router.push(`/live-session/${sessionId}`);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Live Sessions
              </h1>
              <p className="text-gray-600">Join live video sessions with your fitness coach</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'live', 'scheduled', 'ended'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          </div>
        ) : liveSessions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No live sessions</h3>
              <p className="text-gray-600 text-center max-w-md">
                You don't have any {filterStatus !== 'all' ? filterStatus : ''} sessions at the moment.
                Your coach will invite you when a new session is scheduled.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveSessions.map((session: any) => (
              <Card
                key={session._id}
                className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                        {session.title}
                      </CardTitle>
                      {session.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(session.status)} border w-fit`}>
                    {session.status === 'live' && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                        LIVE NOW
                      </span>
                    )}
                    {session.status === 'scheduled' && 'Scheduled'}
                    {session.status === 'ended' && 'Ended'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Info */}
                  <div className="space-y-2">
                    {session.adminId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Host: {session.adminId.fullName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {session.invitedCustomers?.length || 0} participants
                        {session.joinedCustomers?.length > 0 && (
                          <span className="text-green-600 font-medium ml-1">
                            ({session.joinedCustomers.length} joined)
                          </span>
                        )}
                      </span>
                    </div>

                    {session.scheduledFor && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.scheduledFor)}</span>
                      </div>
                    )}

                    {session.startedAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {session.status === 'ended'
                            ? `Duration: ${formatDuration(session.duration || 0)}`
                            : `Started: ${formatDate(session.startedAt)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {session.status === 'live' && (
                      <Button
                        onClick={() => handleJoinSession(session.sessionId, session)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Join Live Session
                      </Button>
                    )}
                    {session.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Waiting to Start
                      </Button>
                    )}
                    {session.status === 'ended' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Session Ended
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
