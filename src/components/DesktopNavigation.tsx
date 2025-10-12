'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { Globe, MapPinPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type DesktopNavigationProps = {
  isLoggedIn: boolean;
  currentLocale: string;
  availableLocales: string[];
};

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  availableLocales,
  isLoggedIn,
  currentLocale,
}) => {
  const { user } = useUser();
  const router = useRouter();
  const t = useTranslations();

  const handleLocaleChange = (locale: string) => {
    router.push(`/${locale}`);
  };

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-800">
          {t('Navigation.logo')}
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu className="ml-auto flex items-center gap-1">

          {/* Locale Selector */}
          <NavigationMenuItem className=" list-none">
            <NavigationMenuTrigger className="flex items-center gap-2" aria-label="Language Switcher">
              <Globe className="h-5 w-5" />
              <span>{currentLocale.toUpperCase()}</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="w-[250px] gap-3 p-4 md:w-[250px] md:grid-cols-2 lg:w-[250px] ">
              {availableLocales.map(locale => (
                <NavigationMenuLink
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                >
                  {locale.toUpperCase()}
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* User Menu */}
          <NavigationMenuItem className="list-none">
            <NavigationMenuTrigger className="flex items-center">
              {isLoggedIn
                ? (
                    <>
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={user?.imageUrl ?? ''}
                          alt={user?.firstName ?? t('Navigation.guest')}
                        />
                        <AvatarFallback className="rounded-lg">?</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.firstName ?? t('Navigation.guest')}
                        </span>
                      </div>
                    </>
                  )
                : (
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg">G</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-semibold">{t('Navigation.guest')}</span>
                    </div>
                  )}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="w-[250px] gap-3 p-4 md:w-[250px] md:grid-cols-2 lg:w-[250px] ">
              {isLoggedIn
                ? (
                    <>
                      <NavigationMenuLink href="/user-profile">
                        {t('Navigation.user_profile_link')}
                      </NavigationMenuLink>
                      <SignOutButton>
                        <NavigationMenuLink>
                          {t('Navigation.sign_out')}
                        </NavigationMenuLink>
                      </SignOutButton>
                    </>
                  )
                : (
                    <>
                      <NavigationMenuLink href="/sign-up">
                        {t('Navigation.sign_up')}
                      </NavigationMenuLink>
                      <NavigationMenuLink href="/sign-in">
                        {t('Navigation.sign_in')}
                      </NavigationMenuLink>
                    </>
                  )}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenu>

        {/* Add New Facility Button */}
        <Link
          href="/add"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
        >
          <MapPinPlus className="h-5 w-5" />
          <span>{t('Navigation.add_new')}</span>
        </Link>
      </div>
    </nav>
  );
};

export default DesktopNavigation;
