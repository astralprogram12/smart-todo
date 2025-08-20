'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface OTPVerificationProps {
  phone: string
  onVerified: (data?: any) => void
  onBack: () => void
  initialTestCode?: string | null
}

export function SimplifiedOTPVerification({ phone, onVerified, onBack, initialTestCode: _, isSignup }: OTPVerificationProps & { isSignup?: boolean }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [verified, setVerified] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [maxAttempts] = useState(5) // Maximum allowed attempts
  const [resendLoading, setResendLoading] = useState(false)
  const [skipVerification] = useState(false)
  
  const { sendSimplifiedWhatsAppOTP, verifySimplifiedWhatsAppOTP } = useAuth()

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !verified) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, verified])

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
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    
    console.log('Verifying OTP code:', otpCode, 'for phone:', phone, 'signup:', isSignup)
    
    if (attempts >= maxAttempts && !skipVerification) {
      setError('Maximum verification attempts exceeded. Please request a new code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Verifying OTP code:', skipVerification ? 'SKIPPED' : otpCode, 'for phone:', phone, 'signup:', isSignup)
      
      // Call the OTP verification Edge Function
      const { data, error } = await verifySimplifiedWhatsAppOTP(phone, otpCode, skipVerification, isSignup)
      
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
          // Pass the verification data to the callback
          onVerified(data)
        }, 2000)
      }
    } catch (err: any) {
      console.error('OTP verification error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    setSuccessMessage('')
    setAttempts(0) // Reset attempts on new code
    setTimeLeft(600) // Reset timer
    setOtp(['', '', '', '', '', '']) // Clear current inputs
    
    try {
      // Call the send OTP Edge Function with smart rate limiting
      const { data, error } = await sendSimplifiedWhatsAppOTP(phone, false, isSignup)
      console.log('Resend OTP response:', data, error)

      if (error) {
        setError(error.message || 'Failed to resend code')
      } else if (data?.success) {
        // Display smart rate limiting message
        const usedExisting = data.used_existing_otp
        const otpAge = data.otp_age_minutes
        
        if (usedExisting) {
          setSuccessMessage(`Code sent ${otpAge} minute${otpAge !== 1 ? 's' : ''} ago - please use the existing code`)
        } else {
          setSuccessMessage('New verification code sent to your WhatsApp')
        }
        
        // Focus first input after successful resend
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0')
          firstInput?.focus()
        }, 100)
      } else {
        setError('Failed to resend code. Please try again.')
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
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
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--nenrin-bark)] mb-2">
            Enter verification code
          </h2>
          <p className="text-[var(--nenrin-sage)]">
            We sent a 6-digit code to {phone} via WhatsApp
          </p>

        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
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
            disabled={loading || (!canAttempt && !skipVerification)}
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
