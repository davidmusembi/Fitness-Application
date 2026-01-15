import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { items, customerInfo } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!customerInfo || !customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer information is required' },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (
      !customerInfo.street ||
      !customerInfo.city ||
      !customerInfo.state ||
      !customerInfo.zipCode ||
      !customerInfo.country
    ) {
      return NextResponse.json(
        { success: false, error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // Verify products and calculate total
    let calculatedTotal = 0;
    const orderProducts = [];

    for (const item of items) {
      const product = await Product.findById(item._id);

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.name} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      calculatedTotal += product.price * item.quantity;

      orderProducts.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Add tax and shipping
    const tax = calculatedTotal * 0.1;
    const shipping = calculatedTotal > 50 ? 0 : 5.99;
    const total = calculatedTotal + tax + shipping;

    // Create order
    const order = await Order.create({
      guestCustomer: {
        fullName: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      },
      products: orderProducts,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: {
        street: customerInfo.street,
        city: customerInfo.city,
        state: customerInfo.state,
        zipCode: customerInfo.zipCode,
        country: customerInfo.country,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        total,
      },
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
