import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

export default function OTPVerification() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/reset-password");
  };

  const handleResend = () => {
    alert("OTP resent successfully!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Enter verification code</CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit code to your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full" disabled={otp.length !== 6}>
              Verify code
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary hover:underline"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
