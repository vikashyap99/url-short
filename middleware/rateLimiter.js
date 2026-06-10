import rateLimit from "express-rate-limit";
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_CREATE,
  RATE_LIMIT_MAX_REDIRECT,
  RATE_LIMIT_MAX_ANALYTICS,
} from "../constants/index.js";

export const createUrlLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_CREATE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many URLs created from this IP, please try again later",
  },
});

export const redirectLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REDIRECT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
});

export const analyticsLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_ANALYTICS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many analytics requests from this IP, please try again later",
  },
});
