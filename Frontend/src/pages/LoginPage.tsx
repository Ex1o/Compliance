import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const testimonials = [
  { quote: '₹4,200 penalty avoided', attribution: 'Rajesh Agarwal, Surat' },
  { quote: '3 hours saved per week', attribution: 'CA Priya Sharma, Pune' },
  { quote: '₹15,000 saved last quarter', attribution: 'Sunita Mehta, Bengaluru' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, skipOtp } = useAuthStore();
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Validate mobile number (Indian format: starts with 6,7,8,9)
  const isValidMobile = /^[6-9]\d{9}$/.test(mobile);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

  const handleSendOTP = async () => {
    if (isValidMobile) {
      setLoading(true);
      setError('');
      try {
        const res = await sendOtp(mobile);
        setResendTimer(res.expiresIn || 10);
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please enter a valid mobile number.');
    }
  };

  const handleVerifyOTP = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { isNewUser } = await verifyOtp(mobile, otpValue);
      navigate(isNewUser ? '/onboarding' : '/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { isNewUser } = await skipOtp(mobile || undefined);
      navigate(isNewUser ? '/onboarding' : '/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer === 0) {
      setLoading(true);
      setError('');
      try {
        const res = await sendOtp(mobile);
        setResendTimer(res.expiresIn || 10);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      void handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <Link to="/" className="block mb-8">
            <span className="font-display text-2xl text-foreground">
              Compliance<span className="text-primary">Wala</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 'mobile' ? (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-display text-[32px] text-foreground mb-2">Welcome back</h1>
                <p className="font-body text-muted-foreground mb-8">
                  Enter your mobile number to receive a one-time password.
                </p>

                <div className="mb-6">
                  <label htmlFor="mobile" className="sr-only">Mobile number</label>
                  <div className="flex">
                    <div className="flex items-center px-4 bg-muted rounded-l-md border border-r-0 border-border text-sm font-body text-muted-foreground gap-2">
                      <span>+91</span>
                    </div>
                    <input
                      id="mobile"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile"
                      className={`flex-1 px-4 py-3 rounded-r-md border text-base font-body focus:outline-none focus:ring-2 focus:ring-ring min-h-[52px] ${
                        mobile.length === 10
                          ? isValidMobile
                            ? 'border-secondary bg-secondary/5'
                            : 'border-destructive bg-destructive/5'
                          : 'border-border bg-card'
                      }`}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={!isValidMobile || loading}
                  className="w-full px-6 py-3.5 text-base font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>

                {import.meta.env.DEV && (
                  <button
                    onClick={() => void handleSkipOtp()}
                    disabled={loading}
                    className="w-full mt-3 px-6 py-3.5 text-base font-body font-semibold rounded-md border border-border text-foreground hover:bg-muted transition-colors min-h-[52px]"
                  >
                    {loading ? 'Please wait...' : 'Skip OTP (Dev)'}
                  </button>
                )}

                {error && <p className="mt-3 text-sm font-body text-destructive text-center">{error}</p>}

                <p className="mt-4 text-xs font-body text-muted-foreground text-center">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => {
                    setStep('mobile');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex items-center gap-1 text-sm font-body text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft size={16} />
                  Change number
                </button>

                <h1 className="font-display text-[32px] text-foreground mb-2">Check your WhatsApp</h1>
                <p className="font-body text-muted-foreground mb-8">
                  We sent a 6-digit OTP to +91 {mobile}
                </p>

                {/* OTP inputs */}
                <div className="flex gap-3 mb-4 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-xl font-mono rounded-md border focus:outline-none focus:ring-2 focus:ring-ring ${
                        error ? 'border-destructive' : 'border-border'
                      }`}
                      maxLength={1}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm font-body text-destructive text-center mb-4">{error}</p>
                )}

                <button
                  onClick={() => void handleVerifyOTP(otp.join(''))}
                  disabled={otp.some(d => !d) || loading}
                  className="w-full px-6 py-3.5 text-base font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <div className="mt-4 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm font-body text-muted-foreground">
                      Resend OTP in {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={() => void handleResend()}
                      disabled={loading}
                      className="text-sm font-body text-primary hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Testimonials (desktop only) */}
      <div className="hidden lg:flex w-[45%] bg-[#1A1A1A] items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <p className="font-display text-[48px] text-white leading-tight mb-4">
                "{testimonials[testimonialIndex].quote}"
              </p>
              <p className="font-body text-warm-500">
                — {testimonials[testimonialIndex].attribution}
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="mt-16 text-sm font-body font-semibold uppercase tracking-wider text-primary">
            Join 3,500+ MSMEs filing on time
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
