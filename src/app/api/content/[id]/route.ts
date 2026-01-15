import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db/mongodb';
import Content from '@/models/Content';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single content by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const content = await Content.findById(id).populate(
      'uploadedBy',
      'fullName username email'
    );

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    // Increment view count
    content.views += 1;
    await content.save();

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// PUT - Update content (Admin/Staff only, must be owner or admin)
const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['Workouts', 'Nutrition', 'Mindset', 'Recovery', 'Supplements', 'General']).optional(),
  thumbnailUrl: z.string().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
    { message: 'Invalid thumbnail URL. Must be a full URL or relative path starting with /' }
  ).optional().or(z.literal('')),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Staff')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const content = await Content.findById(id);

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    if (
      content.uploadedBy.toString() !== session.user.id &&
      session.user.role !== 'Admin'
    ) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own content' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateContentSchema.parse(body);

    // Update content
    Object.assign(content, validatedData);
    await content.save();

    await content.populate('uploadedBy', 'fullName username email');

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content updated successfully',
    });
  } catch (error: any) {
    console.error('Content update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content (Admin/Staff only, must be owner or admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Staff')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    const content = await Content.findById(id);

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    if (
      content.uploadedBy.toString() !== session.user.id &&
      session.user.role !== 'Admin'
    ) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own content' },
        { status: 403 }
      );
    }

    await Content.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
