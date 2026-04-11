import authService from '../services/auth/authService.js';

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const result = await authService.registerUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      let statusCode = 500;
      let errorCode = 'REGISTRATION_FAILED';
      
      if (error.message.includes('already exists')) {
        statusCode = 409;
        errorCode = 'USER_EXISTS';
      } else if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      }

      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Authenticate user login
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.authenticateUser(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      let statusCode = 500;
      let errorCode = 'LOGIN_FAILED';
      
      if (error.message === 'Invalid email or password') {
        statusCode = 401;
        errorCode = 'INVALID_CREDENTIALS';
      }

      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   */
  async getProfile(req, res) {
    try {
      // User is already attached to req by auth middleware
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch user profile',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const updatedUser = await authService.updateUserProfile(req.userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      let statusCode = 500;
      let errorCode = 'PROFILE_UPDATE_FAILED';
      
      if (error.message === 'User not found') {
        statusCode = 404;
        errorCode = 'USER_NOT_FOUND';
      } else if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      }

      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      // Since we're using stateless JWT tokens, logout is handled client-side
      // This endpoint exists for consistency and future token blacklisting if needed
      res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Verify token endpoint
   * GET /api/v1/auth/verify
   */
  async verifyToken(req, res) {
    try {
      // If we reach here, token is valid (verified by auth middleware)
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'TOKEN_VERIFICATION_FAILED',
          message: 'Failed to verify token',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new AuthController();