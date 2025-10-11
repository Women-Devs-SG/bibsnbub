'use client';

import type { Facility, FacilityType, Location } from '@/models/types';
import { Badge } from '@/components/ui/badge';
import { calculateDistance } from '@/lib/utils';
import { bottleBaby } from '@lucide/lab';
import AccessibleIcon from '@mui/icons-material/Accessible';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import { Baby, CircleHelp, Icon, MapPin } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'


type FacilityCardProps = {
  location: Location;
  facility: Facility;
  facilityType: FacilityType;
  userLatitude: number;
  userLongitude: number;
};

const FacilityCard: React.FC<FacilityCardProps> = ({
  location,
  facility,
  facilityType,
  userLatitude: latitude,
  userLongitude: longitude,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Choose the best available image (adapt if your types differ)
  const imageUrl = useMemo(() => {
    // common patterns: facility.imageUrl, facility.photo, facility.photos[0]
    // adapt these keys to your actual Facility type shape
    // Try several common places; fallback to empty string
    // (If your Facility type already has a definite property, replace this)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = facility as any;
    return (
      f.imageUrl ||
      (Array.isArray(f.photos) && f.photos[0]) ||
      f.photo ||
      f.image ||
      ''
    );
  }, [facility]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const getFacilityIcon = (facilityTypeName: string) => {
    switch (facilityTypeName) {
      case 'Lactation Room':
        return <Icon iconNode={bottleBaby} />;
      case 'Diaper Changing Station':
        return <BabyChangingStationIcon />;
      case 'Baby Room':
        return <Baby />;
      case 'Accessible Restroom':
        return <AccessibleIcon />;
      case 'Family Restroom':
        return <FamilyRestroomIcon />;
      case "Ladies' Restroom":
        return <WomanIcon />;
      case "Men's Restroom":
        return <ManIcon />;
      default:
        return <CircleHelp />;
    }
  };

  const distance = calculateDistance(
    latitude,
    longitude,
    location.latitude,
    location.longitude
  ).toFixed(1);

  // Fallback placeholder data-URI SVG for broken images
  const placeholder =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%2371717a'%3EImage not available%3C/text%3E%3C/svg%3E";

  return (
    <>
      <Link href={`/facility/${facility.id}`} passHref>
        {/* Make the whole card clickable but we will stop propagation on image clicks */}
        <div className="border rounded-lg p-4 shadow-md bg-white flex items-center cursor-pointer hover:shadow-lg transition-shadow">
          {/* Image thumbnail (mobile-first) */}
          <button
            // using a button so it is keyboard-focusable
            onClick={(e) => {
              // prevent Link navigation when clicking the image
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(true);
            }}
            aria-label={`Open image for ${facilityType.name || 'facility'}`}
            className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-gray-100 mr-4 p-0 border-0"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={facilityType.name ?? 'facility image'}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholder;
                }}
              />
            ) : (
              // If no image, show the facility icon inside the thumbnail circle
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                {getFacilityIcon(facilityType.name)}
              </div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate">
                {location.building
                  ? location.building
                  : location.block
                  ? `${location.block} ${location.road ?? ''}`
                  : location.address}
              </h2>
              {facility.floor && <Badge>{facility.floor}</Badge>}
            </div>

            <div className="text-gray-600 flex items-center mt-2">
              <MapPin className="w-4 h-4 mr-1" />
              {distance} km
            </div>
          </div>
        </div>
      </Link>

      {/* Modal / Lightbox */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview for ${facilityType.name ?? 'facility'}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <div className="relative z-10 max-h-[90vh] max-w-[95vw] w-auto rounded-lg overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close image preview"
              className="absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded-full p-2 bg-white/90 shadow-md hover:bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

          {/* Image wrapper: use object-contain so vertical images are fully visible (with Zoom) */}
<div className="bg-black flex items-center justify-center p-2">
  {imageUrl ? (
    <Zoom>
      <img
        src={imageUrl}
        alt={facilityType.name ?? 'facility image'}
        className="max-h-[85vh] max-w-[90vw] object-contain"
        loading="eager"
        onError={(e) => {
          (e.target as HTMLImageElement).src = placeholder;
        }}
      />
    </Zoom>
  ) : (
    <div className="p-8 bg-white rounded">
      <div className="text-gray-700">No image available</div>
    </div>
  )}
</div>

            {/* Optional caption area */}
            <div className="bg-white/90 px-4 py-2 text-sm text-gray-700">
              <div className="font-medium">{facilityType.name ?? 'Facility'}</div>
              {location.building && <div className="mt-1 truncate">{location.building}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FacilityCard;
