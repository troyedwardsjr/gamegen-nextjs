'use client'

/**
 * Password Reset Form Component for GameGen platform
 * Provides password reset request and new password setting functionality
 */

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardBody, 
  CardHeader,
  Link,
  Alert,
  Progress
} from '@nextui-org/react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/auth/context'
import { validatePassword, getPasswordStrengthColor } from '../../lib/auth/password'
import type { PasswordValidationResult } from '../../lib/auth/password'

interface PasswordResetRequestProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

interface PasswordResetFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  token?: string // Reset token from email link
}

// Password Reset Request Component
export function PasswordResetRequest({
  onSuccess,
  onError,
  className = '',
}: PasswordResetRequestProps) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await resetPassword(email)
      
      if (result.success) {
        setEmailSent(true)
        onSuccess?.()
      } else {
        const errorMessage = result.error || 'Failed to send reset email'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardBody className="text-center space-y-4">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold">Check Your Email</h2>
          <p className="text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            The link will expire in 24 hours for security reasons.
          </p>
          <Button
            variant="light"
            onClick={() => {
              setEmailSent(false)
              setEmail('')
            }}
          >
            Try Different Email
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-2xl font-bold text-center">Reset Password</h2>
          <p className="text-gray-600 text-center mt-1">
            Enter your email to receive a reset link
          </p>
        </div>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert color="danger" variant="flat" title="Error" description={error} />
          )}

          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onValueChange={setEmail}
            isDisabled={isLoading}
            autoComplete="email"
            required
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            isDisabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center">
            <Link href="/auth/login" className="text-primary hover:text-primary-600">
              Back to Login
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

// Password Reset Form Component
export function PasswordResetForm({
  onSuccess,
  onError,
  className = '',
  token,
}: PasswordResetFormProps) {
  const { updatePassword } = useAuth()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null)

  // Validate password in real-time
  React.useEffect(() => {
    if (formData.password) {
      const validation = validatePassword(formData.password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(null)
    }
  }, [formData.password])

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

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
      const result = await updatePassword(formData.password)
      
      if (result.success) {
        onSuccess?.()
      } else {
        const errorMessage = result.error || 'Failed to update password'
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

  const handleInputChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-2xl font-bold text-center">Set New Password</h2>
          <p className="text-gray-600 text-center mt-1">
            Create a strong password for your account
          </p>
        </div>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert color="danger" variant="flat" title="Error" description={errors.general} />
          )}

          {/* New Password Input with Strength Indicator */}
          <div className="space-y-2">
            <Input
              label="New Password"
              placeholder="Enter your new password"
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
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            placeholder="Confirm your new password"
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

          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            isDisabled={isLoading || (passwordValidation && !passwordValidation.isValid)}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>

          <div className="text-center">
            <Link href="/auth/login" className="text-primary hover:text-primary-600">
              Back to Login
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}