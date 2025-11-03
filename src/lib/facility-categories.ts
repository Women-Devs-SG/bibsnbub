export const FACILITY_CATEGORY_META = {
  diaper: {
    label: 'Diaper Changing Station',
    filterKey: 'has_diaper_changing_station',
  },
  lactation: {
    label: 'Lactation Room',
    filterKey: 'has_lactation_room',
  },
} as const;

export type FacilityCategorySlug = keyof typeof FACILITY_CATEGORY_META;

export const FACILITY_CATEGORY_SLUGS = Object.keys(FACILITY_CATEGORY_META) as FacilityCategorySlug[];

export const getCategoryLabel = (slug: FacilityCategorySlug | null | undefined) =>
  slug ? FACILITY_CATEGORY_META[slug]?.label ?? null : null;

export const getCategoryFilterKey = (slug: FacilityCategorySlug | null | undefined) =>
  slug ? FACILITY_CATEGORY_META[slug]?.filterKey ?? null : null;
