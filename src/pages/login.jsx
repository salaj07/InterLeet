import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Github, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { motion, AnimatePresence } from "framer-motion";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
    }, 800);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    setIsLoading(true);
    // Simulate authentication check
    setTimeout(() => {
      setIsLoading(false);
      navigate("/app/dashboard");
    }, 800);
  };

  return (
    <AuthShell
      title={isOtpSent ? "Verify your email" : "Sign in to Interleet"}
      subtitle={isOtpSent ? `We've sent a 4-digit code to ${email}` : "Welcome back. Pick up where you left off."}
    >
      <div className="mb-4">
        {isOtpSent ? (
          <button
            type="button"
            onClick={() => {
              setIsOtpSent(false);
              setOtp("");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isOtpSent ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" type="button" className="w-full">
                <Github className="mr-2 h-4 w-4" /> GitHub
              </Button>
              <Button variant="outline" type="button" className="w-full">
                <Mail className="mr-2 h-4 w-4" /> Google
              </Button>
            </div>
            <div className="relative my-5 flex items-center">
              <Separator className="flex-1" />
              <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                or
              </span>
              <Separator className="flex-1" />
            </div>
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={!email.trim() || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp">Enter 4-digit code</Label>
                </div>
                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={4}
                    value={otp}
                    onChange={(val) => setOtp(val)}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-3">
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg rounded-md border-2 border-neutral-400 dark:border-neutral-600 bg-background font-semibold" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg rounded-md border-2 border-neutral-400 dark:border-neutral-600 bg-background font-semibold" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg rounded-md border-2 border-neutral-400 dark:border-neutral-600 bg-background font-semibold" />
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg rounded-md border-2 border-neutral-400 dark:border-neutral-600 bg-background font-semibold" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox defaultChecked /> Keep me signed in for 30 days
                </label>

                <Button type="submit" className="w-full" disabled={otp.length !== 4 || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpSent(false);
                    setOtp("");
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

export default LoginPage;
