'use client';

import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { toast } from 'sonner';

interface VideoData {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  views: number;
}

interface VideoPlayerWrapperProps {
  contentId: string;
  onViewComplete?: () => void;
}

export default function VideoPlayerWrapper({
  contentId,
  onViewComplete
}: VideoPlayerWrapperProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoData();
  }, [contentId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${contentId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load video');
      }

      const data = await response.json();

      if (data.success) {
        setVideoData(data.data);
        // Increment view count
        await incrementViewCount(contentId);
      } else {
        throw new Error(data.error || 'Failed to load video');
      }
    } catch (err: any) {
      console.error('Error fetching video:', err);
      setError(err.message || 'Failed to load video');
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      await fetch(`/api/content/${id}/view`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const handleVideoEnded = () => {
    if (onViewComplete) {
      onViewComplete();
    }
    toast.success('Video completed!');
  };

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    toast.error('Video playback error. Please try again.');
  };

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl font-semibold mb-4">{error || 'Video not found'}</p>
          <button
            onClick={fetchVideoData}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <VideoPlayer
        url={videoData.fileUrl}
        title={videoData.title}
        thumbnail={videoData.thumbnailUrl}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
      />
      {videoData.description && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">About this video</h3>
          <p className="text-gray-700">{videoData.description}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span>{videoData.views} views</span>
            {videoData.duration && (
              <span>{Math.floor(videoData.duration / 60)} minutes</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
