const express = require("express");
const router = express.Router();
const workLogController = require("../controllers/workLogController");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

router.use(authMiddleware);

router.post("/", requireRoles("admin", "staff"), workLogController.createWorkLog);
router.get("/", workLogController.getWorkLogs);
router.get("/:id", workLogController.getWorkLogById);
router.put("/:id", requireRoles("admin", "staff"), workLogController.updateWorkLog);
router.delete("/:id", requireRoles("admin", "staff"), workLogController.deleteWorkLog);

module.exports = router;
