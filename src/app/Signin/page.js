"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sign in");
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push("/");
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-stretch justify-center bg-white text-black ">
      <div className="w-1/2 grow bg-black" />
      <div className="text-black p-12 flex items-center justify-center w-1/2">
        <div className="w-full flex flex-col gap-8 max-w-md">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">Sign In</h1>
            <p className="text-gray-500">Welcome back!</p>
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
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="flex justify-between text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Forgot password?
            </Link>
            <Link href="/Signup" className="hover:text-gray-700">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
