/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://d2mbox.com",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    // Exclude all private routes
    "/admin/*",
    "/member/*",
    "/*/admin/*",
    "/*/member/*",
    "/*/leader/*",
    "/*/chat/*",
    "/*/file_management/*",
    "/*/infor_user/*",
    "/*/notification/*",
    "/*/user_management/*",
    "/*/tools/*",
    "/*/convert-text-to-voice/*",
    "/*/download/*",
    "/*/merge/*",
    "/*/separate-voice/*",
    "/*/sub/*",
    "/*/subtitle/*",
    "/login",
    "/ForgotPassword",
    "/share/*",
    // Exclude dynamic routes that don't exist
    "/[slast]/*",
  ],
  // Force include specific pages
  include: [
    "/",
    "/about",
    "/contact",
    "/faq",
    "/privacy_policy",
    "/terms_of_use",
    "/cookie_policy",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/contact",
          "/faq",
          "/privacy_policy",
          "/terms_of_use",
          "/cookie_policy",
        ],
        disallow: [
          "/admin/",
          "/member/",
          "/login",
          "/ForgotPassword",
          "/share/",
          "/*/admin/",
          "/*/member/",
          "/*/leader/",
          "/*/chat/",
          "/*/file_management/",
          "/*/infor_user/",
          "/*/notification/",
          "/*/user_management/",
          "/*/tools/",
        ],
      },
    ],
    additionalSitemaps: ["https://d2mbox.com/sitemap.xml"],
  },
  transform: async (config, path) => {
    // Custom transform for different page types
    const customPaths = {
      "/": {
        priority: 1.0,
        changefreq: "daily",
      },
      "/about": {
        priority: 0.8,
        changefreq: "weekly",
      },
      "/contact": {
        priority: 0.7,
        changefreq: "monthly",
      },
      "/faq": {
        priority: 0.8,
        changefreq: "weekly",
      },
      "/privacy_policy": {
        priority: 0.5,
        changefreq: "yearly",
      },
      "/terms_of_use": {
        priority: 0.5,
        changefreq: "yearly",
      },
      "/cookie_policy": {
        priority: 0.5,
        changefreq: "yearly",
      },
    };

    return {
      loc: path,
      lastmod: new Date().toISOString(),
      changefreq: customPaths[path]?.changefreq || "monthly",
      priority: customPaths[path]?.priority || 0.7,
    };
  },
  additionalPaths: async (config) => {
    // Force include specific pages
    return [
      {
        loc: "/",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        loc: "/about",
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      },
      {
        loc: "/contact",
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: 0.7,
      },
      {
        loc: "/faq",
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      },
      {
        loc: "/privacy_policy",
        lastmod: new Date().toISOString(),
        changefreq: "yearly",
        priority: 0.5,
      },
      {
        loc: "/terms_of_use",
        lastmod: new Date().toISOString(),
        changefreq: "yearly",
        priority: 0.5,
      },
      {
        loc: "/cookie_policy",
        lastmod: new Date().toISOString(),
        changefreq: "yearly",
        priority: 0.5,
      },
    ];
  },
};
