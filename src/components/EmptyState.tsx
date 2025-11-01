'use client';

import { Card } from '@/components/ui/card';
import { MapPin, Search } from 'lucide-react';
import React from 'react';

type EmptyStateProps = {
  radius: number;
  hasSearched: boolean;
};

const EmptyState: React.FC<EmptyStateProps> = ({ radius, hasSearched }) => {
  if (!hasSearched) {
    return null;
  }

  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <MapPin className="w-12 h-12 text-gray-400" />
          <Search className="w-6 h-6 text-gray-400 absolute -bottom-1 -right-1" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        No facilities found within
        {' '}
        {radius}
        km
      </h3>
      <p className="text-gray-500 text-sm">
        Try expanding your search radius or searching in a different location.
      </p>
    </Card>
  );
};

export default EmptyState;
