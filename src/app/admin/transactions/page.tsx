'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Transaction {
  _id: string;
  userId?: { fullName: string; email: string };
  guestCustomer?: {
    fullName: string;
    email: string;
  };
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidOrders: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/orders?all=true');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
      }
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);

        // Calculate stats
        const paidOrders = data.data.filter((t: Transaction) => t.paymentStatus === 'paid');
        const totalRevenue = paidOrders.reduce((sum: number, t: Transaction) => sum + t.total, 0);
        const pendingPayments = data.data.filter((t: Transaction) => t.paymentStatus === 'pending').length;
        const failedPayments = data.data.filter((t: Transaction) => t.paymentStatus === 'failed').length;

        setStats({
          totalRevenue,
          paidOrders: paidOrders.length,
          pendingPayments,
          failedPayments,
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
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

  const getCustomerName = (transaction: Transaction) => {
    if (transaction.guestCustomer) {
      return `${transaction.guestCustomer.fullName} (Guest)`;
    } else if (transaction.userId) {
      return transaction.userId.fullName || 'N/A';
    }
    return 'N/A';
  };

  const getCustomerEmail = (transaction: Transaction) => {
    if (transaction.guestCustomer) {
      return transaction.guestCustomer.email;
    } else if (transaction.userId) {
      return transaction.userId.email || 'N/A';
    }
    return 'N/A';
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
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Transactions</h1>
            <p className="text-gray-600">View and track all payment transactions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From {stats.paidOrders} paid orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paid Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.paidOrders}</p>
              <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingPayments}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.failedPayments}</p>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-600 py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No transactions found</p>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell className="font-medium">
                    #{transaction._id.slice(-8)}
                  </TableCell>
                  <TableCell>{getCustomerName(transaction)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getCustomerEmail(transaction)}
                  </TableCell>
                  <TableCell className="font-bold text-blue-600">
                    ${transaction.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(transaction.paymentStatus)}>
                      {transaction.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
