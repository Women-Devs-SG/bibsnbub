import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatTimeRange } from '@/lib/utils';
import React from 'react';

type ConfirmationStepProps = {
  formData: any;
  onSubmit: () => void;
  facilityTypes: { id: string; name: string }[];
  amenities: { id: string; name: string }[];
  isSubmitting?: boolean;
};

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b last:border-b-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right break-words">{value || '-'}</span>
  </div>
);

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ formData, onSubmit, facilityTypes, amenities: amenitiesMaster, isSubmitting }) => {
  const {
    facilityTypeId,
    building,
    block,
    road,
    address,
    postalCode,
    floor,
    description,
    openingHours,
    howToAccess,
    femalesOnly,
    amenities,
  } = formData || {};

  const addressLine = building || block ? [building, block && `${block} ${road || ''}`.trim()].filter(Boolean).join(' • ') : address;
  const facilityTypeName = facilityTypes.find(ft => String(ft.id) === String(facilityTypeId))?.name || '—';
  const amenityEntries: { id: string; name: string; qty: number }[] = Array.isArray(amenities)
    ? amenities
        .map((id: string) => ({
          id: String(id),
          name: amenitiesMaster.find(a => String(a.id) === String(id))?.name || '',
        }))
        .filter(a => !!a.name)
        .map(a => ({ ...a, qty: Number(formData?.amenityQuantities?.[a.id] ?? 1) }))
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Review and Confirm</h2>
      <p className="text-sm text-muted-foreground">Please review the details below. If everything looks good, submit your facility.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Location</h3>
          <Row label="Address" value={addressLine} />
          <Row label="Postal Code" value={postalCode} />
          <Row label="Opening Hours" value={formatTimeRange(openingHours)} />
        </Card>

        {/* Facility */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Facility</h3>
          <Row
            label="Floor"
            value={floor ? <Badge>{floor}</Badge> : '-'}
          />
          <Row label="Type" value={facilityTypeName} />
          <Row label="Females Only" value={femalesOnly ? 'Yes' : 'No'} />
          <Row label="How to Access" value={howToAccess} />
        </Card>

        {/* Amenities */}
        <Card className="p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Amenities</h3>
          {amenityEntries.length > 0
            ? (
                <div className="flex flex-wrap gap-2">
                  {amenityEntries.map(a => (
                    <Badge key={a.id} variant="outline">
                      {a.name}
                      {a.qty > 0 ? ` (x${a.qty})` : ''}
                    </Badge>
                  ))}
                </div>
              )
            : (
                <p className="text-sm text-muted-foreground">No amenities selected.</p>
              )}
        </Card>

        {/* Description */}
        <Card className="p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm whitespace-pre-wrap">{description || '—'}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button onClick={onSubmit} disabled={!!isSubmitting} aria-busy={!!isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
