'use client';

import type { FacilityCategorySlug } from '@/lib/facility-categories';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { bottleBaby } from '@lucide/lab';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import { Baby, Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Category = {
  name: string;
  label: string;
  icon: React.ReactNode;
  value: FacilityCategorySlug | null;
};

type CategoryScrollerProps = {
  selectedCategory: FacilityCategorySlug | null;
  onCategorySelect: (category: FacilityCategorySlug | null) => void;
};

const CategoryScroller = ({ selectedCategory, onCategorySelect }: CategoryScrollerProps) => {
  const t = useTranslations('CategoryScroller');

  const categories: Category[] = [
    {
      name: 'All',
      label: t('all'),
      icon: <Baby className="w-5 h-5 text-gray-500" />,
      value: null,
    },
    {
      name: 'Diaper Changing Station',
      label: t('diaper_changing_station'),
      icon: <BabyChangingStationIcon fontSize="small" />,
      value: 'diaper',
    },
    {
      name: 'Lactation Room',
      label: t('lactation_room'),
      icon: <Icon iconNode={bottleBaby} className="w-5 h-5" />,
      value: 'lactation',
    },
  ];

  const handleCategoryClick = (category: Category) => {
    const isActive = selectedCategory === category.value || (!selectedCategory && category.value === null);
    const newCategory = isActive ? null : category.value;
    onCategorySelect(newCategory);
  };

  return (
    <ScrollArea className="w-full overflow-hidden">
      <div className="flex space-x-6 px-4 py-2">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md transition-all',
              (selectedCategory === category.value || (!selectedCategory && category.value === null))
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700',
            )}
            type="button"
          >
            {category.icon}
            <span className="text-sm font-medium">{category.label}</span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CategoryScroller;
