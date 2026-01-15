'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function CustomerFavoritesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-6 md:h-8 w-6 md:w-8 text-red-600" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Favorites</h1>
          <p className="text-sm md:text-base text-gray-600">Your saved content</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No favorites yet. Start adding content to your favorites!</p>
        </CardContent>
      </Card>
    </div>
  );
}
