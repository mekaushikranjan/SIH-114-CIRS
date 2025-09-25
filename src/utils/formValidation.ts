export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormField {
  value: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

export interface FormValidationRules {
  [key: string]: FormField;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation regex (supports Indian format)
const PHONE_REGEX = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;

// Password strength regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Name validation regex (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s\-'\.]+$/;

// OTP validation regex (6 digits)
const OTP_REGEX = /^\d{6}$/;

export class FormValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email.trim()) {
      errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.push('Please enter a valid email address');
    } else if (email.length > 254) {
      errors.push('Email address is too long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    if (!phone.trim()) {
      errors.push('Phone number is required');
    } else if (!PHONE_REGEX.test(cleanPhone)) {
      errors.push('Please enter a valid Indian phone number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string, options?: {
    minLength?: number;
    requireStrong?: boolean;
  }): ValidationResult {
    const errors: string[] = [];
    const minLength = options?.minLength || 6;
    const requireStrong = options?.requireStrong || false;
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
      }
      
      if (password.length > 128) {
        errors.push('Password is too long (max 128 characters)');
      }
      
      if (requireStrong && !STRONG_PASSWORD_REGEX.test(password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }
      
      // Check for common weak passwords
      const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
      if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Please choose a stronger password');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password confirmation
   */
  static validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];
    
    if (!confirmPassword) {
      errors.push('Please confirm your password');
    } else if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate full name
   */
  static validateName(name: string, options?: {
    minLength?: number;
    maxLength?: number;
  }): ValidationResult {
    const errors: string[] = [];
    const minLength = options?.minLength || 2;
    const maxLength = options?.maxLength || 50;
    
    if (!name.trim()) {
      errors.push('Name is required');
    } else {
      const trimmedName = name.trim();
      
      if (trimmedName.length < minLength) {
        errors.push(`Name must be at least ${minLength} characters long`);
      }
      
      if (trimmedName.length > maxLength) {
        errors.push(`Name must be less than ${maxLength} characters`);
      }
      
      if (!NAME_REGEX.test(trimmedName)) {
        errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
      }
      
      // Check for reasonable name format (at least one space for full name)
      if (minLength > 2 && !trimmedName.includes(' ')) {
        errors.push('Please enter your full name (first and last name)');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate OTP code
   */
  static validateOTP(otp: string): ValidationResult {
    const errors: string[] = [];
    
    if (!otp.trim()) {
      errors.push('OTP is required');
    } else if (!OTP_REGEX.test(otp.trim())) {
      errors.push('OTP must be exactly 6 digits');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a form with multiple fields
   */
  static validateForm(rules: FormValidationRules): ValidationResult {
    const allErrors: string[] = [];
    let isValid = true;
    
    Object.entries(rules).forEach(([fieldName, field]) => {
      const fieldErrors: string[] = [];
      
      // Required field validation
      if (field.required && !field.value.trim()) {
        fieldErrors.push(`${fieldName} is required`);
        isValid = false;
      }
      
      // Skip other validations if field is empty and not required
      if (!field.value.trim() && !field.required) {
        return;
      }
      
      // Length validations
      if (field.minLength && field.value.length < field.minLength) {
        fieldErrors.push(`${fieldName} must be at least ${field.minLength} characters long`);
        isValid = false;
      }
      
      if (field.maxLength && field.value.length > field.maxLength) {
        fieldErrors.push(`${fieldName} must be less than ${field.maxLength} characters`);
        isValid = false;
      }
      
      // Pattern validation
      if (field.pattern && !field.pattern.test(field.value)) {
        fieldErrors.push(`${fieldName} format is invalid`);
        isValid = false;
      }
      
      // Custom validation
      if (field.customValidator) {
        const customError = field.customValidator(field.value);
        if (customError) {
          fieldErrors.push(customError);
          isValid = false;
        }
      }
      
      allErrors.push(...fieldErrors);
    });
    
    return {
      isValid,
      errors: allErrors
    };
  }

  /**
   * Validate login form
   */
  static validateLoginForm(email: string, password: string): ValidationResult {
    const emailValidation = this.validateEmail(email);
    const passwordValidation = this.validatePassword(password);
    
    return {
      isValid: emailValidation.isValid && passwordValidation.isValid,
      errors: [...emailValidation.errors, ...passwordValidation.errors]
    };
  }

  /**
   * Validate registration form
   */
  static validateRegistrationForm(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }): ValidationResult {
    const nameValidation = this.validateName(data.name, { minLength: 3 });
    const emailValidation = this.validateEmail(data.email);
    const phoneValidation = data.phone ? this.validatePhone(data.phone) : { isValid: true, errors: [] };
    const passwordValidation = this.validatePassword(data.password, { minLength: 6, requireStrong: true });
    const confirmPasswordValidation = this.validatePasswordConfirmation(data.password, data.confirmPassword);
    
    const allErrors = [
      ...nameValidation.errors,
      ...emailValidation.errors,
      ...phoneValidation.errors,
      ...passwordValidation.errors,
      ...confirmPasswordValidation.errors
    ];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Validate forgot password form
   */
  static validateForgotPasswordForm(email: string): ValidationResult {
    return this.validateEmail(email);
  }

  /**
   * Real-time field validation for better UX
   */
  static validateFieldRealTime(fieldType: string, value: string, options?: any): ValidationResult {
    switch (fieldType) {
      case 'email':
        return this.validateEmail(value);
      case 'phone':
        return this.validatePhone(value);
      case 'password':
        return this.validatePassword(value, options);
      case 'name':
        return this.validateName(value, options);
      case 'otp':
        return this.validateOTP(value);
      default:
        return { isValid: true, errors: [] };
    }
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Check password strength and return score
   */
  static getPasswordStrength(password: string): {
    score: number; // 0-4
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('Use at least 8 characters');
    }
    
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add lowercase letters');
    }
    
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add uppercase letters');
    }
    
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Add numbers');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
      feedback.push('Great! Special characters make it stronger');
    } else {
      feedback.push('Consider adding special characters');
    }
    
    return { score: Math.min(score, 4), feedback };
  }
}

// Export commonly used regex patterns
export const ValidationPatterns = {
  EMAIL: EMAIL_REGEX,
  PHONE: PHONE_REGEX,
  STRONG_PASSWORD: STRONG_PASSWORD_REGEX,
  NAME: NAME_REGEX,
  OTP: OTP_REGEX,
};

// Export validation messages
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password is too weak',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_NAME: 'Please enter a valid name',
  INVALID_OTP: 'Please enter a valid 6-digit OTP',
};
