import type { TimeRange } from '@/types/TimeRange';
import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { getTranslations } from 'next-intl/server';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toRadians = (deg: number) => (deg * Math.PI) / 180;

export const calculateDistance = (userLat: number, userLon: number, locLat: number, locLon: number) => {
  const R = 6371; // Earth's radius in KM
  const dLat = toRadians(locLat - userLat);
  const dLon = toRadians(locLon - userLon);
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(locLat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1) * Math.cos(lat2)
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export async function fetchTranslations(locale: string) {
  return await getTranslations({ locale, namespace: 'Index' });
}

export const handleUseCurrentLocation = async (
  onLocationSuccess: (latitude: number, longitude: number) => void,
  onLocationError?: () => void,
) => {
  if (!navigator.geolocation) {
    toast.warning('Geolocation Not Supported', {
      description: 'Geolocation is not supported by your browser.',
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      onLocationSuccess(latitude, longitude);
      toast.success('Location Updated', {
        description: 'Your location has been updated to your current location.',
      });
    },
    (error) => {
      console.error('Error fetching current location:', error);
      toast.warning('Error', {
        description: 'Unable to retrieve your location. Please try again.',
        action: {
          label: 'Try Again',
          onClick: () => {
            if (onLocationError) {
              onLocationError();
            }
          },
        },
      });
    },
  );
};

const RE_TIME_24 = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const RE_TIME_12 = /^(0?[1-9]|1[0-2]):([0-5]\d)(?::([0-5]\d))?\s*([AP])\.?M\.?$/i;

function parseStringToHHMMSS(s: string): [string, string, string] | null {
  const t = s.trim();

  // Try 24-hour first
  let m = t.match(RE_TIME_24);
  if (m) {
    const [h24 = '00', mm = '00', ss = '00'] = m.slice(1);
    return [h24, mm, ss];
  }

  // Then 12-hour with AM/PM
  m = t.match(RE_TIME_12);
  if (m) {
    const [h12 = '12', mm = '00', ss = '00', mer = 'a'] = m.slice(1);
    const h24 = String((Number.parseInt(h12) % 12) + (mer.toUpperCase() === 'A' ? 0 : 12));
    return [h24, mm, ss];
  }

  return null;
}

export function parseStringToTime(s: string): string | null {
  const m = parseStringToHHMMSS(s);
  const p = (s: any) => String(s).padStart(2, '0');
  return m ? `${p(m[0])}:${p(m[1])}:${p(m[2])}` : null;
}

export function parseTimeToSeconds(t: string | null): number | null {
  if (!t) {
    return null;
  }
  const m = parseStringToHHMMSS(t);
  const p = Number.parseInt;
  return m ? p(m[0]) * 3600 + p(m[1]) * 60 + p(m[2]) : null;
}

export function formatTime(t: string) {
  // Expect HH:MM:SS
  const m = RE_TIME_24.exec(t);
  if (!m) {
    throw new Error('Invalid 24h time (expected HH:MM:SS)');
  }
  const [hh = '00', mm = '00'] = m.slice(1);
  const h24 = Number.parseInt(hh);
  const h12 = h24 % 12 || 12;
  const mer = h24 < 12 ? 'A' : 'P';
  return `${h12}${mm === '00' ? '' : `:${mm}`} ${mer}M`;
}

export function formatTimeRange([t0, t1]: TimeRange) {
  if (t0 && t1) {
    return `${formatTime(t0)} - ${formatTime(t1)}`;
  }
  return '-';
}

export function nowInTimeRange([t0, t1]: TimeRange) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startTime = new Date(Number(startOfDay) + parseTimeToSeconds(t0)! * 1000);
  const endTime = new Date(Number(startOfDay) + parseTimeToSeconds(t1)! * 1000);

  return now >= startTime && now <= endTime;
}
