'use client'

/**
 * Signup Form Component for GameGen platform
 * Provides registration with password strength validation and email verification
 */

import React, { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardBody, 
  CardHeader,
  Divider,
  Link,
  Checkbox,
  Progress,
  Alert
} from '@nextui-org/react'
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/auth/context'
import { SocialSignupButtons } from './SocialLogin'
import { validatePassword, getPasswordStrengthColor } from '../../lib/auth/password'
import type { PasswordValidationResult } from '../../lib/auth/password'

interface SignupFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onEmailVerificationRequired?: () => void
  redirectTo?: string
  className?: string
  title?: string
  showSocialSignup?: boolean
  showLoginLink?: boolean
  requireTermsAcceptance?: boolean
  requireNewsletterOptIn?: boolean
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  subscribeNewsletter: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: string
  general?: string
}

export function SignupForm({
  onSuccess,
  onError,
  onEmailVerificationRequired,
  redirectTo,
  className = '',
  title = 'Create your account',
  showSocialSignup = true,
  showLoginLink = true,
  requireTermsAcceptance = true,
  requireNewsletterOptIn = false,
}: SignupFormProps) {
  const { signUp } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: false,
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null)

  // Validate password in real-time
  useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(null)
    }
  }, [formData.password])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordValidation?.isValid) {
      newErrors.password = passwordValidation?.errors[0] || 'Password does not meet requirements'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Terms acceptance validation
    if (requireTermsAcceptance && !formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms of Service'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const metadata = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        subscribe_newsletter: formData.subscribeNewsletter,
      }

      const result = await signUp(formData.email, formData.password, metadata)
      
      if (result.success) {
        if (result.requiresEmailVerification) {
          onEmailVerificationRequired?.()
        } else {
          onSuccess?.()
        }
      } else {
        const errorMessage = result.error || 'Registration failed'
        setErrors({ general: errorMessage })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setErrors({ general: errorMessage })
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }
  }

  const handleSocialSuccess = (provider: string) => {
    console.log(`Successfully signed up with ${provider}`)
    onSuccess?.()
  }

  const handleSocialError = (error: string, provider: string) => {
    console.error(`${provider} registration error:`, error)
    setErrors({ general: `${provider} registration failed: ${error}` })
    onError?.(error)
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-2xl font-bold text-center">{title}</h2>
          <p className="text-gray-600 text-center mt-1">
            Join GameGen and start creating amazing games
          </p>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Social Signup */}
        {showSocialSignup && (
          <>
            <SocialSignupButtons
              onSuccess={handleSocialSuccess}
              onError={handleSocialError}
              redirectTo={redirectTo}
              buttonVariant="bordered"
              buttonSize="md"
            />
            
            <div className="relative my-6">
              <Divider />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                or
              </span>
            </div>
          </>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Alert */}
          {errors.general && (
            <Alert
              color="danger"
              variant="flat"
              title="Registration Error"
              description={errors.general}
            />
          )}

          {/* Name Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onValueChange={handleInputChange('firstName')}
              isInvalid={!!errors.firstName}
              errorMessage={errors.firstName}
              isDisabled={isLoading}
              autoComplete="given-name"
              required
            />
            
            <Input
              type="text"
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onValueChange={handleInputChange('lastName')}
              isInvalid={!!errors.lastName}
              errorMessage={errors.lastName}
              isDisabled={isLoading}
              autoComplete="family-name"
              required
            />
          </div>

          {/* Email Input */}
          <Input
            type="email"
            label="Email"
            placeholder="john@example.com"
            value={formData.email}
            onValueChange={handleInputChange('email')}
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            isDisabled={isLoading}
            autoComplete="email"
            required
          />

          {/* Password Input with Strength Indicator */}
          <div className="space-y-2">
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onValueChange={handleInputChange('password')}
              isInvalid={!!errors.password}
              errorMessage={errors.password}
              isDisabled={isLoading}
              autoComplete="new-password"
              type={showPassword ? 'text' : 'password'}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              }
              required
            />
            
            {/* Password Strength Indicator */}
            {passwordValidation && formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Password strength:</span>
                  <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                    {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                  </span>
                </div>
                <Progress
                  value={passwordValidation.score}
                  className="w-full"
                  color={
                    passwordValidation.strength === 'strong' ? 'success' :
                    passwordValidation.strength === 'good' ? 'primary' :
                    passwordValidation.strength === 'fair' ? 'warning' : 'danger'
                  }
                />
                
                {/* Password Requirements */}
                <div className="text-xs space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1 text-red-500">
                      <XMarkIcon className="w-3 h-3" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {passwordValidation.isValid && (
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckIcon className="w-3 h-3" />
                      <span>Password meets all requirements</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onValueChange={handleInputChange('confirmPassword')}
            isInvalid={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
            isDisabled={isLoading}
            autoComplete="new-password"
            type={showConfirmPassword ? 'text' : 'password'}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            }
            required
          />

          {/* Terms Acceptance */}
          {requireTermsAcceptance && (
            <div className="space-y-2">
              <Checkbox
                isSelected={formData.acceptTerms}
                onValueChange={handleInputChange('acceptTerms')}
                isDisabled={isLoading}
                isInvalid={!!errors.acceptTerms}
                size="sm"
              >
                <span className="text-sm">
                  I accept the{' '}
                  <Link href="/terms" target="_blank" size="sm" className="text-primary">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" size="sm" className="text-primary">
                    Privacy Policy
                  </Link>
                </span>
              </Checkbox>
              {errors.acceptTerms && (
                <p className="text-red-500 text-xs">{errors.acceptTerms}</p>
              )}
            </div>
          )}

          {/* Newsletter Opt-in */}
          <Checkbox
            isSelected={formData.subscribeNewsletter}
            onValueChange={handleInputChange('subscribeNewsletter')}
            isDisabled={isLoading}
            size="sm"
          >
            <span className="text-sm text-gray-600">
              Subscribe to our newsletter for game development tips and updates
              {requireNewsletterOptIn && <span className="text-red-500"> *</span>}
            </span>
          </Checkbox>

          {/* Sign Up Button */}
          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            isDisabled={isLoading || (passwordValidation && !passwordValidation.isValid)}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {/* Login Link */}
        {showLoginLink && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary-600 font-medium"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Your information is secure and encrypted. We'll never share your data.
        </div>
      </CardBody>
    </Card>
  )
}

// Simplified signup form without social options
export function SimpleSignupForm(props: Omit<SignupFormProps, 'showSocialSignup' | 'showLoginLink'>) {
  return (
    <SignupForm
      {...props}
      showSocialSignup={false}
      showLoginLink={false}
    />
  )
}

// Full-featured signup form
export function FullSignupForm(props: SignupFormProps) {
  return (
    <SignupForm
      {...props}
      showSocialSignup={true}
      showLoginLink={true}
      requireTermsAcceptance={true}
    />
  )