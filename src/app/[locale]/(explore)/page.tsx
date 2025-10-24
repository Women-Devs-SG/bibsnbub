import type { FacilityCategorySlug } from '@/lib/facility-categories';
import type { Facility, FacilityType, Location } from '@/models/types';
import { FACILITY_CATEGORY_SLUGS, getCategoryFilterKey } from '@/lib/facility-categories';
import { facilities, facilityTypes, locations } from '@/models/Schema';
import { tryCreateClient } from '@/utils/supabase/server';
import { eq, inArray, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import HomePage from './HomePage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageSearchParams = {
  page?: string;
  pageSize?: string;
  category?: string;
};

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 25;

const normalizeFacility = (row: any): Facility => ({
  id: row.id,
  location_id: row.location_id ?? row.locationId,
  facility_type_id: row.facility_type_id ?? row.facilityTypeId,
  floor: row.floor ?? '',
  how_to_access: row.how_to_access ?? row.howToAccess ?? null,
  description: row.description ?? null,
  has_diaper_changing_station: Boolean(row.has_diaper_changing_station ?? row.hasDiaperChangingStation),
  has_lactation_room: Boolean(row.has_lactation_room ?? row.hasLactationRoom),
  amenities: row.amenities,
  created_by: row.created_by ?? row.createdBy ?? '',
  created_at:
    typeof row.created_at === 'string'
      ? row.created_at
      : row.createdAt?.toISOString?.() ?? String(row.createdAt ?? ''),
});

const normalizeLocation = (row: any): Location => ({
  id: row.id,
  building: row.building ?? undefined,
  block: row.block ?? undefined,
  road: row.road ?? undefined,
  address: row.address,
  latitude: typeof row.latitude === 'string' ? Number(row.latitude) : Number(row.latitude ?? 0),
  longitude: typeof row.longitude === 'string' ? Number(row.longitude) : Number(row.longitude ?? 0),
  opensAt: row.opensAt ?? row.opens_at ?? null,
  closesAt: row.closesAt ?? row.closes_at ?? null,
});

const normalizeFacilityType = (row: any): FacilityType => ({
  id: row.id,
  name: row.name,
});

type PageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const rawPage = typeof searchParams.page === 'string' ? Number.parseInt(searchParams.page, 10) : 1;
  const rawPageSize = typeof searchParams.pageSize === 'string' ? Number.parseInt(searchParams.pageSize, 10) : DEFAULT_PAGE_SIZE;
  const boundedPageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = boundedPageSize;
  const offset = (currentPage - 1) * pageSize;

  const rawCategory = typeof searchParams.category === 'string' ? searchParams.category : null;
  const categorySlug = (rawCategory && FACILITY_CATEGORY_SLUGS.includes(rawCategory as FacilityCategorySlug)
    ? rawCategory
    : null) as FacilityCategorySlug | null;
  const selectedCategoryFilterKey = getCategoryFilterKey(categorySlug);

  const forceLocal = process.env.FORCE_LOCAL_DB === '1';
  const supabase = forceLocal ? null : await tryCreateClient();

  let locationsData: Location[] = [];
  let facilitiesData: Facility[] = [];
  let facilityTypesData: FacilityType[] = [];
  let totalFacilities = 0;

  if (supabase) {
    try {
      let facilityQuery = supabase
        .from('facilities')
        .select('*', { count: 'exact' })
        .order('id', { ascending: true });

      if (selectedCategoryFilterKey) {
        facilityQuery = facilityQuery.eq(selectedCategoryFilterKey, true);
      }

      const { data: facilityRows, error: facilityError, count } = await facilityQuery.range(
        offset,
        offset + pageSize - 1,
      );

      if (facilityError) {
        throw facilityError;
      }

      totalFacilities = count ?? 0;
      facilitiesData = (facilityRows ?? []).map(normalizeFacility);

      const locationIds = Array.from(new Set(facilitiesData.map(f => f.location_id))).filter(Boolean);
      if (locationIds.length) {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('*')
          .in('id', locationIds);

        if (locError) {
          throw locError;
        }

        locationsData = (locData ?? []).map(normalizeLocation);
      }

      const facilityTypeIds = Array.from(new Set(facilitiesData.map(f => f.facility_type_id))).filter(Boolean);
      if (facilityTypeIds.length) {
        const { data: typeData, error: typeError } = await supabase
          .from('facility_types')
          .select('id, name')
          .in('id', facilityTypeIds);

        if (typeError) {
          throw typeError;
        }

        facilityTypesData = (typeData ?? []).map(normalizeFacilityType);
      }
    } catch (e) {
      console.error('Supabase fetch failed, falling back to local DB:', e);
      // fallthrough to local
    }
  }

  const shouldUseLocal = !supabase || (!facilitiesData.length && totalFacilities === 0);

  if (shouldUseLocal) {
    const { db } = await import('@/libs/DB');

    const whereClause = selectedCategoryFilterKey === 'has_diaper_changing_station'
      ? eq(facilities.hasDiaperChangingStation, true)
      : selectedCategoryFilterKey === 'has_lactation_room'
        ? eq(facilities.hasLactationRoom, true)
        : undefined;

    let totalQuery = db.select({ value: sql<number>`count(*)` }).from(facilities);
    if (whereClause) {
      totalQuery = totalQuery.where(whereClause);
    }
    const totalResult = await totalQuery;
    totalFacilities = Number(totalResult[0]?.value ?? 0);

    let facilityQuery = db.select().from(facilities).orderBy(facilities.id).limit(pageSize).offset(offset);
    if (whereClause) {
      facilityQuery = facilityQuery.where(whereClause);
    }
    const facRows = await facilityQuery;
    facilitiesData = facRows.map(normalizeFacility);

    const locationIds = Array.from(new Set(facilitiesData.map(f => f.location_id))).filter(Boolean);
    if (locationIds.length) {
      const locRows = await db.select().from(locations).where(inArray(locations.id, locationIds));
      locationsData = locRows.map(normalizeLocation);
    }

    const facilityTypeIds = Array.from(new Set(facilitiesData.map(f => f.facility_type_id))).filter(Boolean);
    if (facilityTypeIds.length) {
      const typeRows = await db.select().from(facilityTypes).where(inArray(facilityTypes.id, facilityTypeIds));
      facilityTypesData = typeRows.map(normalizeFacilityType);
    }
  } else {
    // Supabase provided data but may have omitted related tables; fill missing pieces locally if available.
    // In some cases (e.g., restricted permissions or incomplete query responses), Supabase may return
    // facility rows without the corresponding location or facility_type data. This fallback ensures
    // we populate any gaps using the local database.
    // TODO: Remove this fallback once the API contract guarantees that all related tables are included
    // in Supabase responses, or once RLS policies are finalized to always allow access to related data.
    const missingLocationIds = facilitiesData
      .map(f => f.location_id)
      .filter(id => !locationsData.some(loc => loc.id === id));
    const missingFacilityTypeIds = facilitiesData
      .map(f => f.facility_type_id)
      .filter(id => !facilityTypesData.some(type => type.id === id));

    if (missingLocationIds.length || missingFacilityTypeIds.length) {
      const { db } = await import('@/libs/DB');

      if (missingLocationIds.length) {
        const locRows = await db.select().from(locations).where(inArray(locations.id, missingLocationIds));
        locationsData = locationsData.concat(locRows.map(normalizeLocation));
      }

      if (missingFacilityTypeIds.length) {
        const typeRows = await db.select().from(facilityTypes).where(inArray(facilityTypes.id, missingFacilityTypeIds));
        facilityTypesData = facilityTypesData.concat(typeRows.map(normalizeFacilityType));
      }
    }
  }

  const totalPages = totalFacilities > 0 ? Math.ceil(totalFacilities / pageSize) : 0;
  if (totalFacilities > 0 && currentPage > totalPages) {
    const params = new URLSearchParams();
    params.set('page', String(totalPages));
    if (pageSize !== DEFAULT_PAGE_SIZE) {
      params.set('pageSize', String(pageSize));
    }
    if (categorySlug) {
      params.set('category', categorySlug);
    }
    redirect(`?${params.toString()}`);
  }

  return (
    <HomePage
      locationsData={locationsData || []}
      facilitiesData={facilitiesData || []}
      facilityTypesData={facilityTypesData || []}
      pagination={{
        currentPage,
        pageSize,
        totalFacilities,
      }}
      selectedCategory={categorySlug}
    />
  );
}
