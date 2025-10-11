import { formatTime, nowInTimeRange } from '@/lib/utils';
import { Timer, TimerOff } from 'lucide-react';
import { useEffect, useState } from 'react';

type OperatingHoursProps = {
  opensAt: string;
  closesAt: string;
};

export const OperatingHours: React.FC<OperatingHoursProps> = ({ opensAt, closesAt }) => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isMounted || !opensAt || !closesAt) {
    return null;
  }

  if (nowInTimeRange([opensAt, closesAt])) {
    return (
      <p className="flex items-center">
        <Timer className="size-4 mr-1" />
        {`Open until ${formatTime(closesAt)}`}
      </p>
    );
  }

  return (
    <p className="flex items-center">
      <TimerOff className="size-4 mr-1" />
      {`Opens at ${formatTime(opensAt)}`}
    </p>
  );
};

export default OperatingHours;
