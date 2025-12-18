"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import Script from "next/script";
import Animatedlink from "./Components/Atoms/Animatedlink";
import Challengecycle from "./Components/Organisms/Challangecycle";
import Interview from "./Components/Templates/Interview";
import Profile from "./Components/Molecules/Profile";
import Profilenavbar from "./Components/Organisms/Profilenavbar";
import { useState, useEffect } from "react";
import Results from "./Components/Templates/Results";
import useStore from "../store/module";
import Link from "next/link";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication state
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show home page with sign-in link
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-black">
        <nav className="p-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <span className="text-xl font-semibold">UXInterviewer</span>
            <Link href="/" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">Pricing</Link>
          </div>
          <div className="flex gap-2">
            <Link
              href="/Signin"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/Signup"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Sign Up
            </Link>
          </div>
        </nav>
        <main className="p-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to UXInterviewer</h1>
            <p className="text-xl text-gray-600 mb-8">
              Practice your UX interview skills with interactive challenges
            </p>
            <Link
              href="/Signin"
              className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Get Started
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // If authenticated, show the interview interface
  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw/dist/";`}
      </Script>
      
      <nav className="p-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold">UXInterviewer</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.name || user.email}
            </span>
          )}
          <Link
            href="/api/auth/logout"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
          >
            Sign Out
          </Link>
        </div>
      </nav>

      <Interview />
    </>
  );
}
