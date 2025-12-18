"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Success - redirect to confirmation page with email and username (UUID)
      const username = data.username || email; // Use UUID if available, fallback to email
      router.push(`/ConfirmSignup?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`);
    } catch (err) {
      console.error("Sign up error:", err);
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
              <h1 className="text-2xl font-medium">Account Created!</h1>
              <p className="text-gray-500">
                Please check your email for a verification code.
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
      {/* Left panel */}
      <div className="w-1/2 grow bg-black" />

      {/* Right panel */}
      <div className="p-12 flex items-center justify-center w-1/2">
        <div className="w-full flex flex-col gap-8 max-w-md">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">Create Account</h1>
            <p className="text-gray-500">Start practicing UX interviews</p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>
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
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* Footer */}
          <div className="flex justify-between text-sm text-gray-500">
            <span />
            <Link href="/Signin" className="hover:text-gray-700">
              Already have an account?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
