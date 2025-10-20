import { Badge } from '@/components/ui/badge';
import { cn, nowInTimeRange } from '@/lib/utils';
import { useEffect, useState } from 'react';

type OpenStatusProps = {
  opensAt: string;
  closesAt: string;
  className?: string;
};

export const OpenStatus: React.FC<OpenStatusProps> = ({ opensAt, closesAt, className }) => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isMounted || !opensAt || !closesAt) {
    return null;
  }

  if (nowInTimeRange([opensAt, closesAt])) {
    return <Badge className={cn('bg-green-500', className)}>Open Now</Badge>;
  }

  return <Badge variant="secondary" className={className}>Closed</Badge>;
};

export default OpenStatus;
