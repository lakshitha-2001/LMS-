
import Enrollment from "../models/enrollment.js";
import Session from "../models/sessions.js";
import User from "../models/User.js";



const SUBJECTS = [
  "Sinhala", "Geography", "Economics", "Biology", 
  "Buddhist Culture and Logic", "Physics", "Chemistry",
  "Combined Mathematics", "Engineering & Bio System Technology",
  "Science for Technology", "ICT", "Agriculture and Applied Sciences"
];

export const createEnrollment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message, subject, month, year, imageUrl } = req.body;

    // Basic validation
    if (!message || !subject || !month || !year || !imageUrl) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Check for existing enrollment for same subject/month/year
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      subject,
      month: parseInt(month),
      year: parseInt(year),
      status: { $ne: 'rejected' } // Only check non-rejected enrollments
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: existingEnrollment.status === 'pending' 
          ? "You already have a pending enrollment for this subject and period"
          : "You're already enrolled in this subject for the selected period"
      });
    }

    // Rest of your existing code...
    const enrollment = new Enrollment({
      user: userId,
      message,
      subject,
      month: parseInt(month),
      year: parseInt(year),
      imageUrl
    });

    await enrollment.save();

    return res.status(201).json({
      message: "Enrollment submitted successfully",
      enrollment
    });

  } catch (error) {
    console.error('Enrollment error:', error.message);
    
    // More specific error handling
    if (error.message.includes('Cannot enroll for past months')) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: error.errors 
      });
    }

    return res.status(500).json({ 
      message: "Failed to submit enrollment",
      error: error.message 
    });
  }
};

export const getEnrollments = async (req, res) => {
  try {
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "Admin access required" });
    // }

    const enrollments = await Enrollment.find()
      .populate('user', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving enrollments",
      error: error.message
    });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Update status
    enrollment.status = status;
    enrollment.reviewedBy = req.user._id;
    enrollment.reviewedAt = new Date();
    await enrollment.save();

    // If approved, grant access to subject
    if (status === 'approved') {
      await User.findByIdAndUpdate(
        enrollment.user,
        { $addToSet: { accessibleSubjects: enrollment.subject } }
      );
      
      // Grant session access
      await grantSessionAccess(
        enrollment.user, 
        enrollment.subject, 
        enrollment.month, 
        enrollment.year
      );
    } else if (status === 'rejected') {
      // Remove subject access if previously approved
      await User.findByIdAndUpdate(
        enrollment.user,
        { $pull: { accessibleSubjects: enrollment.subject } }
      );
    }

    res.json({ 
      message: `Enrollment ${status} successfully`, 
      enrollment 
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating enrollment status',
      error: error.message
    });
  }
};


const grantSessionAccess = async (userId, subject, month, year) => {
  // 1. Find all sessions for the subject and period
  const sessions = await Session.find({
    subject,
    date: {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1)
    }
  });

  // 2. Add user to enrolledStudents for each session
  for (const session of sessions) {
    if (!session.enrolledStudents.includes(userId)) {
      session.enrolledStudents.push(userId);
      await session.save();
    }
  }

  // 3. Grant access to subject notes
  await User.findByIdAndUpdate(userId, {
    $addToSet: { accessibleSubjects: subject }
  });
};

export const updateEnrollment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { enrollmentId } = req.params;
    const { subject, month, year, message } = req.body;

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { subject, month, year, message },
      { new: true }
    ).populate('user', 'firstName lastName email');

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json({
      message: "Enrollment updated successfully",
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating enrollment",
      error: error.message
    });
  }
};
export const deleteEnrollment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findByIdAndDelete(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    res.json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting enrollment",
      error: error.message
    });
  }
};

// Get pending enrollments count
export const getPendingCount = async (req, res) => {
  try {
    const count = await Enrollment.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending enrollments count' });
  }
};

// Clear notifications
export const clearNotifications = async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications' });
  }
};



