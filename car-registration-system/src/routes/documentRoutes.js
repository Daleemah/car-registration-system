const { protect, requireRole } = require('../middlewares/authMiddleware');

router.put(
  '/:id/verify',
  protect,
  requireRole('staff'),
  verifyDocument
);0

