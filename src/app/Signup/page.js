"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, X, House } from "lucide-react";
import { Check } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";


const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isFormValid =
  name.trim() !== "" &&
  email.trim() !== "" &&
  password !== "" &&
  confirmPassword !== "" &&
  password === confirmPassword &&
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[!@#$%^&*(),.?":{}|<>]/.test(password);


  const togglePasswordVisibility = () => {

    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
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
    <div className="xl:h-dvh flex text-sm justify-center text-black">

      <div className = "absolute w-full h-full  flex p-5 xl:p-12 z-20">
          <Link href="/" className = "z-20  h-fit  text-black/75 md:text-white cursor-pointer flex items-center gap-2 rounded-lg"><House size={20} strokeWidth={1.3} /> Back</Link>
</div>

      {/* Left panel */}
  <div className = 'w-1/2   bg-black h-dvh hidden  sticky top-0 md:flex flex-col items-center justify-center'>


        <Image src = "/talking.png" alt="talking" fill className="object-cover brightness-70" />
          <div className = "z-20 flex flex-col gap-5 items-center justify-center">
            <div className = "flex gap-2 items-center justify-center">
              <h2 className="text-3xl font-serif font-normal text-white">Ace your next whiteboard technical.</h2> 
            <Sparkles size={24} strokeWidth={1}  stroke="white" fill="white"/>
            </div>
            </div>
        </div>
      <div
        className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
      {/* Right panel */}
      <div className="text-black xl:px-12 xl:py-24 p-5 flex flex-col gap-6 items-center py-24 h-full justify-start  overflow-y-auto scrollbar-hide  w-full md:w-1/2">
<div className="flex flex-col gap-6   w-full items-center justify-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden relative">
            <Image src="/logo.png" alt="logo" fill />
          </div>
                <div className = "px-3 py-2 w-fit bg-gray-100 rounded-lg z-20 flex items-center gap-2">
        <Link href="/Signin" className = "px-3 py-2 w-[80px] bg-white flex flex-col items-center justify-center text-black rounded-lg">Sign In</Link>
        <Link href="/Signup" className = "px-3 py-2 w-[80px] bg-black flex flex-col items-center justify-center text-white rounded-lg">Sign Up</Link>
        </div>

              <div className="w-full flex  bg-gray-50  z-20 flex-col gap-6 border border-gray-100 rounded-xl p-8 max-w-md">
          {/* Header */}


          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

                <button className="cursor-pointer flex gap-3 items-center justify-center w-full hover:scale-102 transition-all duration-300  active:scale-98   bg-black   text-white px-5 py-3 rounded-xl font-serif text-xl">
            <svg xmlns="http://www.w3.org/2000/svg"  height="16px" viewBox="-3 0 262 262" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>
            Sign in with Google
          </button>


          <div className = "flex gap-3 items-center justify-center">
            <div className = "w-full h-px  bg-gray-200" />
            <p className = "text-sm text-gray-500">Or</p>
            <div className = "w-full h-px bg-gray-200" />
          </div>
<div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-200/90 bg-white rounded-xl placeholder:text-gray-400 p-3 px-4 focus:outline-none "
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Email</label>
              <input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-200/90 bg-white rounded-xl placeholder:text-gray-400 p-3 px-4 focus:outline-none "
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Password</label>
             <div className = "w-full   relative">
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-full border border-gray-200/90 bg-white rounded-xl placeholder:text-gray-400 p-3 px-4 focus:outline-none " />
              <button tabIndex={-1} type="button" className = "absolute top-1/2 right-4  -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={togglePasswordVisibility}>{showPassword ? <EyeOff size={16} strokeWidth={1.3} /> : <Eye size={16} strokeWidth={1.3} />}</button>
             </div>

            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-400 flex items-center gap-1"> {password.length >= 8 ? <Check size={16} strokeWidth={1.3} className = "text-green-400"/> : <X size={16} strokeWidth={1.3}  />} 8 characters</div>
              <div className="text-xs text-gray-400 flex items-center gap-1"> {password.match(/[A-Z]/) ? <Check size={16} strokeWidth={1.3} className = "text-green-400"/> : <X size={16} strokeWidth={1.3} />} one uppercase letter</div>
              <div className="text-xs text-gray-400 flex items-center gap-1"> {password.match(/[a-z]/) ? <Check size={16} strokeWidth={1.3} className = "text-green-400"/> : <X size={16} strokeWidth={1.3} />} one lowercase letter</div>
              <div className="text-xs text-gray-400 flex items-center gap-1"> {password.match(/[0-9]/) ? <Check size={16} strokeWidth={1.3} className = "text-green-400"/> : <X size={16} strokeWidth={1.3} />} one number</div>
              <p className="text-xs text-gray-400 flex items-center gap-1"> {password.match(/[!@#$%^&*(),.?":{}|<>]/) ? <Check size={16} strokeWidth={1.3} className = "text-green-400"/> : <X size={16} strokeWidth={1.3} />} one special character</p>
            </div>

              
            </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Confirm Password</label>
            <div className="w-full relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
    
                className="w-full border border-gray-200/90 bg-white rounded-xl placeholder:text-gray-400 p-3 px-4 focus:outline-none"
              />
              <button
                type="button"
                className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} strokeWidth={1.3} />
                ) : (
                  <Eye size={16} strokeWidth={1.3} />
                )}
              </button>
            </div>
          </div>


            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`
                rounded-xl p-3 px-4 border font-serif text-xl transition
                ${isFormValid
                  ? "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"}
                ${loading && "opacity-50 cursor-not-allowed"}
              `}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            </div>

          </form>

         
        </div>
</div>
      </div>
    </div>
  );
};

export default SignUp;
