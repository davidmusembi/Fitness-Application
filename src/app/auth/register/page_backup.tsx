'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FITNESS_GOALS } from '@/constants';
import {
  Check,
  CreditCard,
  CheckCircle2,
  Smartphone,
  Shield,
  Dumbbell,
  Video,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

type PaymentMethod = 'card' | 'mpesa';

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
    fitnessGoal: '',
    termsAccepted: false,
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    mpesaPhone: '',
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
          fitnessGoal: formData.fitnessGoal || undefined,
          membershipPaid: true,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setStep(5);
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

    if (step === 3 && !formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (step === 4) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-3 sm:px-4 py-6 sm:py-12">
      <Card className="w-full max-w-3xl shadow-2xl border-0">
        <CardContent className="p-4 sm:p-6 md:p-12">
          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Account' },
                { num: 2, label: 'Membership' },
                { num: 3, label: 'Terms' },
                { num: 4, label: 'Payment' },
                { num: 5, label: 'Done' }
              ].map((item, index) => (
                <div key={item.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-lg ${
                      step >= item.num
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white scale-110'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step > item.num ? <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" /> : item.num}
                    </div>
                    <span className={`text-[9px] sm:text-xs mt-1 sm:mt-2 font-medium text-center hidden sm:block ${
                      step >= item.num ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={`h-0.5 sm:h-1 w-full mx-1 sm:mx-2 rounded transition-all ${
                      step > item.num ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Create Your Account
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Join our fitness community today</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fitnessGoal">Fitness Goal (Optional)</Label>
                <Select
                  value={formData.fitnessGoal}
                  onValueChange={(value) => setFormData({ ...formData, fitnessGoal: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your fitness goal" />
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

              <Button
                onClick={nextStep}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Membership Details */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Choose Your Membership
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Unlock access to all premium features</p>
              </div>

              <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Premium Membership</h2>
                      <p className="text-sm sm:text-base text-gray-600">Full access to all features</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        $5
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">one-time payment</div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Video className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Video Library</h3>
                        <p className="text-sm text-gray-600">Access 500+ workout videos</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Live Sessions</h3>
                        <p className="text-sm text-gray-600">Join live workout classes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Custom Plans</h3>
                        <p className="text-sm text-gray-600">Personalized workout plans</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Trophy className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Progress Tracking</h3>
                        <p className="text-sm text-gray-600">Track your achievements</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold">30-Day Money Back Guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-full sm:flex-1 h-11 sm:h-12 font-semibold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  className="w-full sm:flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  <span className="hidden sm:inline">Continue to Terms</span>
                  <span className="sm:hidden">Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Terms and Conditions */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Terms & Conditions
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Please review and accept our terms</p>
              </div>

              <Card className="border border-gray-200 max-h-96 overflow-y-auto">
                <CardContent className="p-6 space-y-4 text-sm text-gray-700">
                  <h3 className="font-bold text-lg text-gray-900">Service Terms</h3>
                  <p>
                    By creating an account with our fitness platform, you agree to the following terms and conditions:
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">1. Membership</h4>
                  <p>
                    Your membership grants you access to all video content, live sessions, and platform features.
                    The one-time payment of $5 provides lifetime access to the platform.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">2. User Responsibilities</h4>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials.
                    You agree to notify us immediately of any unauthorized access to your account.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">3. Content Usage</h4>
                  <p>
                    All video content and materials are for personal use only. Distribution, reproduction,
                    or commercial use of any content is strictly prohibited.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">4. Health and Safety</h4>
                  <p>
                    You should consult with a healthcare provider before beginning any exercise program.
                    We are not liable for any injuries that may occur during workout sessions.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">5. Refund Policy</h4>
                  <p>
                    We offer a 30-day money-back guarantee. If you&apos;re not satisfied with our service,
                    contact our support team within 30 days of registration for a full refund.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">6. Privacy</h4>
                  <p>
                    We respect your privacy and protect your personal information in accordance with our
                    Privacy Policy. Your data will never be shared with third parties without your consent.
                  </p>

                  <h4 className="font-semibold text-base text-gray-900 mt-4">7. Modifications</h4>
                  <p>
                    We reserve the right to modify these terms at any time. Continued use of the platform
                    after changes constitutes acceptance of the new terms.
                  </p>
                </CardContent>
              </Card>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                    setFormData({ ...formData, termsAccepted: checked === true })
                  }
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I have read and agree to the Terms and Conditions, Privacy Policy,
                  and understand the Health & Safety guidelines.
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-full sm:flex-1 h-11 sm:h-12 font-semibold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  className="w-full sm:flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  disabled={!formData.termsAccepted}
                >
                  <span className="hidden sm:inline">Continue to Payment</span>
                  <span className="sm:hidden">Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Method */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Payment Method
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Complete your purchase securely</p>
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 shadow-lg sm:scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {paymentMethod === 'card' && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <div className="bg-blue-600 rounded-full p-1">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                      <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">Credit/Debit Card</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Pay securely with your card</p>
                    <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      <div className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border">VISA</div>
                      <div className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border">Mastercard</div>
                      <div className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border">Amex</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all ${
                    paymentMethod === 'mpesa'
                      ? 'border-green-600 bg-green-50 shadow-lg sm:scale-105'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  {paymentMethod === 'mpesa' && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <div className="bg-green-600 rounded-full p-1">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                      <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-1">M-Pesa</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Pay with M-Pesa mobile money</p>
                    <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-green-600">
                      M-PESA
                    </div>
                  </div>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          cardNumber: formatCardNumber(e.target.value)
                        })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="mt-1 font-mono text-lg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardHolder">Cardholder Name *</Label>
                      <Input
                        id="cardHolder"
                        value={formData.cardHolder}
                        onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                        placeholder="JOHN DOE"
                        className="mt-1 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expiryMonth">Month *</Label>
                        <Select
                          value={formData.expiryMonth}
                          onValueChange={(value) => setFormData({ ...formData, expiryMonth: value })}
                        >
                          <SelectTrigger className="mt-1">
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
                      <div>
                        <Label htmlFor="expiryYear">Year *</Label>
                        <Select
                          value={formData.expiryYear}
                          onValueChange={(value) => setFormData({ ...formData, expiryYear: value })}
                        >
                          <SelectTrigger className="mt-1">
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
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          type="password"
                          value={formData.cvv}
                          onChange={(e) => setFormData({
                            ...formData,
                            cvv: e.target.value.replace(/\D/g, '').slice(0, 3)
                          })}
                          placeholder="123"
                          maxLength={3}
                          className="mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white p-3 rounded-lg border">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Your payment information is encrypted and secure</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* M-Pesa Payment Form */}
              {paymentMethod === 'mpesa' && (
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-green-100 rounded-lg border border-green-300">
                      <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-700 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-green-800">
                        <p className="font-semibold">How to pay with M-Pesa:</p>
                        <p className="mt-1">1. Enter your M-Pesa phone number</p>
                        <p>2. You&apos;ll receive a payment prompt on your phone</p>
                        <p>3. Enter your M-Pesa PIN to complete payment</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mpesaPhone">M-Pesa Phone Number *</Label>
                      <Input
                        id="mpesaPhone"
                        value={formData.mpesaPhone}
                        onChange={(e) => setFormData({
                          ...formData,
                          mpesaPhone: e.target.value.replace(/\D/g, '')
                        })}
                        placeholder="+254 712 345 678"
                        className="mt-1 text-lg font-mono"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-white p-3 rounded-lg border">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Secure payment powered by M-Pesa</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Summary */}
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-sm sm:text-base text-gray-600">Premium Membership</span>
                    <span className="font-semibold text-sm sm:text-base">$5.00</span>
                  </div>
                  <Separator className="my-3 sm:my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      $5.00
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="w-full sm:flex-1 h-11 sm:h-12 font-semibold"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  className="w-full sm:flex-1 h-11 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <span className="hidden sm:inline">Complete Payment</span>
                      <span className="sm:hidden">Pay Now</span>
                      <CheckCircle2 className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center py-6 sm:py-8 md:py-12 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full mb-4 sm:mb-6 animate-bounce">
                <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">
                Welcome Aboard!
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 mb-2 px-4">
                Your account has been created successfully
              </p>

              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">
                You now have full access to all premium features
              </p>

              <Card className="max-w-md mx-auto mb-8 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-medium">Account</span>
                    <span className="text-gray-900 font-semibold">{formData.username}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-medium">Email</span>
                    <span className="text-gray-900 font-semibold">{formData.email}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Membership</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Active
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full max-w-md h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  Go to Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-sm text-gray-600">
                  A confirmation email has been sent to {formData.email}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
