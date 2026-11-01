import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes.js';
import profileRoutes from './profileRoutes.js';
import resumeRoutes from './resumeRoutes.js';
import interviewRoutes from './interviewRoutes.js';
import roadmapRoutes from './roadmapRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';

const router = Router();
router.use(dashboardRoutes);
router.use(profileRoutes);
router.use(resumeRoutes);
router.use(interviewRoutes);
router.use(roadmapRoutes);
router.use(feedbackRoutes);

export default router;
