'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle } from 'lucide-react';

interface ProgressItem {
  _id: string;
  mediaId: {
    _id: string;
    title: string;
    type: string;
    category: string;
  };
  progress: number;
  status: string;
  lastWatchedPosition: number;
  updatedAt: string;
}

export default function CustomerProgressPage() {
  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setProgressData(data.data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>
      </div>

      <div className="space-y-4">
        {progressData.map((item) => (
          <Card key={item._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.mediaId?.title || 'Unknown'}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{item.mediaId?.category}</Badge>
                  {item.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{item.status.replace('-', ' ')}</span>
                  <span>Last updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {progressData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No progress tracked yet. Start watching content to track your progress!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
