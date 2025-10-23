/**
 * Validation Middleware
 * Validates and sanitizes user inputs to prevent XSS and other attacks
 */

export const validateMessage = (req, res, next) => {
  const { message } = req.body;
  
  // Check if message exists
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Message is required and must be a string' 
    });
  }
  
  // Trim message
  const trimmedMessage = message.trim();
  
  if (!trimmedMessage) {
    return res.status(400).json({ 
      success: false,
      error: 'Message cannot be empty' 
    });
  }
  
  // Check message length
  if (trimmedMessage.length > 5000) {
    return res.status(400).json({ 
      success: false,
      error: 'Message too long (maximum 5000 characters)' 
    });
  }
  
  if (trimmedMessage.length < 1) {
    return res.status(400).json({ 
      success: false,
      error: 'Message too short (minimum 1 character)' 
    });
  }
  
  // Basic XSS prevention - remove script tags
  const sanitized = trimmedMessage.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Check for potential SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi;
  if (sqlPatterns.test(sanitized)) {
    return res.status(400).json({
      success: false,
      error: 'Message contains invalid characters'
    });
  }
  
  req.body.message = sanitized;
  next();
};

export const validateConversationUpdate = (req, res, next) => {
  const { title, is_favourite, is_archived } = req.body;
  
  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Title must be a string' 
      });
    }
    
    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length > 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Title too long (maximum 200 characters)' 
      });
    }
    
    req.body.title = trimmedTitle;
  }
  
  // Validate boolean fields
  if (is_favourite !== undefined && typeof is_favourite !== 'boolean') {
    return res.status(400).json({ 
      success: false,
      error: 'is_favourite must be a boolean' 
    });
  }
  
  if (is_archived !== undefined && typeof is_archived !== 'boolean') {
    return res.status(400).json({ 
      success: false,
      error: 'is_archived must be a boolean' 
    });
  }
  
  next();
};

export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Email is required' 
    });
  }
  
  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid email format' 
    });
  }
  
  req.body.email = email.toLowerCase().trim();
  next();
};

export const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Password is required' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false,
      error: 'Password must be at least 6 characters long' 
    });
  }
  
  if (password.length > 100) {
    return res.status(400).json({ 
      success: false,
      error: 'Password too long (maximum 100 characters)' 
    });
  }
  
  next();
};

export const validateDisplayName = (req, res, next) => {
  const { displayName } = req.body;
  
  if (displayName !== undefined) {
    if (typeof displayName !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Display name must be a string' 
      });
    }
    
    const trimmed = displayName.trim();
    
    if (trimmed.length > 100) {
      return res.status(400).json({ 
        success: false,
        error: 'Display name too long (maximum 100 characters)' 
      });
    }
    
    req.body.displayName = trimmed;
  }
  
  next();
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

