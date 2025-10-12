import type { Amenity, FacilityType, Location } from '@/models/types';
import { amenities, facilities, facilityAmenities, facilityTypes, locations } from '@/models/Schema';
import { getStaticClient } from '@/utils/supabase/client';
import { tryCreateClient } from '@/utils/supabase/server';
import { eq, inArray } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import FacilityPage from './FacilityPage';

type FacilityPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateStaticParams() {
  // During build-time static generation, avoid initializing DB or calling SDKs
  if (!process.env.NEXT_RUNTIME) {
    return [];
  }
  const client = getStaticClient();
  if (client) {
    const { data, error } = await client.from('facilities').select('id');
    if (error || !data) {
      console.error('Error fetching facilities:', error);
      return [];
    }
    return data.flatMap((f: { id: number }) => ['en'].map(locale => ({ id: String(f.id), locale })));
  }
  // Local dev: use Drizzle (PGlite)
  const { db } = await import('@/libs/DB');
  const ids = await db.select({ id: facilities.id }).from(facilities);
  return ids.flatMap((f: { id: number }) => ['en'].map(locale => ({ id: String(f.id), locale })));
}

export async function generateMetadata(props: FacilityPageProps) {
  const { locale, id } = await props.params;

  const t = await getTranslations({
    locale,
    namespace: 'FacilityPage',
  });

  return {
    title: t('meta_title', { id }),
    description: t('meta_description', { id }),
  };
}

export default async function Page(props: FacilityPageProps) {
  const { locale, id } = await props.params;

  setRequestLocale(locale);

  const supabase = await tryCreateClient();
  if (supabase) {
    const facilityQuery = supabase
      .from('facilities')
      .select(`
        id,
        created_at,
        created_by,
        how_to_access,
        description,
        floor,
        has_diaper_changing_station,
        has_lactation_room,
        location:location_id (*),
        facility_type:facility_type_id (*),
        facility_amenities:facility_amenities (
          quantity,
          amenity:amenity_id (*)
        )
      `)
      .eq('id', id)
      .single()
      .overrideTypes<{
      location: Location;
      facility_type: FacilityType;
      facility_amenities: { quantity: number; amenity: Amenity }[];
    }>();

    const { data: facility, error: facilityError } = await facilityQuery;
    if (facilityError) {
      console.error('Error fetching facility details:', facilityError);
      return <div>Failed to load facility details. Please try again later.</div>;
    }
    if (!facility) {
      return <div>Facility not found. It may have been removed or is unavailable.</div>;
    }
    return <FacilityPage facility={facility} />;
  }

  // Local dev: fetch via Drizzle (PGlite)
  if (!process.env.NEXT_RUNTIME) {
    return <div>Facility not found. It may have been removed or is unavailable.</div>;
  }
  const { db } = await import('@/libs/DB');
  const facilityId = Number(id);
  const [facilityRow] = await db.select().from(facilities).where(eq(facilities.id, facilityId)).limit(1);
  if (!facilityRow) {
    return <div>Facility not found. It may have been removed or is unavailable.</div>;
  }
  const [locRow] = await db.select().from(locations).where(eq(locations.id, facilityRow.locationId)).limit(1);
  const [typeRow] = await db.select().from(facilityTypes).where(eq(facilityTypes.id, facilityRow.facilityTypeId)).limit(1);
  const faRows = (await db
    .select()
    .from(facilityAmenities)
    .where(eq(facilityAmenities.facilityId, facilityId))) as Array<typeof facilityAmenities.$inferSelect>;
  const amenityIds = faRows.map(fa => fa.amenityId);
  const amenityRows: Array<typeof amenities.$inferSelect>
  = amenityIds.length > 0
    ? await db.select().from(amenities).where(inArray(amenities.id, amenityIds))
    : [];
  const amenityById = new Map<number, typeof amenities.$inferSelect>(amenityRows.map(a => [a.id, a]));

  const facility = {
    id: facilityRow.id,
    created_at: facilityRow.createdAt,
    created_by: facilityRow.createdBy,
    how_to_access: facilityRow.howToAccess,
    description: facilityRow.description,
    floor: facilityRow.floor,
    has_diaper_changing_station: facilityRow.hasDiaperChangingStation,
    has_lactation_room: facilityRow.hasLactationRoom,
    location: locRow as unknown as Location,
    facility_type: typeRow as unknown as FacilityType,
    facility_amenities: faRows.map(fa => ({
      quantity: fa.quantity ?? 1,
      amenity: amenityById.get(fa.amenityId) as unknown as Amenity,
    })),
  };

  return <FacilityPage facility={facility} />;
}
