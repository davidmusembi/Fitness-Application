'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Eye,
  Video,
  FileText,
  Play,
} from 'lucide-react';

// Helper function to process video URLs
const processVideoUrl = (url: string) => {
  if (!url) return '';
  
  // If the URL starts with /uploads/, convert it to use the API endpoint
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '/api/uploads/');
  }
  
  // If it's already a full URL or API endpoint, return as is
  return url;
};

// Dynamically import VideoPlayer
const VideoPlayer = dynamic(() => import('@/components/media/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-white">Loading video player...</p>
      </div>
    </div>
  )
});

// Dynamically import PDFViewer
const PDFViewer = dynamic(() => import('@/components/media/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[600px] bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

import { Content } from '@/types/content';

export default function ContentViewPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchContent();
      fetchRecommendations();
    }
  }, [params?.id]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${params?.id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setContent(data.data);
      } else {
        toast.error(data.error || 'Failed to load content');
      }
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/content?limit=10`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        // Filter out current content
        const filtered = data.data.filter((item: Content) => item._id !== params?.id);
        setRecommendations(filtered.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const link = document.createElement('a');
    link.href = content.fileUrl;
    // Extract the file extension from the URL
    const fileExtension = content.fileUrl.split('.').pop()?.split('?')[0] || 'pdf';
    const fileName = content.title;
    // Add extension if not already present
    link.download = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4">The content you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/staff/content')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/staff/content')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Video/PDF Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              {content.type === 'video' ? (
                <VideoPlayer
                  url={processVideoUrl(content.fileUrl)}
                  title={content.title}
                  thumbnail={content.thumbnailUrl}
                  autoPlay={false}
                  onEnded={() => {
                    toast.success('Video completed!');
                  }}
                  onError={(error) => {
                    console.error('Video playback error:', error);
                    console.error('Failed URL:', processVideoUrl(content.fileUrl));
                    toast.error('Failed to play video. Please try again.');
                  }}
                />
              ) : (
                <PDFViewer
                  url={processVideoUrl(content.fileUrl)}
                  title={content.title}
                  allowDownload={false}
                  className="min-h-[600px]"
                />
              )}
            </div>

            {/* Video Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {content.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {content.category}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {content.views} views
                      </Badge>
                    </div>
                  </div>
                  {content.type === 'pdf' && (
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-4 py-4 border-t border-b">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {content.uploadedBy.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {content.uploadedBy.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Deeqdarajjo Trainer
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {content.description && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {content.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                More Content
              </h2>
              <div className="space-y-3">
                {recommendations.map((item) => (
                  <Card
                    key={item._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/staff/content/${item._id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="relative w-40 h-24 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-l-lg overflow-hidden">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.type === 'video' ? (
                                <Video className="h-8 w-8 text-gray-400" />
                              ) : (
                                <FileText className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                          )}
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-8 w-8 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                                <Play className="h-4 w-4 text-white ml-0.5" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1">
                            <Badge className="text-xs px-1.5 py-0.5">
                              {item.type === 'video' ? formatDuration(item.duration || 0) : 'PDF'}
                            </Badge>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-3 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">
                            {item.uploadedBy.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{item.category}</span>
                            {item.type === 'video' && item.duration && (
                              <>
                                <span>•</span>
                                <span>{formatDuration(item.duration || 0)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {recommendations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No more content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
