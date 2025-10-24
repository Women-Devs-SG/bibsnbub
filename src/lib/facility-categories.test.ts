import { describe, expect, it } from 'vitest';

import { FACILITY_CATEGORY_SLUGS, getCategoryFilterKey } from './facility-categories';

describe('facility-categories', () => {
  it('exposes the supported category slugs in order', () => {
    expect(FACILITY_CATEGORY_SLUGS).toEqual(['diaper', 'lactation']);
  });

  it('provides the correct filter key for each slug', () => {
    expect(getCategoryFilterKey('diaper')).toBe('has_diaper_changing_station');
    expect(getCategoryFilterKey('lactation')).toBe('has_lactation_room');
    expect(getCategoryFilterKey(null)).toBeNull();
    expect(getCategoryFilterKey(undefined)).toBeNull();
  });
});
