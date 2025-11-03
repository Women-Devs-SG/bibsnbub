import type { Address } from '@/types/Address';
import type { OneMapResult } from '@/types/OneMap';

export function mapOneMapToAddress(result: OneMapResult): Address {
  return {
    building: result.BUILDING !== 'NIL' ? result.BUILDING : null,
    block: result.BLK_NO !== 'NIL' ? result.BLK_NO : null,
    road: result.ROAD_NAME,
    address: result.ADDRESS,
    postalCode: result.POSTAL,
    latitude: Number.parseFloat(result.LATITUDE),
    longitude: Number.parseFloat(result.LONGITUDE),
    opensAt: null,
    closesAt: null,
  };
}
