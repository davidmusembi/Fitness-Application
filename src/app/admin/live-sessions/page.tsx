'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Users, Clock, Calendar, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateLiveSessionModal from '@/components/admin/CreateLiveSessionModal';

export default function AdminLiveSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'Admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'Admin') {
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
        const error = await response.text();
        throw new Error(error || 'Request failed');
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

  const handleJoinSession = (sessionId: string) => {
    router.push(`/live-session/${sessionId}`);
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

  const canStartSession = (scheduledFor: string | null | undefined): boolean => {
    if (!scheduledFor) return true;
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    return now >= scheduledTime;
  };

  const getTimeUntilStart = (scheduledFor: string): string => {
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    const diffMs = scheduledTime.getTime() - now.getTime();

    if (diffMs <= 0) return '';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) {
      return `Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Starts in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      return `Starts in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else {
      return 'Starting soon';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Live Sessions
              </h1>
              <p className="text-gray-600">Manage and host live video sessions with your customers</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Live Session
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6">
            {(['all', 'live', 'scheduled', 'ended'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          </div>
        ) : liveSessions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No live sessions yet</h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Create your first live session to start connecting with your customers in real-time
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Live Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveSessions.map((session: any) => (
              <Card
                key={session._id}
                className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200"
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
                        LIVE
                      </span>
                    )}
                    {session.status === 'scheduled' && 'Scheduled'}
                    {session.status === 'ended' && 'Ended'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {session.invitedCustomers?.length || 0} invited
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
                  <div className="flex gap-2 pt-2">
                    {session.status === 'live' && (
                      <Button
                        onClick={() => handleJoinSession(session.sessionId)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Join Session
                      </Button>
                    )}
                    {session.status === 'scheduled' && (
                      <>
                        {canStartSession(session.scheduledFor) ? (
                          <Button
                            onClick={() => handleJoinSession(session.sessionId)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Start Session
                          </Button>
                        ) : (
                          <div className="flex-1">
                            <Button
                              disabled
                              className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              {getTimeUntilStart(session.scheduledFor)}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    {session.status === 'ended' && (
                      <Button
                        onClick={() => handleJoinSession(session.sessionId)}
                        variant="outline"
                        className="flex-1"
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

      {/* Create Session Modal */}
      <CreateLiveSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchLiveSessions();
        }}
      />
    </div>
  );
}
