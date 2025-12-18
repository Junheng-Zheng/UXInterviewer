import Link from "next/link";

const SignUp = () => {
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
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <button
              type="submit"
              className="border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition"
            >
              Sign Up
            </button>
          </form>

          {/* Footer */}
          <div className="flex justify-between text-sm text-gray-500">
            <span />
            <Link href="/Signin">Already have an account?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
