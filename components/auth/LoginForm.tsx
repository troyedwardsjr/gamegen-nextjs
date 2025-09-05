'use client'

/**
 * Login Form Component for GameGen platform
 * Provides email/password login with comprehensive validation and security features
 */

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardBody, 
  CardHeader,
  Divider,
  Link,
  Checkbox,
  Spinner,
  Alert
} from '@nextui-org/react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/auth/context'
import { SocialLoginButtons } from './SocialLogin'
import { validatePassword } from '../../lib/auth/password'

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onMFARequired?: () => void
  redirectTo?: string
  className?: string
  title?: string
  showSocialLogin?: boolean
  showRememberMe?: boolean
  showSignupLink?: boolean
  showForgotPassword?: boolean
}

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm({
  onSuccess,
  onError,
  onMFARequired,
  redirectTo,
  className = '',
  title = 'Welcome back',
  showSocialLogin = true,
  showRememberMe = true,
  showSignupLink = true,
  showForgotPassword = true,
}: LoginFormProps) {
  const { signIn } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
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
      const result = await signIn(formData.email, formData.password, formData.rememberMe)
      
      if (result.success) {
        onSuccess?.()
      } else if (result.requiresMFA) {
        onMFARequired?.()
      } else {
        setAttemptCount(prev => prev + 1)
        const errorMessage = result.error || 'Login failed'
        
        // Show additional security warnings after multiple failures
        if (attemptCount >= 2) {
          setErrors({
            general: `${errorMessage}. Account may be locked after ${5 - attemptCount} more failed attempts.`
          })
        } else {
          setErrors({ general: errorMessage })
        }
        
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
    console.log(`Successfully signed in with ${provider}`)
    onSuccess?.()
  }

  const handleSocialError = (error: string, provider: string) => {
    console.error(`${provider} authentication error:`, error)
    setErrors({ general: `${provider} authentication failed: ${error}` })
    onError?.(error)
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-2xl font-bold text-center">{title}</h2>
          <p className="text-gray-600 text-center mt-1">
            Sign in to your GameGen account
          </p>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Social Login */}
        {showSocialLogin && (
          <>
            <SocialLoginButtons
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

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Alert */}
          {errors.general && (
            <Alert
              color="danger"
              variant="flat"
              title="Authentication Error"
              description={errors.general}
            />
          )}

          {/* Email Input */}
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onValueChange={handleInputChange('email')}
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            isDisabled={isLoading}
            autoComplete="email"
            required
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onValueChange={handleInputChange('password')}
            isInvalid={!!errors.password}
            errorMessage={errors.password}
            isDisabled={isLoading}
            autoComplete="current-password"
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

          {/* Remember Me Checkbox */}
          {showRememberMe && (
            <div className="flex justify-between items-center">
              <Checkbox
                isSelected={formData.rememberMe}
                onValueChange={handleInputChange('rememberMe')}
                isDisabled={isLoading}
                size="sm"
              >
                Remember me
              </Checkbox>
              
              {showForgotPassword && (
                <Link
                  href="/auth/forgot-password"
                  size="sm"
                  className="text-primary hover:text-primary-600"
                >
                  Forgot password?
                </Link>
              )}
            </div>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Account Lockout Warning */}
          {attemptCount >= 3 && (
            <div className="text-center text-sm text-warning mt-2">
              Multiple failed attempts detected. Your account may be temporarily locked for security.
            </div>
          )}
        </form>

        {/* Sign Up Link */}
        {showSignupLink && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              href="/auth/signup"
              className="text-primary hover:text-primary-600 font-medium"
            >
              Sign up for free
            </Link>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Your connection is secure and encrypted
        </div>
      </CardBody>
    </Card>
  )
}

// Specialized login forms for different contexts
export function SimpleLoginForm(props: Omit<LoginFormProps, 'showSocialLogin' | 'showRememberMe' | 'showSignupLink'>) {
  return (
    <LoginForm
      {...props}
      showSocialLogin={false}
      showRememberMe={false}
      showSignupLink={false}
    />
  )
}

export function FullLoginForm(props: LoginFormProps) {
  return (
    <LoginForm
      {...props}
      showSocialLogin={true}
      showRememberMe={true}
      showSignupLink={true}
      showForgotPassword={true}
    />
  )
}

// Modal version for embedded login
export function LoginModal({ 
  isOpen, 
  onClose, 
  ...loginProps 
}: LoginFormProps & { 
  isOpen: boolean
  onClose: () => void 
}) {
  const handleSuccess = () => {
    loginProps.onSuccess?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4">
        <LoginForm
          {...loginProps}
          onSuccess={handleSuccess}
          className="relative"
        />
        <Button
          isIconOnly
          variant="light"
          className="absolute -top-2 -right-2 bg-white shadow-md"
          onClick={onClose}
        >
          ×
        </Button>
      </div>
    </div>
  )
}