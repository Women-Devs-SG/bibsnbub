import { cn, formatTime, formatTimeRange, nowInTimeRange } from '@/lib/utils';
import { Timer, TimerOff } from 'lucide-react';
import { useEffect, useState } from 'react';

type OperatingHoursProps = {
  opensAt: string;
  closesAt: string;
  exact?: boolean;
  className?: string;
};

export const OperatingHours: React.FC<OperatingHoursProps> = ({ opensAt, closesAt, exact, className }) => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isMounted || !opensAt || !closesAt) {
    return null;
  }

  const isOpenNow = nowInTimeRange([opensAt, closesAt]);
  const Icon = exact || isOpenNow ? Timer : TimerOff;

  return (
    <p className={cn('flex items-center', className)}>
      <Icon className="size-4 mr-1" />
      {exact
        ? formatTimeRange([opensAt, closesAt])
        : isOpenNow
          ? `Open until ${formatTime(closesAt)}`
          : `Opens at ${formatTime(opensAt)}`}
    </p>
  );
};

export default OperatingHours;
