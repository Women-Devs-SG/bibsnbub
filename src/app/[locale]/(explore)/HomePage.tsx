'use client';

import type { FacilityCategorySlug } from '@/lib/facility-categories';
import type { Facility, FacilityType, Location } from '@/models/types';
import type { Address } from '@/types/Address';
import type { ReactNode } from 'react';
import CategoryScroller from '@/components/CategoryScroller';
import FacilityCard from '@/components/FacilityCard';
import SearchBar from '@/components/SearchBar';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { calculateDistance, handleUseCurrentLocation } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

type PaginationInfo = {
  currentPage: number;
  pageSize: number;
  totalFacilities: number;
};

type PageDisplayItem =
  | { kind: 'page'; value: number }
  | { kind: 'ellipsis'; id: string };

type Props = {
  locationsData: Location[];
  facilitiesData: Facility[];
  facilityTypesData: FacilityType[];
  pagination: PaginationInfo;
  selectedCategory: FacilityCategorySlug | null;
};

const DEFAULT_LOCATION = { latitude: 1.287953, longitude: 103.851784 } as const;

export default function HomePage({
  locationsData,
  facilitiesData,
  facilityTypesData,
  pagination,
  selectedCategory,
}: Props) {
  const t = useTranslations('Index');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';
  const [isPending, startTransition] = useTransition();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sortedLocations, setSortedLocations] = useState<Location[]>(locationsData);
  const [activeCategory, setActiveCategory] = useState<FacilityCategorySlug | null>(selectedCategory);

  useEffect(() => {
    setUserLocation({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    });
  }, []);

  useEffect(() => {
    setSortedLocations(locationsData);
  }, [locationsData]);

  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  const handleSearch = useCallback((address: Address) => {
    const { latitude, longitude } = address;
    setUserLocation({ latitude, longitude });

    const sorted = [...locationsData].sort((a, b) => {
      const distanceA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
      const distanceB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
      return distanceA - distanceB;
    });

    setSortedLocations(sorted);
  }, [locationsData]);

  const handleCategorySelect = useCallback((category: FacilityCategorySlug | null) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParamsString);

    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.delete('page');

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }, [pathname, router, searchParamsString]);

  const handlePageChange = useCallback((page: number) => {
    if (page === pagination.currentPage) {
      return;
    }

    const totalAvailablePages = pagination.totalFacilities > 0
      ? Math.ceil(pagination.totalFacilities / pagination.pageSize)
      : 1;
    const safePage = Math.max(1, Math.min(page, totalAvailablePages));
    const params = new URLSearchParams(searchParamsString);

    if (safePage === 1) {
      params.delete('page');
    } else {
      params.set('page', String(safePage));
    }

    if (activeCategory) {
      params.set('category', activeCategory);
    } else {
      params.delete('category');
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }, [activeCategory, pagination.currentPage, pagination.pageSize, pagination.totalFacilities, pathname, router, searchParamsString]);

  const filteredFacilities = useMemo(() => {
    if (!activeCategory) {
      return facilitiesData;
    }

    if (activeCategory === 'diaper') {
      return facilitiesData.filter(facility => facility.has_diaper_changing_station);
    }

    return facilitiesData.filter(facility => facility.has_lactation_room);
  }, [activeCategory, facilitiesData]);

  const facilitiesByLocation = useMemo(() => {
    const map = new Map<number, Facility[]>();

    for (const facility of filteredFacilities) {
      const existing = map.get(facility.location_id) ?? [];
      existing.push(facility);
      map.set(facility.location_id, existing);
    }

    return map;
  }, [filteredFacilities]);

  const visibleLocations = useMemo(
    () => sortedLocations.filter(location => facilitiesByLocation.has(location.id)),
    [sortedLocations, facilitiesByLocation],
  );

  const facilityTypeById = useMemo(() => {
    const map = new Map<number, FacilityType>();
    facilityTypesData.forEach(type => map.set(type.id, type));
    return map;
  }, [facilityTypesData]);

  const { currentPage, pageSize, totalFacilities } = pagination;
  const totalPages = totalFacilities > 0 ? Math.ceil(totalFacilities / pageSize) : 0;
  const offset = (currentPage - 1) * pageSize;
  const startItem = totalFacilities === 0 ? 0 : Math.min(offset + 1, totalFacilities);
  const endItem = totalFacilities === 0 ? 0 : Math.min(offset + filteredFacilities.length, totalFacilities);
  const summaryVisible = totalFacilities > 0 && filteredFacilities.length > 0;

  const pageItems = useMemo<PageDisplayItem[]>(() => {
    if (totalPages <= 1) {
      return [];
    }

    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

    if (currentPage <= 3) {
      pages.add(2);
      pages.add(3);
    }

    if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
    }

    const ordered = Array.from(pages)
      .filter(page => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const items: PageDisplayItem[] = [];
    let previous: number | null = null;

    for (const page of ordered) {
      if (previous !== null && page - previous > 1) {
        items.push({ kind: 'ellipsis', id: `${previous}-${page}` });
      }

      items.push({ kind: 'page', value: page });
      previous = page;
    }

    return items;
  }, [currentPage, totalPages]);

  const previousLabel = t('pagination_previous');
  const nextLabel = t('pagination_next');
  const mobileSummary = totalPages > 0 ? t('results_mobile_summary', { current: currentPage, total: totalPages }) : null;
  const summaryText = summaryVisible ? t('results_summary', { start: startItem, end: endItem, total: totalFacilities }) : null;
  const emptyStateText = t('results_empty');

  const isPreviousDisabled = isPending || currentPage <= 1;
  const isNextDisabled = isPending || totalPages === 0 || currentPage >= totalPages;

  const facilityCards: ReactNode[] = [];

  for (const location of visibleLocations) {
    const locationFacilities = facilitiesByLocation.get(location.id) ?? [];

    for (const facility of locationFacilities) {
      const facilityType = facilityTypeById.get(facility.facility_type_id);

      if (!facilityType) {
        continue;
      }

      facilityCards.push(
        <FacilityCard
          key={facility.id}
          location={location}
          facility={facility}
          facilityType={facilityType}
          userLatitude={userLocation?.latitude ?? 0}
          userLongitude={userLocation?.longitude ?? 0}
        />,
      );
    }
  }

  return (
    <div className="py-5 text-xl" aria-busy={isPending} aria-live="polite">
      <div className="mb-6">
        <div className="flex items-center justify-left gap-3">
          <h1 className="text-3xl font-bold">{t('meta_title')}</h1>
          <div className="flex items-center gap-2 text-base font-medium text-gray-600">
            <span className="sm:inline">{t('meta_by')}</span>
            <a
              href="https://womendevssg.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/assets/images/womendevs.png"
                alt="Women Devs SG"
                width={100}
                height={24}
                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                priority
              />
            </a>
          </div>
        </div>
        <p className="mt-1">{t('meta_description')}</p>
      </div>

      <SearchBar
        onSearchAction={handleSearch}
        onUseCurrentLocationAction={() =>
          handleUseCurrentLocation(
            (latitude, longitude) => handleSearch({ latitude, longitude } as Address),
            () => toast.warning('Unable to retrieve your location. Please try again.'),
          )}
      />

      <div className="mt-6">
        <CategoryScroller selectedCategory={activeCategory} onCategorySelect={handleCategorySelect} />
      </div>

      {summaryText && (
        <div className="mt-6 text-base text-muted-foreground">
          {summaryText}
        </div>
      )}

      <div className="mt-6">
        {facilityCards.length > 0 && facilityCards}
        {facilityCards.length === 0 && (
          <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-base text-muted-foreground">
            {emptyStateText}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex flex-col gap-4">
          {mobileSummary && (
            <div className="flex items-center justify-between rounded-md bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:hidden">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPreviousDisabled}
                aria-label={previousLabel}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <span className="text-center text-sm font-medium">{mobileSummary}</span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isNextDisabled}
                aria-label={nextLabel}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}

          <Pagination className="hidden md:flex">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious disabled={isPreviousDisabled} onClick={() => handlePageChange(currentPage - 1)}>
                  {previousLabel}
                </PaginationPrevious>
              </PaginationItem>

              {pageItems.map((item) => {
                if (item.kind === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${item.id}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={`page-${item.value}`}>
                    <PaginationLink
                      isActive={item.value === currentPage}
                      onClick={() => handlePageChange(item.value)}
                      disabled={isPending}
                    >
                      {item.value}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext disabled={isNextDisabled} onClick={() => handlePageChange(currentPage + 1)}>
                  {nextLabel}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
