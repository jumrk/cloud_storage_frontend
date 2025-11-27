import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ request }) => {
  let locale = "vi";

  try {
    // Ưu tiên lấy locale từ header 'x-locale' do middleware set
    if (request && request.headers) {
      const headerLocale = request.headers.get("x-locale");
      if (headerLocale && (headerLocale === "vi" || headerLocale === "en")) {
        locale = headerLocale;
      }
    }

    // Fallback về cookie nếu không có header hoặc header không hợp lệ
    if (locale === "vi") {
      try {
        const cookieStore = await cookies();
        const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
        if (cookieLocale && (cookieLocale === "vi" || cookieLocale === "en")) {
          locale = cookieLocale;
        }
      } catch (cookieError) {
        // Trong trường hợp static rendering, cookies() sẽ throw error
        // Chúng ta sẽ sử dụng locale mặc định
        console.log(
          "Cookie not available in static rendering, using default locale:",
          locale
        );
      }
    }

    console.log("SSR COOKIE", locale);

    // Đảm bảo locale hợp lệ
    if (locale !== "vi" && locale !== "en") {
      locale = "vi";
    }

    const messages = (await import(`../../messages/${locale}.json`)).default;

    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error("Error in getRequestConfig:", error);

    // Fallback về vi nếu có lỗi
    try {
      const messages = (await import(`../../messages/vi.json`)).default;
      return {
        locale: "vi",
        messages,
      };
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return {
        locale: "vi",
        messages: {},
      };
    }
  }
});
