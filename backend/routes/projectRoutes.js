const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { authMiddleware, requireRoles } = require("../middlewares/auth");

router.use(authMiddleware);

router.post("/", requireRoles("admin", "staff"), projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/client/:clientId", projectController.getProjectsByClient);
router.get("/:id", projectController.getProjectById);
router.put("/:id", requireRoles("admin", "staff"), projectController.updateProject);
router.delete("/:id", requireRoles("admin", "staff"), projectController.deleteProject);

module.exports = router;
