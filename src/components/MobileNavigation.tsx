'use client';
import { Globe, Home, MapPinPlus, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type MobileNavigationProps = {
  isLoggedIn: boolean;
  currentLocale: string;
  availableLocales: string[];
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isLoggedIn,
  currentLocale = 'en', // Default to 'en' if currentLocale is undefined
  availableLocales,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const t = useTranslations();

  const handleLocaleChange = (locale: string) => {
    router.push(`/${locale}`);
    setLocaleMenuOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-md md:hidden">
      <div className="flex justify-around items-center h-16 relative">
        {/* Explore Link */}
        <Link
          href="/"
          className={`flex flex-col items-center ${
            pathname === '/explore' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="text-sm">{t('Navigation.explore')}</span>
        </Link>

        {/* Locale Selector */}
        <div className="relative">
          <button
            type="button"
            aria-label="Language Switcher"
            className="flex flex-col items-center text-gray-500"
            onClick={() => setLocaleMenuOpen(!localeMenuOpen)}
          >
            <Globe className="h-6 w-6" />
            <span className="text-sm">{currentLocale?.toUpperCase()}</span>
          </button>

          {localeMenuOpen && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg">
              {availableLocales.map(locale => (
                <button
                  key={locale}
                  type="button"
                  className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 ${
                    locale === currentLocale ? 'font-bold' : ''
                  }`}
                  onClick={() => handleLocaleChange(locale)}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add */}
        <Link
          href={isLoggedIn ? '/add' : '/sign-in'}
          className={`flex flex-col items-center ${
            pathname === '/add' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <MapPinPlus className="h-6 w-6" />
          <span className="text-sm">{t('Navigation.add_new')}</span>
        </Link>

        {/* User Link */}
        <Link
          href={isLoggedIn ? '/user-profile' : '/sign-in'}
          className={`flex flex-col items-center ${
            pathname === (isLoggedIn ? '/user-profile' : '/sign-in')
              ? 'text-blue-500'
              : 'text-gray-500'
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-sm">{isLoggedIn ? t('Navigation.user_profile_link') : t('Navigation.sign_in')}</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNavigation;
