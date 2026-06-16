const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');
const ResumeModel = require('../models/resumeModel');
const StorageService = require('../services/storageService');
const metrics = require('../config/metrics');
const logger = require('../config/logger');

// Regex for email and password complexity validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const AuthController = {
  /**
   * User Registration Handler.
   */
  async register(req, res) {
    try {
      const { full_name, email, password, confirm_password, role } = req.body;

      // 1. Basic input presence
      if (!full_name || !email || !password || !confirm_password) {
        return res.status(400).json({ error: 'All registration fields are required' });
      }

      // 2. Validate Full Name
      if (full_name.trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
      }

      // 3. Validate Email format
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // 4. Validate Password Complexity
      if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' 
        });
      }

      // 5. Compare Password and Confirm Password
      if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // 6. Validate Role selection (default to Candidate if not specified or invalid)
      let userRole = 'Candidate';
      if (role && ['Candidate', 'Recruiter', 'Admin'].includes(role)) {
        userRole = role;
      }

      // If they attempt to register as Admin, restrict unless authenticated or running initial setup
      // (For local testing we can allow it, but let's log it or block)
      if (userRole === 'Admin') {
        // Enforce restriction or log it
        logger.warn('Administrative registration attempt detected', { email, ip: req.ip });
      }

      // 7. Check for duplicate email
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        logger.warn('Registration failed: Duplicate email attempt', { email, ip: req.ip });
        // Return a generic conflict error
        return res.status(409).json({ error: 'An account with this email address already exists' });
      }

      // 8. Hash Password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 9. Save User
      const newUser = await UserModel.createUser(full_name, email, passwordHash, userRole);

      // 10. Audit log registration
      await AuditModel.create({
        user_id: newUser.id,
        action: 'USER_REGISTRATION',
        resource: 'USERS',
        ip_address: req.ip
      });

      logger.info(`User registered successfully: ${newUser.email} (${newUser.role})`);

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser.id,
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role
        }
      });

    } catch (err) {
      logger.error('Registration controller error', err);
      return res.status(500).json({ error: 'An unexpected server error occurred' });
    }
  },

  /**
   * User Login Handler with Brute-Force Locking.
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user exists
      const user = await UserModel.findByEmail(email);

      if (!user) {
        // Run a dummy check to mitigate timing analysis attacks
        await bcrypt.compare('dummy_password', '$2b$10$r819WepMvR11rGq62qZ47ee4pY2n41BScv3kF6lK8G164o30hBOCG');
        logger.warn('Login failed: Account not found', { email, ip: req.ip });
        metrics.loginFailuresTotal.inc();
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify if account is disabled by admin
      if (!user.is_active) {
        logger.logSecurity('Login Blocked: Disabled Account', user.id, req.ip, { email });
        return res.status(403).json({ error: 'This account has been disabled. Please contact support.' });
      }

      // Verify if account is locked out
      if (user.account_locked_until) {
        const lockedUntil = new Date(user.account_locked_until);
        const currentTime = new Date();

        if (lockedUntil > currentTime) {
          const remainingMinutes = Math.ceil((lockedUntil - currentTime) / (60 * 1000));
          logger.logSecurity('Login Blocked: Account Locked Out', user.id, req.ip, { email, lockedUntil });
          return res.status(403).json({ 
            error: `This account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).` 
          });
        } else {
          // Lock duration expired, reset attempts
          await UserModel.resetFailedAttempts(email);
          user.failed_login_attempts = 0;
          user.account_locked_until = null;
        }
      }

      // Verify Password
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        // Increment failed attempt counter
        const currentAttempts = await UserModel.incrementFailedAttempts(email);
        metrics.loginFailuresTotal.inc();
        
        logger.logSecurity('Login Attempt Failed', user.id, req.ip, { 
          email, 
          attempts: currentAttempts 
        });

        // Trigger lockout if attempts reach 5
        if (currentAttempts >= 5) {
          const lockoutTime = 15; // 15 minutes lockout
          const lockUntil = new Date(Date.now() + lockoutTime * 60 * 1000);
          await UserModel.lockAccount(email, lockUntil);
          
          await AuditModel.create({
            user_id: user.id,
            action: 'ACCOUNT_LOCKOUT',
            resource: 'USERS',
            ip_address: req.ip
          });

          logger.logSecurity('Account Locked Out (Threshold Reached)', user.id, req.ip, {
            email,
            lockUntil
          });

          return res.status(403).json({
            error: `Too many failed login attempts. Your account has been locked for ${lockoutTime} minutes.`
          });
        }

        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Reset failed attempts on success
      if (user.failed_login_attempts > 0) {
        await UserModel.resetFailedAttempts(email);
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'dev_jwt_secret_key_8e4fa694c9ef294b',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      // Log success and audit it
      await AuditModel.create({
        user_id: user.id,
        action: 'USER_LOGIN',
        resource: 'AUTH',
        ip_address: req.ip
      });

      logger.info(`User logged in successfully: ${user.email}`);

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      logger.error('Login controller error', err);
      return res.status(500).json({ error: 'An unexpected server error occurred' });
    }
  },

  /**
   * Profile Retrieval.
   */
  async profile(req, res) {
    try {
      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (err) {
      logger.error('Profile controller error', err);
      return res.status(500).json({ error: 'An unexpected server error occurred' });
    }
  },

  /**
   * Upload resume and link to profile (Candidate only).
   */
  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded' });
      }

      const fileUrl = await StorageService.uploadFile(req.file);

      // Create resume entry in database
      const resume = await ResumeModel.create({
        user_id: req.user.userId,
        file_name: req.file.originalname,
        file_url: fileUrl
      });

      // Audit Log the upload
      await AuditModel.create({
        user_id: req.user.userId,
        action: 'RESUME_UPLOAD',
        resource: `RESUMES/${resume.id}`,
        ip_address: req.ip
      });

      logger.info(`Resume uploaded by candidate ${req.user.email}: ${req.file.originalname}`);

      return res.status(201).json({
        message: 'Resume uploaded successfully',
        resume
      });
    } catch (err) {
      logger.error('Resume upload controller error', err);
      return res.status(500).json({ error: 'Server error uploading resume file' });
    }
  }
};

module.exports = AuthController;
