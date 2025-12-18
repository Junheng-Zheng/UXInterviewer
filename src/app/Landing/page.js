import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="text-black p-12">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <span>UXInterviewer</span>
          <Link href="/">Features</Link>
          <Link href="/">Pricing</Link>
        </div>
        <div className="flex border border-gray-300 rounded-md">
          <Link
            href="/Signin"
            className="p-2 hover:bg-gray-100 border-r border-gray-300"
          >
            Sign In +
          </Link>
          <Link href="/Signup" className="p-2 hover:bg-gray-100">
            Sign Up +
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
