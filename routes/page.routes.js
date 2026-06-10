import { Router } from "express";
import {
  renderHome,
  handleShortenForm,
  renderAnalytics,
} from "../controllers/page.controller.js";
import { handleGetRedirectUrl } from "../controllers/url.controller.js";
import { redirectLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/", renderHome);
router.post("/shorten", handleShortenForm);
router.get("/analytics/:shortId", renderAnalytics);
router.get("/:shortId", redirectLimiter, handleGetRedirectUrl);

export { router as pageRoutes };
