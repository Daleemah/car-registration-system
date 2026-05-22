const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middlewares/authMiddleware");
const controller = require("../controllers/adminDashboardController");



// All admin dashboard routes
router.get(
  "/overview",
  protect,
  requireRole("admin"),
  controller.getOverview
);

router.get(
  "/monthly",
  protect,
  requireRole("admin"),
  controller.getMonthly
);

router.get(
  "/top-models",
  protect,
  requireRole("admin"),
  controller.getTopModels
);

router.get(
  "/status",
  protect,
  requireRole("admin"),
  controller.getStatus
);

module.exports = router;