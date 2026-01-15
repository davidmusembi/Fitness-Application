'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function StaffAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">View your content performance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Analytics data will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
