export interface Content {
  _id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf';
  category: string;
  fileUrl: string;
  thumbnailUrl?: string;
  views: number;
  uploadedBy: {
    _id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
  duration?: number;
}
