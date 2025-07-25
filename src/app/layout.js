import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import Link from "next/link";

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  // Xác định ngôn ngữ còn lại để chuyển đổi
  const otherLocale = locale === "vi" ? "en" : "vi";
  return (
    <html lang={locale}>
      <head>
        <meta
          name="google-site-verification"
          content="gTRMSFUmm-DqEsxkSpkI1f_unNAypmVw9aGsnwfaNh0"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale}>
          {children}
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
