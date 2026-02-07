"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Sparkles, Check } from "lucide-react";



const ConfirmSignup = () => {
const [code, setCode] = useState(Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
const inputsRef = useRef(Array(6).fill(null));
    const isCodeComplete = code.every((d) => d !== "");
  useEffect(() => {
    // Get email and username from URL params
    const emailParam = searchParams.get("email");
    const usernameParam = searchParams.get("username");
    if (emailParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(emailParam);
    } else {
      // If no email in URL, redirect to signup
      router.push("/Signup");
    }
    if (usernameParam) {
      setUsername(usernameParam);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);



    if (!isCodeComplete) {
      setError("Verification code is required");
      setLoading(false);
      return;
    }

    if (!email) {
      setError("Email is missing. Please try signing up again.");
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
          code: code.join(""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email");
        setLoading(false);
        return;
      }

      // Success - redirect to sign in
      setSuccess(true);
      setTimeout(() => {
        router.push("/Signin");
      }, 2000);
    } catch (err) {
      console.error("Confirm signup error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleChange = (value, index) => {
  if (!/^\d?$/.test(value)) return;

  const newCode = [...code];
  newCode[index] = value;
  setCode(newCode);

  if (value && index < 5) {
    inputsRef.current[index + 1]?.focus();
  }
};

const handleKeyDown = (e, index) => {
  if (e.key === "Backspace" && !code[index] && index > 0) {
    inputsRef.current[index - 1]?.focus();
  }
};

const handlePaste = (e) => {
  e.preventDefault();
  const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
  if (!pasted) return;

  const newCode = pasted.split("");
  setCode([...newCode, ...Array(6 - newCode.length).fill("")]);

  inputsRef.current[Math.min(pasted.length - 1, 5)]?.focus();
};


  // if (success) {
  //   return (
  //     <div className="min-h-screen p-8 flex items-stretch justify-center bg-white text-black">
  //       <div className="w-1/2 grow bg-black" />
  //       <div className="p-12 flex items-center justify-center w-1/2">
  //         <div className="w-full flex flex-col gap-8 max-w-md">
  //           <div className="flex flex-col gap-1">
  //             <h1 className="text-2xl font-medium">Email Verified!</h1>
  //             <p className="text-gray-500">
  //               Your email has been verified successfully.
  //             </p>
  //             <p className="text-sm text-gray-400 mt-2">
  //               Redirecting to sign in...
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen text-sm flex items-stretch justify-center bg-white text-black">
     <div className = 'w-1/2 grow hidden md:flex bg-black h-dvh  sticky top-0 flex-col items-center justify-center'>
        <Image src = "/talking.png" alt="talking" fill className="object-cover brightness-70" />
          <div className = "z-20 flex flex-col gap-5 items-center justify-center">
            <div className = "flex gap-2 items-center justify-center">
              <h2 className="text-3xl font-serif font-normal text-white">Ace your next whiteboard technical.</h2> 
            <Sparkles size={24} strokeWidth={1}  stroke="white" fill="white"/>
            </div>
            </div>
        </div>
      <div className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
      <div className="text-black p-5 xl:p-12 flex items-center justify-center w-full md:w-1/2">
    {!success ? (
              <div className="w-full flex  bg-gray-50  z-20 flex-col gap-6 border border-gray-100 rounded-xl p-8 max-w-md">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-serif">Verify Your Email</h1>
            <p className="text-gray-500">
              We sent a 6 digit verification to {email}
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* <div className="flex flex-col gap-1">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                autoFocus
                className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-gray-600 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500">
                Check your email for the verification code
              </p>
            </div> */}
            <div className="flex gap-2 justify-between">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-full h-14 text-center text-xl border border-gray-200/90 bg-white rounded-xl focus:outline-none focus:border-black"
                />
              ))}
            </div>


            <button
              type="submit"
              disabled={loading || !code}
              className="cursor-pointer flex gap-4 items-center justify-center w-full hover:scale-102 transition-all duration-300  active:scale-98   bg-black text-xl font-serif  text-white px-5 py-3 rounded-xl"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <div className="flex justify-between text-sm text-gray-500">
            <Link href="/Signin" className="hover:text-gray-700">
              Back to Sign In
            </Link>
            <button
             disabled={loading || !isCodeComplete}
              onClick={async () => {
                if (!email) {
                  setError("Email is missing. Please try signing up again.");
                  return;
                }
                setError("");
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
    ) : (
      <div className="w-full flex  bg-gray-50  z-20 flex-col gap-6 border border-gray-100 rounded-xl p-8 max-w-md">
        <div className="flex flex-col gap-1">
          
          <h1 className="text-3xl font-serif">Email Verified!</h1>
          <p className="text-gray-500">
             Redirecting to sign in...
          </p>

        </div>
      </div>
    )}
      </div>
    </div>
  );
};

export default ConfirmSignup;