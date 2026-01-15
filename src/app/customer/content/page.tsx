'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video,
  FileText,
  Search,
  Play,
  Eye,
  Filter as FilterIcon,
  X,
} from 'lucide-react';
import { MEDIA_CATEGORIES } from '@/constants';

import { Content } from '@/types/content';

interface ProgressData {
  [contentId: string]: {
    progress: number;
    lastWatchedPosition: number;
  };
}

export default function CustomerContentLibrary() {
  const { data: session } = useSession();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData>({});

  useEffect(() => {
    fetchContent();
    if (session?.user) {
      fetchProgress();
    }
  }, [filterCategory, filterType, session]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/content?${params}`);
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

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/progress');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.data) {
        const progressMap: ProgressData = {};
        data.data.forEach((item: any) => {
          progressMap[item.contentId] = {
            progress: item.progress,
            lastWatchedPosition: item.lastWatchedPosition || 0,
          };
        });
        setProgressData(progressMap);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContent();
  };

  const filteredContent = content.filter((item) => {
    if (searchTerm) {
      return (
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
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

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleView = async (item: Content) => {
    // Navigate to dedicated content page
    window.location.href = `/customer/content/${item._id}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="sticky top-0 bg-white border-b z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-full sm:max-w-2xl">
              <div className="relative">
                <Input
                  placeholder="Search videos and documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-12 h-11 rounded-full border-gray-300 focus:border-blue-500"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-11 w-11 rounded-full"
                >
                  <Search className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </form>

            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <FilterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filters Row */}
          {showFilters && (
            <div className="mt-3 pb-2 space-y-2">
              {/* Type Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="rounded-full whitespace-nowrap flex-shrink-0"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('video')}
                  className="rounded-full flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                >
                  <Video className="h-3 w-3" />
                  <span className="hidden xs:inline">Videos</span>
                  <span className="xs:hidden">Video</span>
                </Button>
                <Button
                  variant={filterType === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('pdf')}
                  className="rounded-full flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                >
                  <FileText className="h-3 w-3" />
                  <span className="hidden xs:inline">Documents</span>
                  <span className="xs:hidden">Docs</span>
                </Button>
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                  className="rounded-full whitespace-nowrap flex-shrink-0"
                >
                  All Categories
                </Button>
                {MEDIA_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                    className="rounded-full whitespace-nowrap flex-shrink-0"
                  >
                    {cat}
                  </Button>
                ))}
                {(filterType !== 'all' || filterCategory !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterType('all');
                      setFilterCategory('all');
                    }}
                    className="rounded-full text-red-600 whitespace-nowrap flex-shrink-0"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              {searchTerm || filterCategory !== 'all' || filterType !== 'all' ? (
                <FilterIcon className="h-16 w-16 mx-auto" />
              ) : (
                <Video className="h-16 w-16 mx-auto" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No content found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterCategory !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Content will appear here once uploaded'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item) => (
              <div
                key={item._id}
                className="flex gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors group relative z-0"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-32 xs:w-36 sm:w-44 h-20 xs:h-22 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => handleView(item)}
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      {item.type === 'video' ? (
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                      ) : (
                        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                      )}
                    </div>
                  )}

                  {/* Duration Badge */}
                  {item.type === 'video' && item.duration && item.duration > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium text-xs sm:text-sm line-clamp-2 text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handleView(item)}
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span className="truncate">{item.uploadedBy?.fullName || 'Unknown'}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 sm:line-clamp-2 mt-1 hidden xs:block">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-1 sm:mt-2">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
