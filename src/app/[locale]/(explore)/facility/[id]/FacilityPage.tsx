'use client';

import type { Amenity, Facility, FacilityType, Location } from '@/models/types';
import type { FacilityImageMeta } from '@/utils/images';

import AmenitiesList from '@/components/AmenitiesList';
import BackButton from '@/components/BackButton';
import OpenStatus from '@/components/OpenStatus';
import OperatingHours from '@/components/OperatingHours';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getFacilityImages } from '@/utils/images';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type FacilityWithRelations = Omit<Facility, 'facility_type_id' | 'location_id'> & {
  location?: Location;
  facility_type?: FacilityType;
  facility_amenities: {
    quantity: number;
    amenity: Amenity;
  }[];
};

type FacilityDetailsProps = {
  facility: FacilityWithRelations;
};

const FacilityPage: React.FC<FacilityDetailsProps> = ({ facility }) => {
  const t = useTranslations();
  const [images, setImages] = useState<FacilityImageMeta[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const imgs = await getFacilityImages(facility.id);
      if (mounted) {
        setImages(imgs);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [facility.id]);

  const location = facility.location || {
    id: 0,
    address: t('FacilityPage.unknown_address'),
    latitude: 0,
    longitude: 0,
    opensAt: null,
    closesAt: null,
  };

  const facilityType = facility.facility_type || {
    id: 0,
    name: t('FacilityPage.unknown_facility_type'),
    description: t('FacilityPage.no_description_available'),
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="w-full mb-4">
          <Carousel opts={{ align: 'start', loop: false }}>
            <CarouselContent className="-ml-4">
              {images.map((img, idx) => (
                <CarouselItem key={img.url} className="pl-4">
                  <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                    {img.url.startsWith('data:')
                      ? (
                          <Image
                            src={img.url}
                            alt={`Facility ${idx + 1}`}
                            draggable={false}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
                            className="object-cover"
                            priority={idx === 0}
                          />
                        )
                      : (
                          <Image
                            src={img.url}
                            alt={`Facility ${idx + 1}`}
                            draggable={false as any}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
                            className="object-cover"
                            priority={idx === 0}
                          />
                        )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* Facility Name and Floor Badge */}
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">
          {
            location.building
              ? location.building
              : location.block
                ? `${location.block} ${location.road}`
                : location.address
          }
        </h1>
        {facility.floor && <Badge className="mt-1 text-1xl">{facility.floor}</Badge>}
        {location.opensAt && location.closesAt && (
          <OpenStatus opensAt={location.opensAt} closesAt={location.closesAt} className="mt-1 text-1xl" />
        )}
      </div>
      {location.opensAt && location.closesAt && (
        <OperatingHours exact opensAt={location.opensAt} closesAt={location.closesAt} className="mt-2" />
      )}
      <p className="text-gray-600 mt-2">{facility.description}</p>

      {/* Facility Type */}
      <p className="text-gray-500 mt-1 italic">{facilityType.name}</p>

      {/* Accessibility */}
      <div className="mt-4 flex items-center gap-2">
        <span className="font-medium">{t('FacilityPage.how_to_access')}</span>
        {facility.how_to_access}
      </div>

      {/* Amenities */}
      <AmenitiesList amenities={facility.facility_amenities} />
    </div>
  );
};

export default FacilityPage;
