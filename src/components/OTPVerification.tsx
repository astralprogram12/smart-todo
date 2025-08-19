'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, Beaker } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface OTPVerificationProps {
  phone: string
  onVerified: () => void
  onBack: () => void
  initialTestCode?: string | null
}

export function OTPVerification({ phone, onVerified, onBack, initialTestCode }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [verified, setVerified] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [maxAttempts] = useState(5) // Maximum allowed attempts
  const [resendLoading, setResendLoading] = useState(false)
  const [testCode, setTestCode] = useState<string | null>(initialTestCode || null)
  
  const { sendWhatsAppOTP, verifyWhatsAppOTP, isTestMode } = useAuth()

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !verified) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, verified])
  
  // Auto-fill test code when in test mode and we have a code
  useEffect(() => {
    if (isTestMode && testCode && testCode.length === 6) {
      // We don't automatically fill the code to allow the user to manually enter it if they want
      // But we do offer the auto-fill button in the UI
      console.log('Test code available for auto-fill:', testCode)
    }
  }, [isTestMode, testCode])

  // Update test code if initialTestCode changes
  useEffect(() => {
    if (initialTestCode) {
      setTestCode(initialTestCode)
      console.log('Test code updated from prop:', initialTestCode)
    }
  }, [initialTestCode])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digits
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
    
    // Auto-submit if all digits are filled
    if (index === 5 && value && newOtp.every(digit => digit.trim() !== '')) {
      console.log('Auto-submitting OTP:', newOtp.join(''))
      setTimeout(() => handleVerify(), 300)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('').trim()
    console.log('Debug: OTP validation', {
      otp: otp,
      otpCode: otpCode,
      length: otpCode.length
    })
    
    if (otpCode.length !== 6) {
      setError(`Please enter the complete 6-digit code (entered: ${otpCode.length} digits)`)
      return
    }

    if (attempts >= maxAttempts) {
      setError('Maximum verification attempts exceeded. Please request a new code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Verifying OTP code:', otpCode, 'for phone:', phone)
      // Call the OTP verification Edge Function
      const { data, error } = await verifyWhatsAppOTP(phone, otpCode)
      
      console.log('OTP verification response:', data, error)

      if (error) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        // Enhanced error messages with attempt tracking
        const remainingAttempts = maxAttempts - newAttempts
        if (remainingAttempts > 0) {
          setError(`Invalid code. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`)
        } else {
          setError('Maximum verification attempts exceeded. Please request a new code.')
        }
        
        // Clear the OTP inputs on failed attempt
        setOtp(['', '', '', '', '', ''])
        const firstInput = document.getElementById('otp-0')
        firstInput?.focus()
      } else if (!data?.success) {
        // Handle non-error failure cases
        setError(data?.message || 'Verification failed. Please try again.')
        setOtp(['', '', '', '', '', ''])
        const firstInput = document.getElementById('otp-0')
        firstInput?.focus()
      } else {
        // Success!
        console.log('OTP verification successful!')
        setVerified(true)
        setTimeout(() => {
          onVerified()
        }, 2000)
      }
    } catch (err: any) {
      console.error('OTP verification error:', err)
      setError('Network error. Please try again.')
      // Log detailed error information
      if (err.response) {
        console.error('Error response:', err.response)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    setAttempts(0) // Reset attempts on new code
    setTimeLeft(600) // Reset timer
    setOtp(['', '', '', '', '', '']) // Clear current inputs
    setTestCode(null) // Clear test code
    
    try {
      // Call the send OTP Edge Function
      const { data, error } = await sendWhatsAppOTP(phone)
      console.log('Resend OTP response:', data, error)

      if (error) {
        setError(error.message || 'Failed to resend code')
      } else {
        // For development only - store the test code if available
        if (data?.debug?.testCode) {
          setTestCode(data.debug.testCode)
          console.log('Test code received:', data.debug.testCode)
        }
        
        // Focus first input after successful resend
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0')
          firstInput?.focus()
        }, 100)
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }
  
  // Auto-fill test code (for test mode)
  const fillTestCode = () => {
    if (testCode && testCode.length === 6) {
      const codeArray = testCode.split('')
      setOtp(codeArray)
    } else if (isTestMode) {
      // If we're in test mode but don't have a generated code, use the special test code
      setOtp(['1','2','3','4','5','6'])
    }
  }

  if (verified) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--nenrin-bark)] mb-2">
              Verification Successful!
            </h2>
            <p className="text-[var(--nenrin-sage)]">
              Your WhatsApp is now connected. Redirecting you...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = timeLeft <= 0
  const canAttempt = attempts < maxAttempts && !isExpired

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-md space-y-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--nenrin-bark)] mb-2">
            Enter verification code
          </h2>
          <p className="text-[var(--nenrin-sage)]">
            We sent a 6-digit code to {phone} via WhatsApp
          </p>
          
          {/* Test Mode Indicator */}
          {isTestMode && (
            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-medium">
              <Beaker className="w-3.5 h-3.5 mr-1" />
              Test Mode Enabled
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP information for test mode */}
        {isTestMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <Beaker className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700">Test Mode is Active</p>
                <p className="text-sm mt-1">In test mode, you can use:</p>
                <ul className="list-disc ml-5 text-sm mt-1 space-y-1">
                  <li>Generated code: <span className="font-mono font-medium bg-blue-100 px-1 rounded">{testCode || '123456'}</span></li>
                  <li>Special test code: <span className="font-mono font-medium bg-blue-100 px-1 rounded">123456</span></li>
                  <li><button onClick={fillTestCode} className="text-xs font-medium bg-blue-600 text-white py-0.5 px-2 rounded hover:bg-blue-700 transition-colors">Auto-fill code</button></li>
                </ul>
                <p className="text-sm mt-2">No actual WhatsApp message is sent in test mode.</p>
              </div>
            </div>
          </div>
        )}

        {/* Attempt counter */}
        {attempts > 0 && (
          <div className="text-center text-sm text-[var(--nenrin-sage)]">
            Attempts: {attempts}/{maxAttempts}
          </div>
        )}

        <div className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={!canAttempt || loading}
                className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg focus:outline-none transition-colors ${
                  !canAttempt || loading
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-[var(--nenrin-mist)] focus:border-[var(--nenrin-forest)]'
                }`}
              />
            ))}
          </div>

          {/* Timer and Status */}
          <div className="text-center space-y-2">
            {!isExpired ? (
              <p className="text-sm text-[var(--nenrin-sage)]">
                Code expires in <span className="font-medium text-[var(--nenrin-forest)]">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 font-medium">
                Code expired. Please request a new one.
              </p>
            )}
            
            {attempts >= maxAttempts && (
              <p className="text-sm text-red-600 font-medium">
                Maximum attempts reached. Please request a new code.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6 || !canAttempt}
            className="w-full bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resendLoading || (!isExpired && attempts < maxAttempts)}
              className="text-sm text-[var(--nenrin-forest)] hover:text-[var(--forest-hover)] disabled:text-[var(--nenrin-sage)] disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-1"
            >
              {resendLoading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              <span>
                {resendLoading ? 'Sending...' : 
                 isExpired || attempts >= maxAttempts ? 'Resend code' : 
                 `Resend in ${formatTime(timeLeft)}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
