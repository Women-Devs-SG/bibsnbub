'use client';

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
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    setIsSubmitting(true);
    setSubmitError(null); // Clear any previous errors

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
          const errorMsg = 'Server returned an unexpected response. Please try again.';
          setSubmitError(errorMsg);
          toast.error(errorMsg);
          return;
        }
      } else {
        console.error('Non-JSON response:', raw);
        const errorMsg = 'Server error. Please try again.';
        setSubmitError(errorMsg);
        toast.error(errorMsg);
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
            toast.error('Facility created, but failed to upload images. Please try again later.');
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
        const errorMsg = result.message || 'Failed to submit the facility. Please try again.';
        setSubmitError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error submitting facility:', err);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
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
            facilityTypes={facilityTypes}
            amenities={amenities}
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
      {submitError && step === 6 && (
        <div className="mt-4 p-4 border border-destructive bg-destructive/10 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">Submission Failed</h4>
              <p className="text-sm text-destructive/90">{submitError}</p>
            </div>
          </div>
        </div>
      )}
      {step === 6
        ? (
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                {isSubmitting
                  ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    )
                  : submitError
                    ? (
                        'Retry Submission'
                      )
                    : (
                        'Submit'
                      )}
              </button>
            </div>
          )
        : (
            <NavigationButtons
              currentStep={step}
              totalSteps={6}
              onNext={() => setStep(prev => prev + 1)}
              onBack={() => setStep(prev => prev - 1)}
            />
          )}
    </div>
  );
}
