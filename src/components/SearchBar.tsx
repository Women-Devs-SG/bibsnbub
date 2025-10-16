'use client';

import type { Address } from '@/types/Address';
import type { OneMapApiResponse } from '@/types/OneMap';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Navigation, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type SearchBarProps = {
  onSearchAction: (locationDetails: Address) => void;
  onUseCurrentLocationAction: () => void;
  initialLocation?: Address;
};

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchAction, onUseCurrentLocationAction, initialLocation }) => {
  const t = useTranslations();
  const [location, setLocation] = useState<string>(initialLocation?.address || ''); // Initialize with initialLocation if provided
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const triggerInputRef = useRef<HTMLInputElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);

  const authToken = process.env.ONEMAP_API_KEY || '';

  const moveCaretToEndIfFullySelected = (inputElement: HTMLInputElement | null) => {
    if (!inputElement) {
      return;
    }

    const { selectionStart, selectionEnd, value } = inputElement;
    const isFullySelected
      = selectionStart === 0 && selectionEnd === value.length && value.length > 0;

    if (!isFullySelected) {
      return;
    }

    requestAnimationFrame(() => {
      const nextValueLength = inputElement.value.length;
      inputElement.setSelectionRange(nextValueLength, nextValueLength);
    });
  };

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation.address || '');
    }
  }, [initialLocation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const inputElement = dialogInputRef.current;

    if (!inputElement || document.activeElement !== inputElement) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      moveCaretToEndIfFullySelected(inputElement);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, location]);

  const fetchSuggestions = async (query: string): Promise<Address[]> => {
    if (!query.trim()) {
      setSuggestions([]);
      return [];
    }

    try {
      const response = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
        {
          method: 'GET',
          headers: {
            Authorization: authToken,
          },
        },
      );
      const data: OneMapApiResponse = await response.json();

      if (data.results) {
        const mappedSuggestions = data.results.map((result: any) => ({
          building: result.BUILDING || '',
          block: result.BLK_NO || '',
          road: result.ROAD_NAME || '',
          address: result.ADDRESS || '',
          postalCode: result.POSTAL || '',
          latitude: Number.parseFloat(result.LATITUDE),
          longitude: Number.parseFloat(result.LONGITUDE),
          opensAt: null,
          closesAt: null,
        }));
        setSuggestions(mappedSuggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
    return [];
  };

  const handleSuggestionClick = (locationDetails: Address) => {
    setLocation(locationDetails.address);
    setIsUsingCurrentLocation(false);
    onSearchAction(locationDetails);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    setLocation(t('SearchBar.your_location'));
    setIsUsingCurrentLocation(true);
    onUseCurrentLocationAction();
    setIsOpen(false);
  };

  const clearInput = () => {
    setLocation('');
    setSuggestions([]);
    setIsUsingCurrentLocation(false);
  };

  return (
    <div className="relative w-full max-w-3xl">
      {/* Search Bar */}
      <Command className="rounded-lg border shadow-md md:min-w-[450px]" onClick={() => setIsOpen(true)}>
        <CommandInput
          ref={triggerInputRef}
          placeholder={t('SearchBar.placeholder')}
          value={location}
          onValueChange={(value: string) => {
            setLocation(value);
            fetchSuggestions(value);
            setIsOpen(true);
            setIsUsingCurrentLocation(false);
            moveCaretToEndIfFullySelected(triggerInputRef.current);
          }}
          className={`w-full border-none focus:ring-0 ${
            isUsingCurrentLocation ? 'text-blue-400' : ''
          }`}
        />
      </Command>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          ref={dialogInputRef}
          placeholder={t('SearchBar.placeholder')}
          value={location}
          onValueChange={(value: string) => {
            setLocation(value);
            fetchSuggestions(value);
            setIsUsingCurrentLocation(false);
            moveCaretToEndIfFullySelected(dialogInputRef.current ?? triggerInputRef.current);
          }}
        />
        <CommandList>
          <div className="px-2 py-1">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-gray-100"
              onClick={clearInput}
            >
              <SearchX className="h-4 w-4 text-gray-500" />
              <span>{t('SearchBar.clear_location')}</span>
            </button>
            {location.trim() === '' && (
              <button
                type="button"
                className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-gray-100"
                onClick={handleUseCurrentLocation}
              >
                <Navigation className="h-4 w-4 text-gray-500" />
                <span>{t('SearchBar.use_current_location')}</span>
              </button>
            )}
          </div>

          <CommandGroup heading={t('SearchBar.suggestions')}>
            {suggestions.length > 0
              ? (
                  suggestions.map(suggestion => (
                    <CommandItem
                      key={suggestion.address}
                      onSelect={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-gray-100"
                    >
                      {suggestion.address}
                    </CommandItem>
                  ))
                )
              : (
                  <CommandEmpty>{t('SearchBar.no_results')}</CommandEmpty>
                )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default SearchBar;
