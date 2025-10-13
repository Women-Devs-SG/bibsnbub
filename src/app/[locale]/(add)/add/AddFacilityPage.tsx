'use client';

import type { TimeRange } from '@/types/TimeRange';
import type { LocalUpload } from './steps/UploadFacilityImages';

import NavigationButtons from '@/components/NavigationButtons';
import ProgressBar from '@/components/ProgressBar';
import { uploadFacilityImages } from '@/utils/images';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddFacilityDetails from './steps/AddFacilityDetails';
import ConfirmationStep from './steps/ConfirmationStep';
import SelectAmenities from './steps/SelectAmenities';
import SelectFacilityType from './steps/SelectFacilityType';
import SelectLocation from './steps/SelectLocation';
import UploadFacilityImages from './steps/UploadFacilityImages';

type AddFacilityPageProps = {
  facilityTypes: { id: string; name: string }[];
  amenities: { id: string; name: string }[];
};

export default function AddFacilityPage({ amenities, facilityTypes }: AddFacilityPageProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amenities: [] as string[],
    amenityQuantities: {} as Record<string, number>,
    facilityTypeId: '',
    building: '',
    block: '',
    road: '',
    address: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    floor: '',
    description: '',
    openingHours: ['10:00:00', '22:00:00'] as TimeRange,
    hasDiaperChangingStation: false,
    hasLactationRoom: false,
    howToAccess: '',
    femalesOnly: false,
  });

  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : Array.isArray(params?.locale) ? params?.locale?.[0] : 'en';
  const [images, setImages] = useState<LocalUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in'); // Redirect to the sign-in page
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('add-facility-form');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.formData) {
          setFormData(parsed.formData);
        }
        if (Array.isArray(parsed?.images)) {
          setImages(parsed.images);
        }
        if (typeof parsed?.step === 'number') {
          setStep(parsed.step);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.setItem('add-facility-form', JSON.stringify({ formData, images, step }));
    } catch {}
  }, [formData, images, step]);

  const handleFinalSubmit = async () => {
    if (isSubmitting) {
      return; // prevent duplicate clicks
    }
    if (!userId) {
      toast.error('User ID is required to submit the form.');
      return;
    }

    try {
      toast.loading('Submitting facility…');
      setIsSubmitting(true);
      const response = await fetch('/api/submitFacility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData, userId }),
      });

      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();
      let result: any = null;
      if (contentType.includes('application/json')) {
        try {
          result = JSON.parse(raw);
        } catch (e) {
          console.error('Failed to parse JSON response:', raw, e);
          toast.error('Server returned an unexpected response. Please try again.');
          return;
        }
      } else {
        console.error('Non-JSON response:', raw);
        toast.error('Server error. Please try again.');
        return;
      }

      if (response.ok && result.success) {
        toast.success(result.message);
        // Upload images after facility is created
        if (result.facilityId && images.length > 0) {
          try {
            await uploadFacilityImages(result.facilityId, images);
          } catch (e) {
            console.error('Failed to upload images', e);
          }
        }
        // clear cached state for the wizard
        try {
          sessionStorage.removeItem('add-facility-form');
        } catch {}
        // navigate back to localized explore home with a cache-busting query param and refresh data
        router.push(`/${locale}?t=${Date.now()}`);
        router.refresh();
      } else {
        toast.warning(result.message || 'Failed to submit the facility.');
      }
    } catch (err) {
      console.error('Error submitting facility:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      // Dismiss any loading toast(s)
      try {
        toast.dismiss();
      } catch {}
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <SelectFacilityType facilityTypeId={formData.facilityTypeId} setFacilityTypeId={id => setFormData(prev => ({ ...prev, facilityTypeId: id }))} facilityTypes={facilityTypes} />;
      case 2:
        return <SelectLocation formData={formData} setFormData={setFormData} />;
      case 3:
        return <AddFacilityDetails formData={formData} setFormData={setFormData} />;
      case 4:
        return (
          <UploadFacilityImages
            images={images}
            setImagesAction={updater => setImages(prev => updater(prev))}
          />
        );
      case 5:
        return <SelectAmenities formData={formData} setFormData={setFormData} amenities={amenities} />;
      case 6:
        return (
          <ConfirmationStep
            formData={formData}
            onSubmit={handleFinalSubmit}
            facilityTypes={facilityTypes}
            amenities={amenities}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add a New Facility</h1>
      <ProgressBar currentStep={step} totalSteps={6} />
      {renderStep()}
      <NavigationButtons
        currentStep={step}
        totalSteps={6}
        onNext={() => setStep(prev => prev + 1)}
        onBack={() => setStep(prev => prev - 1)}
      />
    </div>
  );
}
