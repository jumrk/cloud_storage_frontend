import { getRequestConfig } from "next-intl/server";
export default getRequestConfig(async ({ request }) => {
  let locale = "vi";
  if (request && request.headers && typeof request.headers.get === "function") {
    locale = request.headers.get("x-locale") || "vi";
    console.log("SSR COOKIE", locale);
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
