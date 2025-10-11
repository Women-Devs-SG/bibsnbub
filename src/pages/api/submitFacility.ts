import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/libs/DB';
import { facilities as facilitiesTable, facilityAmenities as facilityAmenitiesTable, locations as locationsTable } from '@/models/Schema';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Create a Supabase client suitable for Pages API routes (no next/headers cookies)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = url && key
      ? createSupabaseClient(url, key, {
          auth: { persistSession: false, detectSessionInUrl: false },
        })
      : null;

    const { formData, userId } = req.body || {};
    if (!formData || !userId) {
      return res.status(400).json({ success: false, message: 'Missing formData or userId' });
    }

    if (supabase) {
      // ------- Supabase path (production) -------
      const { data: existingLocation, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('address', formData.address)
        .single();

      if (locationError && (locationError as any).code !== 'PGRST116') {
        console.error('Error checking location:', locationError.message);
        return res.status(500).json({ success: false, message: 'Failed to check the location.' });
      }

      let locationId = existingLocation?.id as number | undefined;
      if (!locationId) {
        const { data: newLocation, error: newLocationError } = await supabase
          .from('locations')
          .insert({
            building: formData.building,
            block: formData.block,
            road: formData.road,
            address: formData.address,
            postal_code: formData.postalCode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            opens_at: formData.openingHours[0],
            closes_at: formData.openingHours[1],
          })
          .select('id')
          .single();

        if (newLocationError) {
          console.error('Error creating location:', newLocationError.message);
          return res.status(500).json({ success: false, message: 'Failed to create the location.' });
        }

        locationId = newLocation?.id as number | undefined;
      }

      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .insert({
          location_id: locationId,
          facility_type_id: formData.facilityTypeId,
          floor: formData.floor,
          description: formData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          has_diaper_changing_station: formData.hasDiaperChangingStation,
          has_lactation_room: formData.hasLactationRoom,
          how_to_access: formData.howToAccess,
          females_only: formData.femalesOnly,
          created_by: userId,
        })
        .select('id')
        .single();

      if (facilityError) {
        console.error('Error inserting facility:', facilityError.message);
        return res.status(500).json({ success: false, message: 'Failed to submit the facility.' });
      }

      const facilityId = facilityData?.id as number | undefined;

      const amenityInserts = (formData.amenities || []).map((amenityId: string) => ({
        facility_id: facilityId,
        amenity_id: amenityId,
        quantity: Number(formData?.amenityQuantities?.[amenityId] ?? 1) || 1,
      }));

      if (amenityInserts.length > 0) {
        const { error: amenitiesError } = await supabase
          .from('facility_amenities')
          .insert(amenityInserts);

        if (amenitiesError) {
          console.error('Error inserting facility amenities:', amenitiesError.message);
          return res.status(500).json({ success: false, message: 'Failed to submit the facility amenities.' });
        }
      }

      return res.status(200).json({ success: true, message: 'Facility added successfully!', facilityId });
    }

    // ------- Local dev path (Drizzle using PGlite/PG) -------
    // 1) Ensure location exists
    const existing = await db.select({ id: locationsTable.id })
      .from(locationsTable)
      .where(eq(locationsTable.address, formData.address))
      .limit(1);
    let locationId = existing[0]?.id as number | undefined;
    if (!locationId) {
      const inserted = await db.insert(locationsTable).values({
        building: formData.building || null,
        block: formData.block || null,
        road: formData.road,
        address: formData.address,
        postalCode: formData.postalCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        opensAt: formData.openingHours[0],
        closesAt: formData.openingHours[1],
      }).returning({ id: locationsTable.id });
      locationId = inserted[0]?.id as number | undefined;
    }

    if (!locationId) {
      return res.status(500).json({ success: false, message: 'Failed to resolve location.' });
    }

    // 2) Insert facility
    const insertedFacility = await db.insert(facilitiesTable).values({
      locationId,
      facilityTypeId: Number(formData.facilityTypeId),
      floor: formData.floor || null,
      description: formData.description || null,
      hasDiaperChangingStation: !!formData.hasDiaperChangingStation,
      hasLactationRoom: !!formData.hasLactationRoom,
      howToAccess: formData.howToAccess || null,
      femalesOnly: !!formData.femalesOnly,
      createdBy: String(userId),
    }).returning({ id: facilitiesTable.id });

    const facilityId = insertedFacility[0]?.id as number | undefined;
    if (!facilityId) {
      return res.status(500).json({ success: false, message: 'Failed to create facility.' });
    }

    // 3) Insert amenities if any (id must be numeric)
    const amenityIds = (formData.amenities || []).map((a: string) => Number(a)).filter((n: any) => Number.isFinite(n));
    if (amenityIds.length > 0) {
      await db.insert(facilityAmenitiesTable).values(
        amenityIds.map((amenityId: number) => ({
          facilityId,
          amenityId,
          quantity: Number(formData?.amenityQuantities?.[String(amenityId)] ?? 1) || 1,
        })),
      );
    }

    return res.status(200).json({ success: true, message: 'Facility added successfully!', facilityId });
  } catch (err) {
    console.error('Unexpected error in submitFacility (pages route):', err);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}
