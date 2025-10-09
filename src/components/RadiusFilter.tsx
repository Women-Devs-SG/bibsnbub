'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import React from 'react';

type RadiusFilterProps = {
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
};

const RADIUS_OPTIONS = [5, 10, 25];

const RadiusFilter: React.FC<RadiusFilterProps> = ({ selectedRadius, onRadiusChange }) => {
  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Search within radius
        </span>
      </div>
      <div className="flex gap-2">
        {RADIUS_OPTIONS.map(radius => (
          <Button
            key={radius}
            variant={selectedRadius === radius ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRadiusChange(radius)}
            className="text-xs"
          >
            {radius}
            km
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default RadiusFilter;
