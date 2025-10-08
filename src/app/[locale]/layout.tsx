import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import arcjet, { detectBot, request } from '@/libs/Arcjet';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/i18nRouting';
import { ClerkProvider } from '@clerk/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AuthWrapper from '../../components/AuthWrapper';
import '@/styles/global.css';

export const metadata: Metadata = {
  icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Verify the request with Arcjet
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const runtime = process.env.NEXT_RUNTIME; // may be defined in some contexts
  if (Env.ARCJET_KEY && !isBuild && runtime) {
    try {
      const req = await request();
      const decision = await aj.protect(req);

      // These errors are handled by the global error boundary, but you could also
      // redirect or show a custom error page
      if (decision.isDenied()) {
        if (decision.reason.isBot()) {
          throw new Error('No bots allowed');
        }

        throw new Error('Access denied');
      }
    } catch (err) {
      // Avoid failing build-time config collection if Arcjet is unavailable
      console.warn('[Arcjet] Skipping protection during static generation:', err);
    }
  }

  // Using internationalization in Client Components
  const messages = await getMessages();

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.

  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthWrapper
              currentLocale={locale}
              availableLocales={routing.locales}
            >
              <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 md:pb-28">
                {props.children}
              </div>
              <Toaster />
            </AuthWrapper>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
