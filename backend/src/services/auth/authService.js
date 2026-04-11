import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import { recalculateUserMetrics, requiresRecalculation } from '../integration/calculationIntegration.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Generate JWT token for authenticated user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      name: user.profile.name
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'smartgain-backend',
      audience: 'smartgain-client'
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'smartgain-backend',
        audience: 'smartgain-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and token
   * @throws {Error} If registration fails
   */
  async registerUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user (password will be hashed by pre-save middleware)
      const user = new User(userData);
      
      // Calculate initial metrics if profile data is complete
      if (user.profile.age && user.profile.height && user.profile.currentWeight && 
          user.profile.activityLevel && user.goals.goalIntensity) {
        await recalculateUserMetrics(user);
      }
      
      await user.save();

      // Generate token
      const token = this.generateToken(user);

      return {
        user: user.toJSON(), // This will exclude password due to toJSON transform
        token
      };
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User and token
   * @throws {Error} If authentication fails
   */
  async authenticateUser(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        user: user.toJSON(),
        token
      };
    } catch (error) {
      // Don't reveal whether email exists or password is wrong for security
      if (error.message === 'Invalid email or password') {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Object} Updated user
   * @throws {Error} If update fails
   */
  async updateUserProfile(userId, updates) {
    try {
      // Don't allow updating sensitive fields through this method
      const allowedUpdates = [
        'profile.name',
        'profile.age',
        'profile.height',
        'profile.currentWeight',
        'profile.targetWeight',
        'profile.activityLevel',
        'profile.fitnessLevel',
        'profile.dietaryPreferences',
        'profile.healthConditions',
        'goals.weeklyWeightGain',
        'goals.targetDate',
        'goals.goalIntensity'
      ];

      // Filter updates to only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Get user first to check if recalculation is needed
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Apply updates
      Object.keys(filteredUpdates).forEach(key => {
        const keys = key.split('.');
        if (keys.length === 2) {
          user[keys[0]][keys[1]] = filteredUpdates[key];
        } else {
          user[key] = filteredUpdates[key];
        }
      });

      // Recalculate metrics if necessary
      if (requiresRecalculation(filteredUpdates)) {
        await recalculateUserMetrics(user);
      }

      // Save with validation
      await user.save();

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object} User object
   * @throws {Error} If user not found
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare password utility
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} Password match result
   */
  async comparePasswords(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Hash password utility
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }
}

export default new AuthService();