'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FITNESS_GOALS } from '@/constants';
import {
  Check,
  CreditCard,
  Smartphone,
  Shield,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Dumbbell
} from 'lucide-react';

type PaymentMethod = 'card' | 'mpesa' | 'paypal';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    deeqdarajjoGoal: '',
    termsAccepted: false,
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    mpesaPhone: '',
    paypalEmail: '',
  });

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          deeqdarajjoGoal: formData.deeqdarajjoGoal || undefined,
          membershipPaid: true,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setStep(4);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    if (step === 2 && !formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (step === 3) {
      if (paymentMethod === 'card') {
        if (!formData.cardNumber || !formData.cardHolder || !formData.expiryMonth || !formData.expiryYear || !formData.cvv) {
          toast.error('Please fill in all card details');
          return;
        }
        if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
          toast.error('Please enter a valid 16-digit card number');
          return;
        }
        if (formData.cvv.length !== 3) {
          toast.error('Please enter a valid 3-digit CVV');
          return;
        }
      } else if (paymentMethod === 'mpesa') {
        if (!formData.mpesaPhone) {
          toast.error('Please enter your M-Pesa phone number');
          return;
        }
        if (formData.mpesaPhone.length < 10) {
          toast.error('Please enter a valid phone number');
          return;
        }
      } else if (paymentMethod === 'paypal') {
        if (!formData.paypalEmail) {
          toast.error('Please enter your PayPal email');
          return;
        }
      }
      handleSubmit();
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const steps = [
    { number: 1, label: 'Account' },
    { number: 2, label: 'Terms' },
    { number: 3, label: 'Payment' },
    { number: 4, label: 'Complete' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl border border-gray-200 shadow-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.number
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <Separator
                    className={`w-12 mx-2 ${step > s.number ? 'bg-primary' : ''}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription className="mt-1">
                  Enter your details to get started
                </CardDescription>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deeqdarajjoGoal">Deeqdarajjo Goal (Optional)</Label>
                  <Select
                    value={formData.deeqdarajjoGoal}
                    onValueChange={(value) => setFormData({ ...formData, deeqdarajjoGoal: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {FITNESS_GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={nextStep} className="w-full h-10">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Terms */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Terms & Conditions</CardTitle>
                <CardDescription className="mt-1">
                  Please review and accept our terms
                </CardDescription>
              </div>

              <Card className="border border-gray-200">
                <CardContent className="p-4 max-h-60 overflow-y-auto text-sm space-y-3">
                  <div>
                    <h4 className="font-semibold">1. Membership</h4>
                    <p className="text-muted-foreground">
                      Your membership grants you access to all video content, live sessions, and platform features.
                      The one-time payment of $5 provides lifetime access.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">2. User Responsibilities</h4>
                    <p className="text-muted-foreground">
                      You are responsible for maintaining the confidentiality of your account credentials.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">3. Content Usage</h4>
                    <p className="text-muted-foreground">
                      All video content and materials are for personal use only.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">4. Refund Policy</h4>
                    <p className="text-muted-foreground">
                      We offer a 30-day money-back guarantee.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, termsAccepted: checked === true })
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-medium cursor-pointer leading-relaxed">
                  I agree to the Terms and Conditions and Privacy Policy
                </Label>
              </div>

              <div className="flex gap-3">
                <Button onClick={prevStep} variant="outline" className="flex-1 h-10">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!formData.termsAccepted}
                  className="flex-1 h-10"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Payment Details</CardTitle>
                <CardDescription className="mt-1">
                  Complete your $5 membership payment
                </CardDescription>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-5 w-5 mx-auto mb-2 ${
                    paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm font-medium">Card</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'paypal'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`h-5 w-5 mx-auto mb-2 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold`}>
                    P
                  </div>
                  <p className="text-sm font-medium">PayPal</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'mpesa'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Smartphone className={`h-5 w-5 mx-auto mb-2 ${
                    paymentMethod === 'mpesa' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="text-sm font-medium">M-Pesa</p>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })
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
                      value={formData.cardHolder}
                      onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                      placeholder="JOHN DOE"
                      className="h-10 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryMonth">Month</Label>
                      <Select
                        value={formData.expiryMonth}
                        onValueChange={(value) => setFormData({ ...formData, expiryMonth: value })}
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
                        value={formData.expiryYear}
                        onValueChange={(value) => setFormData({ ...formData, expiryYear: value })}
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
                        value={formData.cvv}
                        onChange={(e) =>
                          setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
                        }
                        placeholder="123"
                        maxLength={3}
                        className="h-10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Form */}
              {paymentMethod === 'paypal' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input
                      id="paypalEmail"
                      type="email"
                      value={formData.paypalEmail}
                      onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
                      placeholder="your-email@example.com"
                      className="h-10"
                    />
                  </div>
                </div>
              )}

              {/* M-Pesa Form */}
              {paymentMethod === 'mpesa' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesaPhone"
                      value={formData.mpesaPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, mpesaPhone: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="+254 712 345 678"
                      className="h-10 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                <Shield className="h-4 w-4" />
                <span>Your payment is secure and encrypted</span>
              </div>

              <div className="flex gap-3">
                <Button onClick={prevStep} variant="outline" className="flex-1 h-10" disabled={isLoading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1 h-10" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Complete Payment'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div>
                <CardTitle className="text-2xl">Welcome aboard!</CardTitle>
                <CardDescription className="mt-2">
                  Your account has been created successfully
                </CardDescription>
              </div>

              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{formData.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => router.push('/auth/login')} className="w-full h-10">
                Go to Login
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
