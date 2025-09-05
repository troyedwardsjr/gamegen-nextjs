'use client'

/**
 * Multi-Factor Authentication (MFA) Components for GameGen platform
 * Provides TOTP setup, verification, and backup code management
 */

import React, { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Card, 
  CardBody, 
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Alert,
  Code,
  Divider
} from '@nextui-org/react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../lib/auth/context'

interface MFASetupProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onCancel?: () => void
  className?: string
}

interface MFAVerificationProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onCancel?: () => void
  allowBackupCodes?: boolean
  className?: string
}

interface TOTPSetupData {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
  manualEntryKey: string
}

// MFA Setup Component
export function MFASetup({
  onSuccess,
  onError,
  onCancel,
  className = '',
}: MFASetupProps) {
  const { enableMFA, verifyMFA } = useAuth()
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup'>('method')
  const [setupData, setSetupData] = useState<TOTPSetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMethodSelect = async (method: 'totp' | 'sms' | 'email') => {
    setIsLoading(true)
    setError('')

    try {
      const result = await enableMFA(method)
      
      if (method === 'totp' && typeof result === 'object') {
        setSetupData(result as TOTPSetupData)
        setStep('setup')
      } else if (result === true) {
        // SMS/Email MFA enabled successfully
        onSuccess?.()
      } else {
        setError('Failed to enable MFA')
        onError?.('Failed to enable MFA')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MFA setup failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTOTPVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await verifyMFA(verificationCode, 'totp')
      
      if (result.success) {
        setStep('backup')
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    onSuccess?.()
  }

  return (
    <Card className={`w-full max-w-lg ${className}`}>
      <CardHeader>
        <div className="w-full">
          <h2 className="text-2xl font-bold">Enable Multi-Factor Authentication</h2>
          <p className="text-gray-600 mt-1">Add an extra layer of security to your account</p>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {error && (
          <Alert color="danger" variant="flat" title="Error" description={error} />
        )}

        {/* Step 1: Method Selection */}
        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose your preferred method</h3>
            
            <Button
              variant="bordered"
              size="lg"
              className="w-full h-auto p-4"
              onClick={() => handleMethodSelect('totp')}
              isLoading={isLoading}
            >
              <div className="text-left">
                <div className="font-semibold">Authenticator App (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Use Google Authenticator, Authy, or similar apps
                </div>
              </div>
            </Button>

            <Button
              variant="bordered"
              size="lg"
              className="w-full h-auto p-4"
              onClick={() => handleMethodSelect('sms')}
              isLoading={isLoading}
            >
              <div className="text-left">
                <div className="font-semibold">SMS Text Message</div>
                <div className="text-sm text-gray-600">
                  Receive codes via text message
                </div>
              </div>
            </Button>

            <Button
              variant="bordered"
              size="lg"
              className="w-full h-auto p-4"
              onClick={() => handleMethodSelect('email')}
              isLoading={isLoading}
            >
              <div className="text-left">
                <div className="font-semibold">Email Verification</div>
                <div className="text-sm text-gray-600">
                  Receive codes via email
                </div>
              </div>
            </Button>

            <Button variant="light" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2: TOTP Setup */}
        {step === 'setup' && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">
                Scan QR Code with your Authenticator App
              </h3>
              
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-lg border">
                  <QRCodeSVG value={setupData.qrCodeUrl} size={200} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Can't scan? Enter this code manually:
                </p>
                <Code className="break-all text-xs px-2 py-1">
                  {setupData.manualEntryKey}
                </Code>
              </div>
            </div>

            <Button
              color="primary"
              onClick={() => setStep('verify')}
              className="w-full"
            >
              Continue to Verification
            </Button>

            <Button variant="light" onClick={onCancel} className="w-full">
              Cancel Setup
            </Button>
          </div>
        )}

        {/* Step 3: Verification */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Enter Verification Code
              </h3>
              <p className="text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onValueChange={setVerificationCode}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              size="lg"
              autoComplete="one-time-code"
            />

            <Button
              color="primary"
              size="lg"
              className="w-full"
              onClick={handleTOTPVerification}
              isLoading={isLoading}
              isDisabled={verificationCode.length !== 6}
            >
              Verify Code
            </Button>

            <Button
              variant="light"
              onClick={() => setStep('setup')}
              className="w-full"
            >
              Back to QR Code
            </Button>
          </div>
        )}

        {/* Step 4: Backup Codes */}
        {step === 'backup' && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                MFA Successfully Enabled!
              </h3>
              <p className="text-gray-600 mb-4">
                Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <Code key={index} className="text-center font-mono">
                    {code}
                  </Code>
                ))}
              </div>
            </div>

            <Alert
              color="warning"
              variant="flat"
              title="Important"
              description="These backup codes will only be shown once. Store them securely!"
            />

            <Button
              color="success"
              size="lg"
              className="w-full"
              onClick={handleComplete}
            >
              I've Saved My Backup Codes
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// MFA Verification Component
export function MFAVerification({
  onSuccess,
  onError,
  onCancel,
  allowBackupCodes = true,
  className = '',
}: MFAVerificationProps) {
  const { verifyMFA } = useAuth()
  const [code, setCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  const handleVerification = async () => {
    if (!code || (useBackupCode ? code.length !== 8 : code.length !== 6)) {
      setError(`Please enter a ${useBackupCode ? '8-digit backup' : '6-digit'} code`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await verifyMFA(code, useBackupCode ? 'backup_code' : 'totp')
      
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Invalid code')
        onError?.(result.error || 'Invalid code')
        
        if (result.remaining_attempts !== undefined) {
          setAttemptsRemaining(result.remaining_attempts)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerification()
    }
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
          <p className="text-gray-600 mt-1">
            Enter your {useBackupCode ? 'backup code' : 'authenticator code'} to continue
          </p>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {error && (
          <Alert color="danger" variant="flat" title="Verification Failed" description={error} />
        )}

        {attemptsRemaining !== null && attemptsRemaining > 0 && (
          <Alert
            color="warning"
            variant="flat"
            title="Backup Codes"
            description={`You have ${attemptsRemaining} backup codes remaining.`}
          />
        )}

        <div className="space-y-4">
          <Input
            type="text"
            label={useBackupCode ? 'Backup Code' : 'Authenticator Code'}
            placeholder={useBackupCode ? '12345678' : '000000'}
            value={code}
            onValueChange={setCode}
            onKeyPress={handleKeyPress}
            maxLength={useBackupCode ? 8 : 6}
            className="text-center text-2xl tracking-widest"
            size="lg"
            autoComplete="one-time-code"
            autoFocus
          />

          <Button
            color="primary"
            size="lg"
            className="w-full"
            onClick={handleVerification}
            isLoading={isLoading}
            isDisabled={!code || (useBackupCode ? code.length !== 8 : code.length !== 6)}
          >
            Verify
          </Button>
        </div>

        {allowBackupCodes && (
          <>
            <Divider />
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {useBackupCode ? "Don't have your backup code?" : "Can't access your authenticator?"}
              </p>
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setCode('')
                  setError('')
                }}
              >
                {useBackupCode ? 'Use Authenticator Code' : 'Use Backup Code'}
              </Button>
            </div>
          </>
        )}

        <div className="text-center">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

// MFA Management Component (for settings)
export function MFAManagement() {
  const { user, disableMFA } = useAuth()
  const [showSetup, setShowSetup] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable multi-factor authentication? This will make your account less secure.')) {
      return
    }

    setIsLoading(true)
    try {
      const success = await disableMFA()
      if (success) {
        alert('MFA has been disabled')
      } else {
        alert('Failed to disable MFA')
      }
    } catch (error) {
      alert('Error disabling MFA')
    } finally {
      setIsLoading(false)
    }
  }

  const mfaEnabled = false // This would come from user profile/context

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Multi-Factor Authentication</h3>
          <p className="text-gray-600 text-sm">
            Add an extra layer of security to your account
          </p>
        </div>
        <Chip
          color={mfaEnabled ? 'success' : 'default'}
          variant="flat"
        >
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </Chip>
      </div>

      <div className="flex gap-2">
        {!mfaEnabled ? (
          <Button
            color="primary"
            onClick={() => setShowSetup(true)}
          >
            Enable MFA
          </Button>
        ) : (
          <>
            <Button
              color="danger"
              variant="light"
              onClick={handleDisableMFA}
              isLoading={isLoading}
            >
              Disable MFA
            </Button>
            <Button
              variant="bordered"
              onClick={() => setShowVerification(true)}
            >
              Test MFA
            </Button>
          </>
        )}
      </div>

      {/* Setup Modal */}
      <Modal
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalBody className="p-0">
            <MFASetup
              onSuccess={() => {
                setShowSetup(false)
                alert('MFA enabled successfully!')
              }}
              onError={(error) => alert(`MFA setup failed: ${error}`)}
              onCancel={() => setShowSetup(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Verification Modal */}
      <Modal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        size="lg"
      >
        <ModalContent>
          <ModalBody className="p-0">
            <MFAVerification
              onSuccess={() => {
                setShowVerification(false)
                alert('MFA verification successful!')
              }}
              onError={(error) => alert(`Verification failed: ${error}`)}
              onCancel={() => setShowVerification(false)}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
}