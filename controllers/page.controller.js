import { urlService } from "../services/url.service.js";
import { URL } from "../models/url.model.js";
import { Click } from "../models/click.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function renderHome(req, res, next) {
  try {
    const urls = await URL.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    const urlsWithClicks = await Promise.all(
      urls.map(async (url) => {
        const clickCount = await Click.countDocuments({ shortId: url.shortId });
        return { ...url, clickCount };
      }),
    );

    res.render("index", { error: null, urls: urlsWithClicks });
  } catch (error) {
    next(error);
  }
}

export async function handleShortenForm(req, res, next) {
  try {
    const { redirectUrl, customAlias, expiresInDays } = req.body;

    if (!redirectUrl) {
      return res.render("index", { error: "Destination URL is required" });
    }

    try {
      const parsed = new URL(redirectUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return res.render("index", { error: "URL must use http or https protocol" });
      }
    } catch {
      return res.render("index", { error: "Please enter a valid URL" });
    }

    if (customAlias && !/^[a-zA-Z0-9_-]{4,20}$/.test(customAlias)) {
      return res.render("index", { error: "Custom alias must be 4-20 characters (letters, numbers, -, _)" });
    }

    const expiresDays = expiresInDays ? parseInt(expiresInDays, 10) : undefined;
    if (expiresDays !== undefined && (isNaN(expiresDays) || expiresDays < 1 || expiresDays > 365)) {
      return res.render("index", { error: "Expiry must be between 1 and 365 days" });
    }

    const result = await urlService.createShortUrl({
      redirectUrl,
      customAlias: customAlias || undefined,
      expiresInDays: expiresDays,
    });

    res.render("result", {
      shortUrl: result.shortUrl,
      shortId: result.shortId,
      redirectUrl,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.render("index", { error: error.message });
    }
    next(error);
  }
}

export async function renderAnalytics(req, res, next) {
  try {
    const { shortId } = req.params;
    const analytics = await urlService.getAnalytics(shortId);
    res.render("analytics", {
      shortId: analytics.shortId,
      redirectUrl: analytics.redirectUrl,
      totalClicks: analytics.totalClicks,
      recentClicks: analytics.recentClicks,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(404).render("index", { error: error.message });
    }
    next(error);
  }
}
