import type { TimeRange } from '@/types/TimeRange';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, parseStringToTime, parseTimeToSeconds } from '@/lib/utils';
import { useEffect, useMemo } from 'react';

type TimeRangeValidationError =
  | 'invalidTime'
  | 'minTime'
  | 'maxTime'
  | 'step'
  | 'invalidRange'
  | 'shouldDisableTime';

export type TimeRangePickerProps = {
  /** Controlled current value */
  value: TimeRange;
  /** Controlled change handler */
  onChange: (newValue: TimeRange) => void;
  /** Optional error callback, called whenever validation changes */
  onError?: (
    errors: [TimeRangeValidationError | null, TimeRangeValidationError | null]
  ) => void;
  minutesStep?: number; // default 1
  secondsStep?: number; // overrides minutesStep if provided
  minTime?: string;
  maxTime?: string;
  shouldDisableTime?: (
    value: number, // 0–23 for hours, 0–59 for minutes/seconds
    view: 'hours' | 'minutes' | 'seconds',
    field: 'start' | 'end'
  ) => boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputContainerClassName?: string;
  startId?: string;
  startName?: string;
  startLabel?: string;
  startLabelClassName?: string;
  startInputClassName?: string;
  separator?: string;
  endId?: string;
  endName?: string;
  endLabel?: string;
  endLabelClassName?: string;
  endInputClassName?: string;
};

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  onError,
  minutesStep,
  secondsStep,
  minTime,
  maxTime,
  shouldDisableTime,
  disabled,
  readOnly,
  className,
  inputContainerClassName,
  startId = 'time-start',
  startName,
  startLabel = 'Start time',
  startLabelClassName,
  startInputClassName,
  separator = '–',
  endId = 'time-end',
  endName,
  endLabel = 'End time',
  endLabelClassName,
  endInputClassName,
}) => {
  const stepSec = stepFrom(minutesStep, secondsStep);

  const [startErr, endErr] = useMemo(
    () => validatePair(value, { minTime, maxTime, stepSec, shouldDisableTime }),
    [value, minTime, maxTime, stepSec, shouldDisableTime],
  );

  useEffect(() => {
    onError?.([startErr, endErr]);
  }, [startErr, endErr, onError]);

  return (
    <div className={cn('flex gap-3', className)}>
      <div className={cn('min-w-[140px] flex-1', inputContainerClassName)}>
        <Label htmlFor={startId} className={cn('mb-1', startLabelClassName)}>{startLabel}</Label>
        <Input
          id={startId}
          name={startName}
          type="time"
          step={stepSec}
          value={value[0] ?? ''}
          onChange={e => onChange([parseStringToTime(e.target.value), value[1]])}
          min={minTime}
          max={maxTime}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            startErr && 'border-destructive focus-visible:ring-destructive',
            startInputClassName,
          )}
        />
        {startErr && (
          <small className="text-destructive">{errorMessage(startErr)}</small>
        )}
      </div>

      <div className="pt-6">
        <span className="text-muted-foreground">{separator}</span>
      </div>

      <div className={cn('min-w-[140px] flex-1', inputContainerClassName)}>
        <Label htmlFor={endId} className={cn('mb-1', endLabelClassName)}>{endLabel}</Label>
        <Input
          id={endId}
          name={endName}
          type="time"
          step={stepSec}
          value={value[1] ?? ''}
          onChange={e => onChange([value[0], parseStringToTime(e.target.value)])}
          min={minTime}
          max={maxTime}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            endErr && 'border-destructive focus-visible:ring-destructive',
            endInputClassName,
          )}
        />
        {endErr && <small className="text-destructive">{errorMessage(endErr)}</small>}
      </div>
    </div>
  );
};

function stepFrom(minutesStep?: number, secondsStep?: number) {
  if (typeof secondsStep === 'number') {
    return Math.max(1, Math.floor(secondsStep));
  }
  const mins = typeof minutesStep === 'number' ? minutesStep : 1;
  return Math.max(1, Math.floor(mins * 60)); // seconds
}

function validatePair(
  [start, end]: TimeRange,
  {
    minTime,
    maxTime,
    shouldDisableTime,
    stepSec,
  }: {
    minTime?: string;
    maxTime?: string;
    shouldDisableTime?: (
      value: number, // 0–23 for hours, 0–59 for minutes/seconds
      view: 'hours' | 'minutes' | 'seconds',
      field: 'start' | 'end'
    ) => boolean;
    stepSec: number;
  },
): [TimeRangeValidationError | null, TimeRangeValidationError | null] {
  const s = parseTimeToSeconds(start);
  const e = parseTimeToSeconds(end);
  const minS = parseTimeToSeconds(minTime ?? null);
  const maxS = parseTimeToSeconds(maxTime ?? null);

  const startErr
    = start && s === null
      ? 'invalidTime'
      : typeof s === 'number' && minS !== null && s < minS
        ? 'minTime'
        : typeof s === 'number' && s % stepSec !== 0
          ? 'step'
          : typeof s === 'number'
            && (shouldDisableTime?.(Math.floor(s / 3600), 'hours', 'start')
              || shouldDisableTime?.(Math.floor((s % 3600) / 60), 'minutes', 'start')
              || shouldDisableTime?.(s % 60, 'seconds', 'start'))
            ? 'shouldDisableTime'
            : null;

  const endErr
    = end && e === null
      ? 'invalidTime'
      : typeof e === 'number' && maxS !== null && e > maxS
        ? 'maxTime'
        : typeof e === 'number' && e % stepSec !== 0
          ? 'step'
          : typeof e === 'number'
            && (shouldDisableTime?.(Math.floor(e / 3600), 'hours', 'end')
              || shouldDisableTime?.(Math.floor((e % 3600) / 60), 'minutes', 'end')
              || shouldDisableTime?.(e % 60, 'seconds', 'end'))
            ? 'shouldDisableTime'
            : null;

  if (!startErr && !endErr && typeof s === 'number' && typeof e === 'number' && s > e) {
    return [startErr, 'invalidRange'];
  }

  return [startErr, endErr];
}

function errorMessage(err: TimeRangeValidationError | null) {
  switch (err) {
    case 'invalidTime':
      return 'Invalid time';
    case 'minTime':
      return 'Before minimum time';
    case 'maxTime':
      return 'After maximum time';
    case 'step':
      return 'Not aligned to step';
    case 'invalidRange':
      return 'End must be after start';
    case 'shouldDisableTime':
      return 'Time not allowed';
    default:
      return null;
  }
}

export default TimeRangePicker;
