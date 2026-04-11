import authService from '../services/auth/authService.js';

/**
 * Authentication middleware to protect routes
 * Validates JWT token and adds user info to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Get user details and add to request
    const user = await authService.getUserById(decoded.userId);
    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    let errorCode = 'AUTHENTICATION_FAILED';
    let message = 'Authentication failed';

    if (error.message === 'Token has expired') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Token has expired';
    } else if (error.message === 'Invalid token') {
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid token';
    } else if (error.message === 'User not found') {
      errorCode = 'USER_NOT_FOUND';
      message = 'User not found';
    }

    return res.status(401).json({
      error: {
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present and valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        const user = await authService.getUserById(decoded.userId);
        req.user = user;
        req.userId = decoded.userId;
      } catch (error) {
        // Ignore token errors for optional auth
        req.user = null;
        req.userId = null;
      }
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    // For optional auth, continue even if there's an error
    req.user = null;
    req.userId = null;
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 * Should be used after authenticateToken middleware
 */
export const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam];
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID parameter is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (req.userId !== resourceUserId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only access your own resources',
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};