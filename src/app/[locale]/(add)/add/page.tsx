import { amenities as amenitiesTable, facilityTypes as facilityTypesTable } from '@/models/Schema';
import { tryCreateClient } from '@/utils/supabase/server';
import AddFacilityPage from './AddFacilityPage';

// Use Drizzle-inferred row types to ensure strong typing
type FacilityTypeRow = typeof facilityTypesTable.$inferSelect;
type AmenityRow = typeof amenitiesTable.$inferSelect;
type SimpleOption = { id: string; name: string; slug?: string; description?: string };

export default async function Page() {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  // During static generation (build-time), avoid invoking server APIs
  const supabase = isBuild ? null : await tryCreateClient();
  let facilityTypes: SimpleOption[] | null = null;
  let amenities: SimpleOption[] | null = null;

  if (supabase) {
    const [typesRes, amenitiesRes] = await Promise.all([
      supabase
        .from('facility_types')
        .select('id, name, slug, description, order')
        .order('order', { ascending: true })
        .order('name', { ascending: true }),
      supabase.from('amenities').select('id, name'),
    ]);
    if (typesRes.error || amenitiesRes.error) {
      console.error('Error fetching data:', typesRes.error || amenitiesRes.error);
      return <div>Failed to load data. Please try again later.</div>;
    }
    facilityTypes = (typesRes.data ?? [])
      .map((t: { id: number | string; name: string; slug?: string; description?: string }) => ({ id: String(t.id), name: t.name, slug: t.slug, description: t.description }));
    amenities = (amenitiesRes.data ?? []).map((a: { id: number | string; name: string }) => ({ id: String(a.id), name: a.name }));
  } else {
    // Build-time (static generation) should avoid DB initialization.
    if (isBuild) {
      facilityTypes = [];
      amenities = [];
    } else {
      // Local dev: load from Drizzle (PGlite) via dynamic import to avoid top-level init during build
      const { db } = await import('@/libs/DB');
      const [types, ams] = await Promise.all([
        db.select().from(facilityTypesTable),
        db.select().from(amenitiesTable),
      ]);
      // Map to match expected shape
      facilityTypes = types
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
        .map((t: FacilityTypeRow) => ({ id: String(t.id), name: t.name, slug: (t as any).slug, description: (t as any).description }));
      amenities = ams.map((a: AmenityRow) => ({ id: String(a.id), name: a.name }));
    }
  }

  return (
    <AddFacilityPage
      facilityTypes={facilityTypes || []}
      amenities={amenities || []}
    />
  );
}
