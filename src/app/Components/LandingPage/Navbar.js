"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="w-full xl:px-24 lg:px-12  lg:py-12 px-5 py-5 flex justify-between items-center relative">
      <div className="w-12 h-12 relative">
        <Image src="/landingpage/logo.png" alt="logo" fill />
      </div>

      {/* navigation menu */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden flex flex-col relative w-7 items-center justify-center h-5 gap-2"
      >
        <span
          className={`w-full h-px absolute  bg-gray-500 transition-all duration-300 ${
            isMenuOpen ? "rotate-45 translate-y-full" : "top-0 left-0"
          }`}
        />
        <span
          className={`w-full h-px   bg-gray-500 transition-all duration-300 ${
            isMenuOpen && "opacity-0"
          }`}
        />
        <span
          className={`w-full h-px absolute  bg-gray-500 transition-all duration-300 ${
            isMenuOpen ? "-rotate-45 translate-y-full" : "bottom-0 left-0"
          }`}
        />
      </button>
      <div
        className={`flex lg:static bg-white absolute bottom-0 lg:overflow-visible overflow-hidden lg:w-fit w-full left-0 lg:translate-y-0  translate-y-full lg:flex-row flex-col lg:gap-8  items-center ${
          isMenuOpen ? "max-h-screen" : " lg:h-fit max-h-0 "
        } transition-all duration-600`}
      >
        <Link
          href="/"
          className="lg:w-fit relative w-full  lg:border-0  transition-all duration-300 lg:p-0 py-4 px-4 border-b border-gray-200"
        >
          Home
          <div className="w-full absolute -bottom-1 left-0 translate-y-full h-px bg-orange-500"></div>
        </Link>
        <Link
          href="/"
          className="lg:w-fit w-full lg:p-0 py-4 px-4 lg:border-0 border-b border-gray-200"
        >
          Pricing
        </Link>
        <div className="lg:w-fit w-full lg:p-0 lg:border-0 p-4 border-b border-gray-200">
          <div className="flex rounded-full lg:w-fit w-full overflow-hidden  border border-gray-200">
            <Link
              href="/Signin"
              className="lg:w-fit w-full  hover:bg-gray-100  hover:px-6  transition-all duration-300 lg:p-3 lg:px-4 py-4 px-4 border-r border-gray-200"
            >
              Sign In
            </Link>
            <Link
              href="/Signup"
              className="lg:w-fit w-full lg:p-3 hover:bg-gray-100  hover:px-6  transition-all duration-300 lg:px-4 py-4 px-4 lg:border-0 "
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Navbar;
