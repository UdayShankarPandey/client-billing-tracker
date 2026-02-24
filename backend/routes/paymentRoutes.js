const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

router.use(authMiddleware);

router.post("/", requireRoles("admin", "staff"), paymentController.createPayment);
router.get("/", paymentController.getPayments);
router.get("/client/:clientId", paymentController.getPaymentsByClient);
router.get("/:id", paymentController.getPaymentById);
router.put("/:id", requireRoles("admin"), paymentController.updatePayment);
router.delete("/:id", requireRoles("admin"), paymentController.deletePayment);

module.exports = router;
