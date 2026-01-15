'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, CheckCircle2, Video } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  _id: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  progress: number;
  lastPosition: number;
  status: 'not-started' | 'in-progress' | 'completed';
  updatedAt: string;
}

export default function WatchHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/customer/history');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setHistory(data.data);
      } else {
        toast.error('Failed to load watch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load watch history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your watch history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Watch History</h1>
          <p className="text-muted-foreground mt-1">Track your learning progress</p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Video className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No watch history yet</h3>
              <p className="text-muted-foreground mb-6 text-center">
                Start watching videos to track your progress
              </p>
              <Button onClick={() => router.push('/customer/content')}>
                Browse Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Card key={item._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{item.mediaTitle}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(item.updatedAt)}
                            </span>
                            <Badge variant={
                              item.status === 'completed' ? 'default' :
                              item.status === 'in-progress' ? 'secondary' :
                              'outline'
                            }>
                              {item.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </>
                              ) : item.status === 'in-progress' ? (
                                `${Math.round(item.progress)}% watched`
                              ) : (
                                'Not started'
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {item.status !== 'not-started' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round(item.progress)}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/customer/content/${item.mediaId}`)}
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {item.status === 'completed' ? 'Watch Again' : 
                           item.status === 'in-progress' ? 'Continue Watching' : 
                           'Start Watching'}
                        </Button>
                      </div>
                    </div>
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
