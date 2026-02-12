import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.resolve("public");
const RSS_PATH = path.join(PUBLIC_DIR, "rss.xml");

const DEFAULT_SITE_URL = "https://rpothin.github.io";
const RSS_ITEM_LIMIT = 20;

function normalizeSiteUrl(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

function readDotEnvValue(key: string): string | null {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const k = match[1];
    if (k !== key) continue;
    let v = match[2] ?? "";
    v = v.replace(/^\s*['"]/, "").replace(/['"]\s*$/, "");
    return v.trim();
  }
  return null;
}

function fail(message: string): never {
  console.error(`❌ RSS validation failed: ${message}`);
  process.exit(1);
}

function main() {
  const envSiteUrl =
    (process.env.SITE_URL && process.env.SITE_URL.trim().length > 0
      ? process.env.SITE_URL
      : null) ?? readDotEnvValue("SITE_URL");
  const siteUrl = normalizeSiteUrl(envSiteUrl || DEFAULT_SITE_URL);

  if (!fs.existsSync(RSS_PATH)) {
    fail(`Missing ${path.relative(process.cwd(), RSS_PATH)}`);
  }

  const xml = fs.readFileSync(RSS_PATH, "utf-8").trim();
  if (!xml) fail("rss.xml is empty");

  // Basic structure checks
  if (!xml.includes("<rss")) fail("Missing <rss> root element");
  if (!xml.includes("<channel>")) fail("Missing <channel> element");
  if (!xml.includes("</rss>")) fail("Missing </rss> closing tag");

  // Item count
  const itemCount = (xml.match(/<item>/g) || []).length;
  if (itemCount > RSS_ITEM_LIMIT) {
    fail(`Too many items (${itemCount}); expected <= ${RSS_ITEM_LIMIT}`);
  }

  // Canonical URLs should be absolute and based on SITE_URL
  if (!/^https?:\/\//i.test(siteUrl)) {
    console.warn(
      `⚠️ SITE_URL looks unusual (expected http(s)://...). Validation will be lenient: ${siteUrl}`,
    );
  } else {
    const expectedPrefix = `${siteUrl}/posts/`;
    if (itemCount > 0 && !xml.includes(expectedPrefix)) {
      fail(`No item links found starting with ${expectedPrefix}`);
    }
  }

  // Common XML breakage: unescaped ampersands
  const badAmp = xml.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)/);
  if (badAmp) {
    fail(
      "Found an unescaped '&' in rss.xml. Ensure text content is XML-escaped.",
    );
  }

  console.log(`✅ RSS validation passed (${itemCount} items)`);
}

main();
