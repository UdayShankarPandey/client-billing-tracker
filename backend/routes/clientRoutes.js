const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

// All routes require authentication
router.use(authMiddleware);

router.post("/", requireRoles("admin", "staff"), clientController.createClient);
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);
router.put("/:id", requireRoles("admin", "staff"), clientController.updateClient);
router.delete("/:id", requireRoles("admin", "staff"), clientController.deleteClient);

module.exports = router;
