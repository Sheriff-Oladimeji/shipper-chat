import { NextRequest, NextResponse } from "next/server";
import type { LinkPreview } from "@/types";

// Simple in-memory cache for link previews
const cache = new Map<string, { data: LinkPreview; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function extractMetaContent(html: string, property: string): string | null {
  // Try og: tags first
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  let match = html.match(ogRegex);
  if (match) return match[1];

  // Try reverse attribute order
  const ogRegexReverse = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
    "i"
  );
  match = html.match(ogRegexReverse);
  if (match) return match[1];

  // Try twitter: tags
  const twitterRegex = new RegExp(
    `<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  match = html.match(twitterRegex);
  if (match) return match[1];

  // Try name attribute for description
  if (property === "description") {
    const descRegex = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i;
    match = html.match(descRegex);
    if (match) return match[1];

    const descRegexReverse = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i;
    match = html.match(descRegexReverse);
    if (match) return match[1];
  }

  return null;
}

function extractTitle(html: string): string | null {
  // Try og:title first
  const ogTitle = extractMetaContent(html, "title");
  if (ogTitle) return ogTitle;

  // Fallback to <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  // Try to find favicon link tags
  const iconPatterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ];

  for (const pattern of iconPatterns) {
    const match = html.match(pattern);
    if (match) {
      const href = match[1];
      // Make absolute URL
      if (href.startsWith("http")) return href;
      if (href.startsWith("//")) return `https:${href}`;
      if (href.startsWith("/")) return `${baseUrl}${href}`;
      return `${baseUrl}/${href}`;
    }
  }

  // Default favicon location
  return `${baseUrl}/favicon.ico`;
}

function makeAbsoluteUrl(url: string | null, baseUrl: string): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return `${baseUrl}/${url}`;
}

function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "URL is required" },
      { status: 400 }
    );
  }

  // Normalize URL
  let normalizedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    normalizedUrl = `https://${url}`;
  }

  // Check cache
  const cached = cache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ success: true, data: cached.data });
  }

  try {
    const baseUrl = getBaseUrl(normalizedUrl);

    // Fetch the page with a browser-like User-Agent
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    const preview: LinkPreview = {
      url: normalizedUrl,
      title: extractTitle(html),
      description: extractMetaContent(html, "description"),
      image: makeAbsoluteUrl(extractMetaContent(html, "image"), baseUrl),
      favicon: extractFavicon(html, baseUrl),
      siteName: extractMetaContent(html, "site_name") || new URL(normalizedUrl).hostname,
    };

    // Cache the result
    cache.set(normalizedUrl, { data: preview, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: preview });
  } catch (error) {
    console.error("Link preview error:", error);

    // Return basic preview with just the domain
    const basicPreview: LinkPreview = {
      url: normalizedUrl,
      title: null,
      description: null,
      image: null,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(normalizedUrl).hostname}&sz=64`,
      siteName: new URL(normalizedUrl).hostname,
    };

    return NextResponse.json({ success: true, data: basicPreview });
  }
}
