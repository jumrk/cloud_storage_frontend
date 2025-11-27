#!/usr/bin/env node

/**
 * Script to generate sitemap and robots.txt
 * Run with: node generate-sitemap.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Generating sitemap and robots.txt...");

try {
  // Check if next-sitemap is installed
  try {
    require.resolve("next-sitemap");
  } catch (e) {
    console.log("📦 Installing next-sitemap...");
    execSync("npm install next-sitemap --save-dev", { stdio: "inherit" });
  }

  // Generate sitemap
  console.log("🗺️  Generating sitemap.xml...");
  execSync("npx next-sitemap", { stdio: "inherit" });

  // Check if files were created
  const sitemapPath = path.join(__dirname, "public", "sitemap.xml");
  const robotsPath = path.join(__dirname, "public", "robots.txt");

  if (fs.existsSync(sitemapPath)) {
    console.log("✅ sitemap.xml generated successfully");
  } else {
    console.log("❌ sitemap.xml generation failed");
  }

  if (fs.existsSync(robotsPath)) {
    console.log("✅ robots.txt generated successfully");
  } else {
    console.log("❌ robots.txt generation failed");
  }

  console.log("🎉 Sitemap generation completed!");
} catch (error) {
  console.error("❌ Error generating sitemap:", error.message);
  process.exit(1);
}
