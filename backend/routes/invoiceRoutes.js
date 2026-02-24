const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

router.use(authMiddleware);

router.post("/", requireRoles("admin", "staff"), invoiceController.createInvoice);
router.get("/", invoiceController.getInvoices);
router.get("/client/:clientId/stats", invoiceController.getInvoiceStats);
router.get("/:id", invoiceController.getInvoiceById);
router.get("/:id/pdf", invoiceController.downloadInvoicePdf);
router.put("/:id", requireRoles("admin", "staff"), invoiceController.updateInvoice);
router.post("/:id/payment", requireRoles("admin", "staff"), invoiceController.recordPayment);
router.delete("/:id", requireRoles("admin"), invoiceController.deleteInvoice);

module.exports = router;
