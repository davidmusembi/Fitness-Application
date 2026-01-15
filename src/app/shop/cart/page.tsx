'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Smartphone, Shield, Dumbbell, Loader2 } from 'lucide-react';
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

export default function PublicCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  // Format card number helper
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  };

  useEffect(() => {
    const savedCart = localStorage.getItem('publicCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('publicCart', JSON.stringify(newCart));
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
    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!customerInfo.street || !customerInfo.city || !customerInfo.state || !customerInfo.zipCode || !customerInfo.country) {
      toast.error('Please fill in complete shipping address');
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
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
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order placed successfully!');
        localStorage.removeItem('publicCart');
        setCart([]);
        setShowCheckout(false);
        setShowPaymentDialog(false);

        setTimeout(() => {
          router.push('/shop');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/shop">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold">Shopping Cart</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {cart.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to get started
              </p>
              <Link href="/shop">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cart Items</span>
                    <Badge variant="secondary">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item._id}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium mb-1 truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                          <p className="text-lg font-semibold mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(item._id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item._id, -1)}
                              disabled={item.quantity === 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item._id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Checkout Form */}
              {showCheckout && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={customerInfo.fullName}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, fullName: e.target.value })
                          }
                          placeholder="John Doe"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, email: e.target.value })
                          }
                          placeholder="john@example.com"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                        className="h-10"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        value={customerInfo.street}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, street: e.target.value })
                        }
                        placeholder="123 Main St"
                        className="h-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={customerInfo.city}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, city: e.target.value })
                          }
                          placeholder="New York"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={customerInfo.state}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, state: e.target.value })
                          }
                          placeholder="NY"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={customerInfo.zipCode}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, zipCode: e.target.value })
                          }
                          placeholder="10001"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={customerInfo.country}
                          onChange={(e) =>
                            setCustomerInfo({ ...customerInfo, country: e.target.value })
                          }
                          placeholder="USA"
                          className="h-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-green-600 font-semibold">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {subtotal < 50 && subtotal > 0 && (
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <p className="text-xs">
                          Add <span className="font-bold">${(50 - subtotal).toFixed(2)}</span> more for free shipping!
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  {!showCheckout ? (
                    <Button
                      className="w-full h-10"
                      onClick={() => setShowCheckout(true)}
                    >
                      Proceed to Checkout
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className="w-full h-10"
                        onClick={proceedToPayment}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-10"
                        onClick={() => setShowCheckout(false)}
                      >
                        Back to Cart
                      </Button>
                    </div>
                  )}

                  <Link href="/shop">
                    <Button variant="ghost" className="w-full h-10">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Dialog - Matching Signup Design */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay for your order
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => setSelectedPayment('card')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedPayment === 'card'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className={`h-5 w-5 mx-auto mb-2 ${
                selectedPayment === 'card' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground mt-1">Credit/Debit</p>
            </button>

            <button
              onClick={() => setSelectedPayment('paypal')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedPayment === 'paypal'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="h-5 w-5 mx-auto mb-2 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <p className="text-sm font-medium">PayPal</p>
              <p className="text-xs text-muted-foreground mt-1">Fast & Secure</p>
            </button>

            <button
              onClick={() => setSelectedPayment('mpesa')}
              className={`p-5 rounded-xl border-2 transition-all ${
                selectedPayment === 'mpesa'
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Smartphone className={`h-5 w-5 mx-auto mb-2 ${
                selectedPayment === 'mpesa' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <p className="text-sm font-medium">M-Pesa</p>
              <p className="text-xs text-muted-foreground mt-1">Mobile Money</p>
            </button>
          </div>

          {/* Card Form - Shown when Card is selected */}
          {selectedPayment === 'card' && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="h-10 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolder">Cardholder Name</Label>
                <Input
                  id="cardHolder"
                  value={cardDetails.cardHolder}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value.toUpperCase() })}
                  placeholder="JOHN DOE"
                  className="h-10 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Select
                    value={cardDetails.expiryMonth}
                    onValueChange={(value) => setCardDetails({ ...cardDetails, expiryMonth: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Select
                    value={cardDetails.expiryYear}
                    onValueChange={(value) => setCardDetails({ ...cardDetails, expiryYear: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="YY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                        <SelectItem key={year} value={year.toString().slice(-2)}>
                          {year.toString().slice(-2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
                    }
                    placeholder="123"
                    maxLength={3}
                    className="h-10 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PayPal Form - Shown when PayPal is selected */}
          {selectedPayment === 'paypal' && (
            <div className="space-y-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-900">
                  You will be redirected to PayPal to complete your payment
                </p>
              </div>
            </div>
          )}

          {/* M-Pesa Form - Shown when M-Pesa is selected */}
          {selectedPayment === 'mpesa' && (
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                <Input
                  id="mpesaPhone"
                  placeholder="+254 712 345 678"
                  className="h-10"
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-900">
                  You will receive an STK push to your phone to complete payment
                </p>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Order Summary */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `$${shipping.toFixed(2)}`
                )}
              </span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Your payment is secure and encrypted</span>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10"
              onClick={handlePlaceOrder}
              disabled={
                !selectedPayment ||
                loading ||
                (selectedPayment === 'card' && (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryMonth || !cardDetails.expiryYear || !cardDetails.cvv))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${total.toFixed(2)}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
