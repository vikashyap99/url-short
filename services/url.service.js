import { customAlphabet } from "nanoid";
import net from "net";
import { URL as UrlModel } from "../models/url.model.js";
import { Click } from "../models/click.model.js";
import { cacheService } from "./cache.service.js";
import { ApiError } from "../utils/ApiError.js";
import {
  SHORT_ID_LENGTH,
  SHORT_ID_ALPHABET,
  REDIRECT_CACHE_TTL_SECONDS,
} from "../constants/index.js";

const generateShortId = customAlphabet(SHORT_ID_ALPHABET, SHORT_ID_LENGTH);

function isPrivateHostname(hostname) {
  if (net.isIP(hostname)) {
    if (net.isIPv4(hostname)) {
      const parts = hostname.split(".").map(Number);
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 127) return true;
      if (parts[0] === 0) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
      if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
      if (parts[0] === 198 && parts[1] === 18) return true;
    }
    return true;
  }
  if (hostname === "localhost") return true;
  if (hostname.endsWith(".local")) return true;
  if (hostname.endsWith(".internal")) return true;
  return false;
}

async function generateUniqueShortId(retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const shortId = generateShortId();
    const existing = await UrlModel.findOne({ shortId }).lean();
    if (!existing) return shortId;
  }
  throw ApiError.internal("Failed to generate unique short ID after retries");
}

async function createShortUrl({ redirectUrl, customAlias, expiresInDays }) {
  try {
    const parsed = new URL(redirectUrl);
    if (isPrivateHostname(parsed.hostname)) {
      throw ApiError.badRequest("Redirects to private or internal networks are not allowed");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest("Invalid redirect URL");
  }

  let shortId;
  if (customAlias) {
    const aliasTaken = await UrlModel.findOne({ shortId: customAlias }).lean();
    if (aliasTaken) {
      throw ApiError.conflict("This custom alias is already taken");
    }
    shortId = customAlias;
  } else {
    shortId = await generateUniqueShortId();
  }

  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date(Date.now() + expiresInDays * 86400 * 1000);
  }

  let url;
  try {
    url = await UrlModel.create({
      shortId,
      redirectUrl,
      expiresAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict("This short ID is already taken");
    }
    throw error;
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
  const shortUrl = `${baseUrl}/${shortId}`;

  return { shortUrl, shortId, expiresAt };
}

async function getOriginalUrl(shortId, requestMeta = {}) {
  const cacheKey = `redirect:${shortId}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) {
    recordClick(shortId, requestMeta, cached._id).catch(() => {});
    return cached.redirectUrl;
  }

  const url = await UrlModel.findOne({ shortId, isActive: true }).lean();

  if (!url) {
    throw ApiError.notFound("Short URL not found");
  }

  if (url.expiresAt && Date.now() >= url.expiresAt.getTime()) {
    throw ApiError.notFound("This short URL has expired");
  }

  const remainingTtl = url.expiresAt
    ? Math.min(REDIRECT_CACHE_TTL_SECONDS, Math.max(0, Math.floor((url.expiresAt.getTime() - Date.now()) / 1000)))
    : REDIRECT_CACHE_TTL_SECONDS;

  await cacheService.set(cacheKey, { redirectUrl: url.redirectUrl, _id: url._id }, remainingTtl);

  recordClick(shortId, requestMeta, url._id).catch(() => {});

  return url.redirectUrl;
}

async function recordClick(shortId, { ip, userAgent, referer } = {}, urlId) {
  if (!urlId) {
    const url = await UrlModel.findOne({ shortId }).select("_id").lean();
    if (!url) return;
    urlId = url._id;
  }

  await Click.create({
    urlId,
    shortId,
    ip: ip ? String(ip).slice(0, 45) : null,
    userAgent: userAgent ? String(userAgent).slice(0, 512) : null,
    referer: referer ? String(referer).slice(0, 2048) : null,
  });
}

async function getAnalytics(shortId) {
  const url = await UrlModel.findOne({ shortId }).select("shortId redirectUrl createdAt").lean();
  if (!url) {
    throw ApiError.notFound("Short URL not found");
  }

  const [clickCount, recentClicks] = await Promise.all([
    Click.countDocuments({ shortId }),
    Click.find({ shortId })
      .select("timestamp ip userAgent referer -_id")
      .sort({ timestamp: -1 })
      .limit(100)
      .lean(),
  ]);

  return {
    shortId: url.shortId,
    redirectUrl: url.redirectUrl,
    createdAt: url.createdAt,
    totalClicks: clickCount,
    recentClicks,
  };
}

export const urlService = { createShortUrl, getOriginalUrl, getAnalytics };
