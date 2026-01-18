import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import "react-loading-skeleton/dist/skeleton.css";
import en from "@/../messages/en.json";
import vi from "@/../messages/vi.json";
export const metadata = {
  title: {
    template: "%s | D2MBox",
    default: "D2MBox - Cloud Storage Solution",
  },
  description:
    "D2MBox - Professional cloud storage solution with advanced features",
  keywords: ["cloud storage", "file management", "D2MBox"],
  authors: [{ name: "D2MBox Team" }],
  creator: "D2MBox",
  publisher: "D2MBox",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://d2mbox.com",
    siteName: "D2MBox",
    title: "D2MBox - Cloud Storage Solution",
    description: "Professional cloud storage solution with advanced features",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "D2MBox Cloud Storage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D2MBox - Cloud Storage Solution",
    description: "Professional cloud storage solution with advanced features",
    images: ["/images/twitter-image.jpg"],
  },
  alternates: {
    canonical: "https://d2mbox.com",
    languages: {
      vi: "https://d2mbox.com",
      en: "https://d2mbox.com/en",
    },
  },
  metadataBase: new URL("https://d2mbox.com"),
};
export default async function RootLayout({ children }) {
  let locale = "vi";
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    if (cookieLocale && (cookieLocale === "vi" || cookieLocale === "en")) {
      locale = cookieLocale;
    }
  } catch (error) {
    console.log(
      "Cookie not available in static rendering, using default locale:",
      locale
    );
  }

  const messages = locale === "en" ? en : vi;

  return (
    <html lang={locale}>
      <head>
        <meta
          name="google-site-verification"
          content="gTRMSFUmm-DqEsxkSpkI1f_unNAypmVw9aGsnwfaNh0"
        />
        {/* Content Security Policy - Protect against XSS and crypto mining */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:; media-src 'self' https: http: data: blob:; connect-src 'self' https: http: ws: wss:; frame-src 'self' https://drive.google.com https://*.googleusercontent.com https://docs.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
        />
        {/* Additional security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
