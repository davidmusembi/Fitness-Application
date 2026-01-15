'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Smartphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface CartItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

type PaymentMethod = 'card' | 'mpesa' | 'paypal';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Checkout and payment states
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Maldives',
  });

  // Card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('customerCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Update customer info when session changes
  useEffect(() => {
    if (session?.user) {
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('customerCart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart.map((item) =>
      item._id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    updateCart(newCart);
  };

  const removeItem = (productId: string) => {
    const newCart = cart.filter((item) => item._id !== productId);
    updateCart(newCart);
    toast.success('Item removed from cart');
  };

  const proceedToPayment = () => {
    // Validate customer info
    const { fullName, email, phone, street, city, state, zipCode } = customerInfo;
    if (!fullName || !email || !phone || !street || !city || !state || !zipCode) {
      toast.error('Please fill in all shipping information');
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate card details if card payment
    if (selectedPayment === 'card') {
      const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = cardDetails;
      if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          customerInfo,
          paymentMethod: selectedPayment,
          cardDetails: selectedPayment === 'card' ? cardDetails : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();

      if (data.success) {
        toast.success('Order placed successfully!');
        // Clear cart
        localStorage.removeItem('customerCart');
        setCart([]);
        setShowPaymentDialog(false);
        setShowCheckout(false);
        router.push('/customer/orders');
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Removed shipping fee
  const total = subtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {showCheckout ? 'Checkout' : 'Shopping Cart'}
            </h1>
            {showCheckout && (
              <Button variant="ghost" onClick={() => setShowCheckout(false)}>
                Back to Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to your cart to get started
              </p>
              <Link href="/customer/shop">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !showCheckout ? (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item._id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-lg font-bold mt-2">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item._id, -1)}
                            disabled={item.quantity === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item._id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold">${total.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </Button>
                  <Link href="/customer/shop">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={customerInfo.fullName}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, fullName: e.target.value })
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, email: e.target.value })
                        }
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        placeholder="+960 123 4567"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        value={customerInfo.street}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, street: e.target.value })
                        }
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, city: e.target.value })
                        }
                        placeholder="Male"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Island *</Label>
                      <Input
                        id="state"
                        value={customerInfo.state}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, state: e.target.value })
                        }
                        placeholder="Kaafu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        value={customerInfo.zipCode}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, zipCode: e.target.value })
                        }
                        placeholder="20000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={customerInfo.country}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, country: e.target.value })
                        }
                        placeholder="Maldives"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold">${total.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={proceedToPayment}>
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method to complete your order
            </DialogDescription>
          </DialogHeader>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => setSelectedPayment('card')}
              className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all hover:border-blue-500 ${
                selectedPayment === 'card'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium">Card</span>
            </button>
            <button
              onClick={() => setSelectedPayment('paypal')}
              className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all hover:border-blue-500 ${
                selectedPayment === 'paypal'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="#00457C">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.16a.804.804 0 01-.794.68H7.72a.483.483 0 01-.477-.558L9.22 7.87a.805.805 0 01.794-.679h4.778c.99 0 1.81.084 2.446.27.18.053.348.114.507.183.16.07.312.148.455.235.143.087.276.182.398.287.121.105.232.219.332.341.1.122.188.253.264.392z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium">PayPal</span>
            </button>
            <button
              onClick={() => setSelectedPayment('mpesa')}
              className={`p-3 sm:p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all hover:border-green-500 ${
                selectedPayment === 'mpesa'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-xs sm:text-sm font-medium">M-Pesa</span>
            </button>
          </div>

          {/* Card Payment Form */}
          {selectedPayment === 'card' && (
            <Card className="mt-4 border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Card Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                    }
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="cardHolder">Card Holder Name *</Label>
                  <Input
                    id="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cardHolder: e.target.value })
                    }
                    placeholder="JOHN DOE"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="expiryMonth">Month *</Label>
                    <Select
                      value={cardDetails.expiryMonth}
                      onValueChange={(value) =>
                        setCardDetails({ ...cardDetails, expiryMonth: value })
                      }
                    >
                      <SelectTrigger id="expiryMonth">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          return (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expiryYear">Year *</Label>
                    <Select
                      value={cardDetails.expiryYear}
                      onValueChange={(value) =>
                        setCardDetails({ ...cardDetails, expiryYear: value })
                      }
                    >
                      <SelectTrigger id="expiryYear">
                        <SelectValue placeholder="YY" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = (new Date().getFullYear() + i).toString().slice(-2);
                          return (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value })
                      }
                      placeholder="123"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* M-Pesa Instructions */}
          {selectedPayment === 'mpesa' && (
            <Card className="mt-4 border-2 border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-green-900">M-Pesa Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-green-800">
                    <li>You will receive an M-Pesa prompt on your phone</li>
                    <li>Enter your M-Pesa PIN to confirm payment</li>
                    <li>You will receive a confirmation SMS</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PayPal Instructions */}
          {selectedPayment === 'paypal' && (
            <Card className="mt-4 border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900">PayPal Payment Instructions:</p>
                  <p className="text-blue-800">
                    You will be redirected to PayPal to complete your payment securely.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Place Order Button */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedPayment}
              className="flex-1"
            >
              {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
