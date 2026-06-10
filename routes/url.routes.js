import { Router } from "express";
import {
  handleCreateShortId,
  handleGetRedirectUrl,
  handleGetAnalytics,
} from "../controllers/url.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createUrlSchema,
  redirectParamsSchema,
  analyticsParamsSchema,
} from "../validators/url.validator.js";
import {
  createUrlLimiter,
  redirectLimiter,
  analyticsLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

router.post("/", createUrlLimiter, validate(createUrlSchema), handleCreateShortId);
router.get(
  "/analytics/:shortId",
  analyticsLimiter,
  validate(analyticsParamsSchema),
  handleGetAnalytics,
);
router.get("/:shortId", redirectLimiter, validate(redirectParamsSchema), handleGetRedirectUrl);

export { router as urlRoutes };
