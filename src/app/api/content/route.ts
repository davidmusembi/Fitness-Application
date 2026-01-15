import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Content from '@/models/Content';
import { z } from 'zod';

// GET - List all content with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const uploadedBy = searchParams.get('uploadedBy'); // Filter by uploader

    // Build query
    const query: any = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // If uploadedBy is provided, filter by that user (for admin/staff viewing their own)
    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'fullName username email');

    const total = await Content.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST - Create new content (Admin/Staff only)
const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['video', 'pdf'], { message: 'Content type is required' }),
  category: z.enum(['Workouts', 'Nutrition', 'Mindset', 'Recovery', 'Supplements', 'General']),
  fileUrl: z.string().min(1, 'File URL is required').refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
    { message: 'Invalid file URL. Must be a full URL or relative path starting with /' }
  ),
  thumbnailUrl: z.string().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
    { message: 'Invalid thumbnail URL. Must be a full URL or relative path starting with /' }
  ).optional().or(z.literal('')),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
  pages: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Staff')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only Admin and Staff can upload content.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createContentSchema.parse(body);

    await connectDB();

    const content = await Content.create({
      ...validatedData,
      uploadedBy: session.user.id,
      views: 0,
    });

    await content.populate('uploadedBy', 'fullName username email');

    return NextResponse.json(
      { success: true, data: content, message: 'Content uploaded successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Content creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all content (Admin only, for cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only Admin can delete all content.' },
        { status: 403 }
      );
    }

    await connectDB();

    const result = await Content.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} content items`,
    });
  } catch (error: any) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
