'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, Eye, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

interface Order {
  _id: string;
  userId?: { fullName: string; email: string };
  guestCustomer?: {
    fullName: string;
    email: string;
    phone: string;
  };
  products: Array<{
    productId: {
      _id: string;
      name: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?all=true');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerInfo = (order: Order) => {
    if (order.guestCustomer) {
      return {
        name: order.guestCustomer.fullName,
        email: order.guestCustomer.email,
        type: 'Guest',
      };
    } else if (order.userId) {
      return {
        name: order.userId.fullName || 'N/A',
        email: order.userId.email || 'N/A',
        type: 'Registered',
      };
    }
    return { name: 'N/A', email: 'N/A', type: 'Unknown' };
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
        <div className="mt-4 flex gap-4">
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'pending').length}
            </p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'processing').length}
            </p>
          </Card>
          <Card className="px-4 py-2">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">
              ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
            </p>
          </Card>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const customerInfo = getCustomerInfo(order);
              return (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">#{order._id.slice(-8)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customerInfo.name}</p>
                      <p className="text-sm text-gray-600">{customerInfo.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customerInfo.type === 'Guest' ? 'secondary' : 'default'}>
                      {customerInfo.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.products.length} items</TableCell>
                  <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {orders.length === 0 && (
        <div className="mt-8 text-center text-gray-600">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p>No orders found</p>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?._id.slice(-8)} -{' '}
              {selectedOrder && new Date(selectedOrder.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{getCustomerInfo(selectedOrder).name}</p>
                      <Badge className="mt-1" variant="secondary">
                        {getCustomerInfo(selectedOrder).type} Customer
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{getCustomerInfo(selectedOrder).email}</p>
                    </div>
                  </div>
                  {selectedOrder.guestCustomer?.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedOrder.guestCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder.shippingAddress ? (
                    <address className="not-italic">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>
                        {selectedOrder.shippingAddress.city},{' '}
                        {selectedOrder.shippingAddress.state}{' '}
                        {selectedOrder.shippingAddress.zipCode}
                      </p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </address>
                  ) : (
                    <p className="text-muted-foreground">No address provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOrder.products.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                          {item.productId?.imageUrl && (
                            <Image
                              src={item.productId.imageUrl}
                              alt={item.productId.name || 'Product'}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.productId?.name || 'Unknown Product'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm">
                            Price: ${item.price.toFixed(2)} each
                          </p>
                          <p className="font-bold mt-1">
                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {idx < selectedOrder.products.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Status</span>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking Number</span>
                      <span className="font-medium">{selectedOrder.trackingNumber}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-blue-600">
                      ${selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
