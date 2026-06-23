import { Router } from "express";
import { analytics, exportExcel, exportPdf, listResults, listActiveAttempts } from "../controllers/result.controller.js";
import { authorize, protect } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, listResults);
router.get("/active", protect, authorize("ADMIN"), listActiveAttempts);
router.get("/analytics", protect, authorize("ADMIN"), analytics);
router.get("/export/pdf", protect, authorize("ADMIN"), exportPdf);
router.get("/export/excel", protect, authorize("ADMIN"), exportExcel);

export default router;


