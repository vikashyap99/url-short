import { urlService } from "../services/url.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export async function handleCreateShortId(req, res, next) {
  try {
    const { redirectUrl, customAlias, expiresInDays } = req.body;
    const result = await urlService.createShortUrl({
      redirectUrl,
      customAlias,
      expiresInDays,
    });
    return ApiResponse.created(result, "Short URL created successfully").send(res);
  } catch (error) {
    next(error);
  }
}

export async function handleGetRedirectUrl(req, res, next) {
  try {
    const { shortId } = req.params;
    const redirectUrl = await urlService.getOriginalUrl(shortId, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      referer: req.get("referer"),
    });
    return res.redirect(302, redirectUrl);
  } catch (error) {
    next(error);
  }
}

export async function handleGetAnalytics(req, res, next) {
  try {
    const { shortId } = req.params;
    const analytics = await urlService.getAnalytics(shortId);
    return ApiResponse.success(analytics, "Analytics fetched successfully").send(res);
  } catch (error) {
    next(error);
  }
}
