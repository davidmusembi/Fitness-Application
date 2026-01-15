'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Video,
  FileText,
  Search,
  Filter as FilterIcon,
  Eye,
  Trash2,
  Edit,
  Plus,
  X,
  Play,
} from 'lucide-react';
import { MEDIA_CATEGORIES } from '@/constants';

import { Content } from '@/types/content';

export default function AdminContentPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);

  // Upload form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'pdf',
    category: 'General',
    fileUrl: '',
    thumbnailUrl: '',
    duration: 0,
  });

  useEffect(() => {
    fetchContent();
  }, [filterCategory, filterType]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/content?${params}`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
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

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const uploadFile = async (file: File): Promise<{ url: string; duration: number; thumbnailUrl?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'File upload failed');
    }

    return { url: data.url, duration: data.duration, thumbnailUrl: data.thumbnailUrl };
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = formData.fileUrl;
      let thumbnailUrl = formData.thumbnailUrl;
      let duration = 0;

      // Upload local files if selected
      if (selectedFile) {
        if (!selectedFile) {
          toast.error('Please select a file to upload');
          setUploading(false);
          return;
        }

        setUploadProgress(25);
        const uploadResult = await uploadFile(selectedFile);
        fileUrl = uploadResult.url;
        duration = uploadResult.duration;

        setUploadProgress(50);
        // Use auto-generated thumbnail if available, otherwise use manually uploaded thumbnail
        if (uploadResult.thumbnailUrl) {
          thumbnailUrl = uploadResult.thumbnailUrl;
        } else if (selectedThumbnail) {
          const thumbUploadResult = await uploadFile(selectedThumbnail);
          thumbnailUrl = thumbUploadResult.url;
        }
        setUploadProgress(75);
      }

      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrl,
          thumbnailUrl,
          duration
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Content uploaded successfully!');
        setUploadProgress(100);
        setUploadDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          type: 'video',
          category: 'General',
          fileUrl: '',
          thumbnailUrl: '',
          duration: 0,
        });
        setSelectedFile(null);
        setSelectedThumbnail(null);
        setUploadProgress(0);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to upload content');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (content: Content) => {
    setContentToDelete(content);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contentToDelete) return;

    try {
      const response = await fetch(`/api/content/${contentToDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();

      if (data.success) {
        toast.success('Content deleted successfully');
        setDeleteDialogOpen(false);
        setContentToDelete(null);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to delete content');
      }
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleView = async (item: Content) => {
    // Navigate to dedicated content page
    window.location.href = `/admin/content/${item._id}`;
  };

  const [showFilters, setShowFilters] = useState(true);

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

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Content</DialogTitle>
            <DialogDescription>
              Upload videos or PDF documents for customers to access
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      maxLength={200}
                      placeholder="Enter content title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      maxLength={1000}
                      placeholder="Enter content description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'video' | 'pdf') =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <>
                      <div>
                        <Label htmlFor="file">
                          {formData.type === 'video' ? 'Video File' : 'PDF File'} *
                        </Label>
                        <input
                          id="file"
                          type="file"
                          accept={formData.type === 'video' ? 'video/*' : '.pdf'}
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer"
                        />
                        {selectedFile && (
                          <p className="text-xs text-gray-500 mt-1">
                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
                        <input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedThumbnail(e.target.files?.[0] || null)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer"
                        />
                        {selectedThumbnail && (
                          <p className="text-xs text-gray-500 mt-1">
                            Selected: {selectedThumbnail.name}
                          </p>
                        )}
                      </div>
                    </>)

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Content'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search Header */}
      <div className="sticky top-0 bg-white border-b z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* Search Bar */}
            <form onSubmit={(e) => { e.preventDefault(); fetchContent(); }} className="flex-1 max-w-full sm:max-w-2xl">
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

            {/* Buttons Row */}
            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Upload</span>
              </Button>

              {/* Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          {showFilters && (
            <div className="flex gap-2 mt-3 pb-2">
              {/* Type Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="rounded-full"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'video' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('video')}
                  className="rounded-full flex items-center gap-1"
                >
                  <Video className="h-3 w-3" />
                  Videos
                </Button>
                <Button
                  variant={filterType === 'pdf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('pdf')}
                  className="rounded-full flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Documents
                </Button>
              </div>

              <div className="w-px bg-gray-300 mx-2" />

              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                  className="rounded-full"
                >
                  All Categories
                </Button>
                {MEDIA_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                    className="rounded-full"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {(filterType !== 'all' || filterCategory !== 'all') && (
                <>
                  <div className="w-px bg-gray-300 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterType('all');
                      setFilterCategory('all');
                    }}
                    className="rounded-full text-red-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
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
                : 'Upload your first content to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item) => (
              <div
                key={item._id}
                className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group relative z-0"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-44 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
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
                        <Play className="h-10 w-10 text-blue-600" />
                      ) : (
                        <FileText className="h-10 w-10 text-purple-600" />
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
                    className="font-medium text-sm line-clamp-2 text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handleView(item)}
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span>{item.uploadedBy?.fullName || 'Unknown'}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleView(item)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteClick(item)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Content
            </DialogTitle>
            <DialogDescription className="pt-4">
              Are you sure you want to delete <strong className="text-gray-900">"{contentToDelete?.title}"</strong>?
              <br />
              <br />
              This action cannot be undone. The content will be permanently removed from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setContentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
