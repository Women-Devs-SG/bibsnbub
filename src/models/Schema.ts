import { boolean, integer, numeric, pgTable, primaryKey, serial, text, time, timestamp, varchar } from 'drizzle-orm/pg-core';

// --- Location Table ---
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  building: varchar('building', { length: 255 }),
  block: varchar('block', { length: 50 }),
  road: varchar('road', { length: 255 }).notNull(),
  address: text('address').notNull(),
  postalCode: varchar('postal_code', { length: 10 }),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  opensAt: time('opens_at', { precision: 0, withTimezone: false }),
  closesAt: time('closes_at', { precision: 0, withTimezone: false }),
});

// --- Facility Types ---
export const facilityTypes = pgTable('facility_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  order: integer('order').default(0),
});

// --- Amenities ---
export const amenities = pgTable('amenities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isMultipleApplicable: boolean('is_multiple_applicable').default(true),
});

// --- Facilities ---
export const facilities = pgTable('facilities', {
  id: serial('id').primaryKey(),
  locationId: integer('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  facilityTypeId: integer('facility_type_id').notNull().references(() => facilityTypes.id, { onDelete: 'cascade' }),
  floor: varchar('floor', { length: 50 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  hasDiaperChangingStation: boolean('has_diaper_changing_station').default(true),
  hasLactationRoom: boolean('has_lactation_room').default(false),
  howToAccess: text('how_to_access'),
  createdBy: varchar('created_by', { length: 255 }).notNull(), // Clerk user UUID
  femalesOnly: boolean('females_only').default(false),
});

// --- Facility <-> Amenities Many-to-Many Join Table ---
export const facilityAmenities = pgTable('facility_amenities', {
  facilityId: integer('facility_id').notNull().references(() => facilities.id, { onDelete: 'cascade' }),
  amenityId: integer('amenity_id').notNull().references(() => amenities.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').default(1),
}, table => [primaryKey({ columns: [table.facilityId, table.amenityId] })]);
