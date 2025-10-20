import { facilities, facilityTypes, locations } from '@/models/Schema';
import { tryCreateClient } from '@/utils/supabase/server';
import HomePage from './HomePage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const forceLocal = process.env.FORCE_LOCAL_DB === '1';
  const supabase = forceLocal ? null : await tryCreateClient();

  let locationsData: any[] = [];
  let facilitiesData: any[] = [];
  let facilityTypesData: any[] = [];

  if (supabase) {
    try {
      const [locRes, facRes, typeRes] = await Promise.all([
        supabase.from('locations').select(),
        supabase.from('facilities').select(),
        supabase.from('facility_types').select(),
      ]);

      if (locRes.error || facRes.error || typeRes.error) {
        throw locRes.error || facRes.error || typeRes.error;
      }
      locationsData = locRes.data ?? [];
      facilitiesData = facRes.data ?? [];
      facilityTypesData = typeRes.data ?? [];
      // If any dataset is empty, selectively fill from local DB
      if (!locationsData.length || !facilitiesData.length || !facilityTypesData.length) {
        if (!process.env.NEXT_RUNTIME) {
          // During build-time, avoid initializing DB
          // Leave arrays as-is; the later fallback will handle empty state
        } else {
          const { db } = await import('@/libs/DB');
          const [locs, facs, types] = await Promise.all([
            !locationsData.length ? db.select().from(locations) : Promise.resolve(null),
            !facilitiesData.length ? db.select().from(facilities) : Promise.resolve(null),
            !facilityTypesData.length ? db.select().from(facilityTypes) : Promise.resolve(null),
          ]);

          if (!locationsData.length && Array.isArray(locs)) {
            locationsData = locs.map((l: any) => ({
              id: l.id,
              building: l.building ?? undefined,
              block: l.block ?? undefined,
              road: l.road ?? undefined,
              address: l.address,
              latitude: typeof l.latitude === 'string' ? Number(l.latitude) : l.latitude,
              longitude: typeof l.longitude === 'string' ? Number(l.longitude) : l.longitude,
              opensAt: l.opensAt ?? undefined,
              closesAt: l.closesAt ?? undefined,
            }));
          }

          if (!facilitiesData.length && Array.isArray(facs)) {
            facilitiesData = facs.map((f: any) => ({
              id: f.id,
              location_id: f.locationId,
              facility_type_id: f.facilityTypeId,
              floor: f.floor ?? '',
              how_to_access: f.howToAccess ?? null,
              description: f.description ?? null,
              has_diaper_changing_station: !!f.hasDiaperChangingStation,
              has_lactation_room: !!f.hasLactationRoom,
              created_by: f.createdBy,
              created_at: f.createdAt?.toISOString?.() ?? String(f.createdAt ?? ''),
            }));
          }

          if (!facilityTypesData.length && Array.isArray(types)) {
            facilityTypesData = types.map((t: any) => ({ id: t.id, name: t.name }));
          }
        }
      }
    } catch (e) {
      console.error('Supabase fetch failed, falling back to local DB:', e);
      // fallthrough to local
    }
  }

  if (!locationsData.length && !facilitiesData.length && !facilityTypesData.length) {
    // Build-time (static generation) has no runtime. Avoid DB initialization.
    if (!process.env.NEXT_RUNTIME) {
      return (
        <HomePage
          locationsData={[]}
          facilitiesData={[]}
          facilityTypesData={[]}
        />
      );
    }

    // Local dev: PGlite/Postgres via Drizzle (dynamic import avoids top-level init during build)
    const { db } = await import('@/libs/DB');
    // Map camelCase DB rows from Drizzle to snake_case API types expected by HomePage.
    const [locs, facs, types] = await Promise.all([
      db.select().from(locations),
      db.select().from(facilities),
      db.select().from(facilityTypes),
    ]);

    locationsData = locs.map((l: any) => ({
      id: l.id,
      building: l.building ?? undefined,
      block: l.block ?? undefined,
      road: l.road ?? undefined,
      address: l.address,
      latitude: typeof l.latitude === 'string' ? Number(l.latitude) : l.latitude,
      longitude: typeof l.longitude === 'string' ? Number(l.longitude) : l.longitude,
      opensAt: l.opensAt ?? undefined,
      closesAt: l.closesAt ?? undefined,
    }));

    facilitiesData = facs.map((f: any) => ({
      id: f.id,
      location_id: f.locationId,
      facility_type_id: f.facilityTypeId,
      floor: f.floor ?? '',
      how_to_access: f.howToAccess ?? null,
      description: f.description ?? null,
      has_diaper_changing_station: !!f.hasDiaperChangingStation,
      has_lactation_room: !!f.hasLactationRoom,
      created_by: f.createdBy,
      created_at: f.createdAt?.toISOString?.() ?? String(f.createdAt ?? ''),
    }));

    facilityTypesData = types.map((t: any) => ({ id: t.id, name: t.name }));

    // No-op
  }

  return (
    <HomePage
      locationsData={locationsData || []}
      facilitiesData={facilitiesData || []}
      facilityTypesData={facilityTypesData || []}
    />
  );
}
