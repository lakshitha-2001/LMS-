import express from 'express'
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  getPendingCount,
  clearNotifications
} from '../controllers/enrollment.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// User submits enrollment (protected route)
router.post('/enroll', authMiddleware, createEnrollment)

// Admin views all enrollments (admin only)
router.get('/', authMiddleware, getEnrollments)

// Admin updates enrollment status (admin only)
router.patch('/:enrollmentId/status', authMiddleware, updateEnrollmentStatus)

router.delete('/:enrollmentId', authMiddleware, deleteEnrollment)

// Get pending enrollments count
router.get('/pending-count', authMiddleware, getPendingCount)

// Clear notifications
router.post('/clear-notifications', authMiddleware, clearNotifications)

export default router