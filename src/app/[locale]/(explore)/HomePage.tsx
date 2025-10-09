'use client';

import type { Facility, FacilityType, Location } from '@/models/types';
import type { Address } from '@/types/Address'; // Import Address type
import CategoryScroller from '@/components/CategoryScroller';
import EmptyState from '@/components/EmptyState';
import FacilityCard from '@/components/FacilityCard';
import RadiusFilter from '@/components/RadiusFilter';
import SearchBar from '@/components/SearchBar';
import { calculateDistance, handleUseCurrentLocation } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  locationsData: Location[];
  facilitiesData: Facility[];
  facilityTypesData: FacilityType[];
};

export default function HomePage({
  locationsData,
  facilitiesData,
  facilityTypesData,
}: Props) {
  const t = useTranslations('Index');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Location[]>(locationsData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(10); // Default 10km radius
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    setUserLocation({ latitude: 1.287953, longitude: 103.851784 }); // Default location center of Singapore

    // Restore radius preference from localStorage
    const savedRadius = localStorage.getItem('facilitySearchRadius');
    if (savedRadius) {
      setSelectedRadius(Number.parseInt(savedRadius, 10));
    }
  }, []);

  // Keep sortedLocations in sync when server data updates after navigation/refresh
  useEffect(() => {
    setSortedLocations(locationsData);
  }, [locationsData]);

  // Save radius preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('facilitySearchRadius', selectedRadius.toString());
  }, [selectedRadius]);

  const handleSearch = (address: Address) => {
    const { latitude, longitude } = address;
    setUserLocation({ latitude, longitude });
    setHasSearched(true);

    const sorted = [...locationsData].sort((a, b) => {
      const distanceA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
      const distanceB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
      return distanceA - distanceB;
    });

    setSortedLocations(sorted);
  };

  const filteredFacilities = facilitiesData?.filter((facility) => {
    // Category filtering
    if (selectedCategory === 'Diaper Changing Station') {
      if (!facility.has_diaper_changing_station) {
        return false;
      }
    } else if (selectedCategory === 'Lactation Room') {
      if (!facility.has_lactation_room) {
        return false;
      }
    }

    // Distance filtering - only apply if user has searched for a location
    if (hasSearched && userLocation) {
      const facilityLocation = locationsData.find(loc => loc.id === facility.location_id);
      if (facilityLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          facilityLocation.latitude,
          facilityLocation.longitude,
        );
        return distance <= selectedRadius;
      }
    }

    return true;
  });

  return (
    <div className="py-5 text-xl">
      <div className="mb-6">
        <div className="flex items-center justify-left gap-3">
          <h1 className="text-3xl font-bold">{t('meta_title')}</h1>
          <div className="flex items-center gap-2 text-base font-medium text-gray-600">
            <span className="sm:inline">{t('meta_by')}</span>
            <Image
              src="/assets/images/womendevs.png"
              alt="Women Devs SG"
              width={100}
              height={24}
              className="h-12 w-auto"
              priority
            />
          </div>
        </div>
        <p className="mt-1">{t('meta_description')}</p>
      </div>

      <SearchBar
        onSearchAction={handleSearch} // Pass handleSearch to SearchBar
        onUseCurrentLocationAction={() =>
          handleUseCurrentLocation(
            (latitude, longitude) => handleSearch({ latitude, longitude } as Address), // Pass Address object
            () => toast.warning('Unable to retrieve your location. Please try again.'),
          )}
      />

      {hasSearched && (
        <RadiusFilter
          selectedRadius={selectedRadius}
          onRadiusChange={setSelectedRadius}
        />
      )}

      <CategoryScroller onCategorySelect={setSelectedCategory} />

      {(() => {
        const facilitiesToShow = sortedLocations.flatMap((location) => {
          const locationFacilities = filteredFacilities.filter(
            facility => facility.location_id === location.id,
          );

          return locationFacilities.map((facility) => {
            const facilityType = facilityTypesData.find(
              type => type.id === facility.facility_type_id,
            );

            if (!facilityType) {
              return null;
            }

            return (
              <FacilityCard
                key={facility.id}
                location={location}
                facility={facility}
                facilityType={facilityType}
                userLatitude={userLocation?.latitude ?? 0}
                userLongitude={userLocation?.longitude ?? 0}
              />
            );
          }).filter(Boolean);
        });

        // Show EmptyState if user has searched and no facilities found within radius
        if (hasSearched && facilitiesToShow.length === 0) {
          return <EmptyState radius={selectedRadius} hasSearched={hasSearched} />;
        }

        return facilitiesToShow;
      })()}
    </div>
  );
}
