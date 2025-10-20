'use client';

import type { Facility, FacilityType, Location } from '@/models/types';

import OpenStatus from '@/components/OpenStatus';
import OperatingHours from '@/components/OperatingHours';
import { Badge } from '@/components/ui/badge';
import { calculateDistance } from '@/lib/utils';
import { bottleBaby } from '@lucide/lab';
import AccessibleIcon from '@mui/icons-material/Accessible';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ManIcon from '@mui/icons-material/Man';
import WcIcon from '@mui/icons-material/Wc';
import WomanIcon from '@mui/icons-material/Woman';
import { Baby, CircleHelp, Icon, MapPin } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type FacilityCardProps = {
  location: Location;
  facility: Facility;
  facilityType: FacilityType;
  userLatitude: number;
  userLongitude: number;
};

const FacilityCard: React.FC<FacilityCardProps> = ({ location, facility, facilityType, userLatitude: latitude, userLongitude: longitude }) => {
  const getFacilityIcon = (facilityTypeName: string) => {
    switch (facilityTypeName) {
      case 'Lactation Room':
        return <Icon iconNode={bottleBaby} />;
      case 'Diaper Changing Station':
        return <BabyChangingStationIcon />;
      case 'Baby Room':
        return <Baby />;
      case 'Restroom (Accessible)':
        return <AccessibleIcon />;
      case 'Restroom (Family)':
        return <FamilyRestroomIcon />;
      case 'Restroom (Ladies)':
        return <WomanIcon />;
      case 'Restroom (Men\'s)':
        return <ManIcon />;
      case 'Restroom (Unisex)':
        return <WcIcon />;
      default:
        return <CircleHelp />;
    }
  };

  const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude).toFixed(1);

  return (
    <Link href={`/facility/${facility.id}`} passHref>
      <div className="border rounded-lg p-4 shadow-md bg-white flex items-center cursor-pointer hover:shadow-lg transition-shadow">
        {/* Image carousel (mobile-first) */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mr-4">
          {getFacilityIcon(facilityType.name)}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h2>
              {
                location.building
                  ? location.building
                  : location.block
                    ? `${location.block} ${location.road}`
                    : location.address
              }
            </h2>
            {facility.floor && <Badge>{facility.floor}</Badge>}
            {location.opensAt && location.closesAt && (
              <OpenStatus opensAt={location.opensAt} closesAt={location.closesAt} />
            )}
          </div>
          <div className="text-black italic line-clamp-2">
            {facility.description || ''}
          </div>

          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <p className="flex items-center">
              <MapPin className="size-4 mr-1" />
              {`${distance} km`}
            </p>

            {location.opensAt && location.closesAt && (
              <OperatingHours opensAt={location.opensAt} closesAt={location.closesAt} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FacilityCard;
