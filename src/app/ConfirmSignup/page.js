"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ConfirmSignup = () => {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email and username from URL params if available
    const emailParam = searchParams.get("email");
    const usernameParam = searchParams.get("username");
    if (emailParam) {
      setEmail(emailParam);
    }
    if (usernameParam) {
      setUsername(usernameParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !code) {
      setError("Email and verification code are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/confirm-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username: username || email, // Use UUID username if available, fallback to email
          code,
          password: password || undefined, // Optional - will auto sign in if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email");
        setLoading(false);
        return;
      }

      // Success - if password was provided, user is already signed in
      if (data.user) {
        // User is signed in, redirect to home
        router.push("/");
      } else {
        // Just verified, redirect to sign in
        setSuccess(true);
        setTimeout(() => {
          router.push("/Signin");
        }, 2000);
      }
    } catch (err) {
      console.error("Confirm signup error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen p-8 flex items-stretch justify-center bg-white text-black">
        <div className="w-1/2 grow bg-black" />
        <div className="p-12 flex items-center justify-center w-1/2">
          <div className="w-full flex flex-col gap-8 max-w-md">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-medium">Email Verified!</h1>
              <p className="text-gray-500">
                Your email has been verified successfully.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Redirecting to sign in...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-stretch justify-center bg-white text-black">
      <div className="w-1/2 grow bg-black" />
      <div className="text-black p-12 flex items-center justify-center w-1/2">
        <div className="w-full flex flex-col gap-8 max-w-md">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">Verify Your Email</h1>
            <p className="text-gray-500">
              We sent a verification code to your email address
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500">
                Check your email for the verification code
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">
                Password (optional - to sign in automatically)
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
              <p className="text-xs text-gray-500">
                If provided, you'll be signed in automatically after verification
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <div className="flex justify-between text-sm text-gray-500">
            <Link href="/Signin" className="hover:text-gray-700">
              Back to Sign In
            </Link>
            <button
              onClick={async () => {
                if (!email) {
                  setError("Please enter your email first");
                  return;
                }
                try {
                  const response = await fetch("/api/auth/resend-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  const data = await response.json();
                  if (response.ok) {
                    alert("Verification code resent! Check your email.");
                  } else {
                    setError(data.error || "Failed to resend code");
                  }
                } catch (err) {
                  setError("Failed to resend code");
                }
              }}
              className="hover:text-gray-700"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSignup;

