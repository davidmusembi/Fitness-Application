import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import Transaction from '@/models/Transaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate total
    const total = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Create order in database
    const order = await Order.create({
      userId: session.user.id,
      products: items.map((item: any) => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      status: 'pending',
    });

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description,
            images: [item.imageUrl],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/orders?success=true&orderId=${order._id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/cart?cancelled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        orderId: order._id.toString(),
        userId: session.user.id,
      },
    });

    // Create transaction record
    await Transaction.create({
      userId: session.user.id,
      productIds: items.map((item: any) => item._id),
      amount: total,
      status: 'pending',
      paymentMethod: 'card',
      stripePaymentIntentId: stripeSession.id,
    });

    return NextResponse.json({
      success: true,
      url: stripeSession.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
