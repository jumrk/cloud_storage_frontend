import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import en from "../../messages/en.json";
import vi from "../../messages/vi.json";

export default async function RootLayout({ children }) {
  let locale = "vi";
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    if (cookieLocale && (cookieLocale === "vi" || cookieLocale === "en")) {
      locale = cookieLocale;
    }
  } catch (error) {
    console.log("Error reading locale from cookie:", error);
  }

  const messages = locale === "en" ? en : vi;

  return (
    <html lang={locale}>
      <head>
        <meta
          name="google-site-verification"
          content="gTRMSFUmm-DqEsxkSpkI1f_unNAypmVw9aGsnwfaNh0"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
