import { getRequestConfig } from "next-intl/server";
export default getRequestConfig(async ({ request }) => {
  let cookieLocale;
  console.log("SSR COOKIE", request);
  if (request && request.cookies && typeof request.cookies.get === "function") {
    cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  }

  const locale = cookieLocale || "vi"; // fallback mặc định
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
