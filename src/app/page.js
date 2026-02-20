"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import Script from "next/script";
import Animatedlink from "./Components/Atoms/Animatedlink";
import Challengecycle from "./Components/Organisms/Challangecycle";
import Interview from "./Components/Templates/Interview";
import Profile from "./Components/Profile";
import Profilenavbar from "./Components/Organisms/Profilenavbar";
import { useState, useEffect } from "react";
import Results from "./Components/Templates/Results";
import useStore from "../store/module";
import Link from "next/link";
import Dashboard from "./dashboard/page";
import { RefreshCw, SplinePointer } from "lucide-react";
import { Clock } from "lucide-react";
import { Zap } from "lucide-react";
import { Sparkles } from "lucide-react";
import { ChartBar } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Check authentication state
  //   const checkAuth = async () => {
  //     try {
  //       const response = await fetch('/api/auth/me');
  //       const data = await response.json();
        
  //       if (data.authenticated) {
  //         setIsAuthenticated(true);
  //         setUser(data.user);
  //       } else {
  //         setIsAuthenticated(false);
  //         setUser(null);
  //       }
  //     } catch (error) {
  //       console.error('Auth check error:', error);
  //       setIsAuthenticated(false);
  //       setUser(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   checkAuth();
  // }, []);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-white">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // If not authenticated, show home page with sign-in link
  // if (!isAuthenticated) {
  //   return (
  //     <Landingpage />
  //   );
  // }

  const [authState, setAuthState] = useState("unknown"); // unknown | guest | user
const [user, setUser] = useState(null);

useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        setAuthState("user");
      } else {
        setAuthState("guest");
      }
    } catch {
      setAuthState("guest");
    }
  };

  checkAuth();
}, []);




  // If authenticated, show the interview interface
if (authState === "unknown") {
  return null; // or a tiny skeleton if you want
}

if (authState === "user") {
  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw/dist/";`}
      </Script>
      <Dashboard />
    </>
  );
}

return <Landingpage />;

}
const Landingpage = () => {
    const ref = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const FEATURES = [
    {
      id: "generate",
      subTitle: "Generate from 0–1",
      title: "Start a real, live technical interview",
      description:
        "Choose from a list of our curated questions. Just change the difficult, the time limit, and the context, and start the interview.",
    },
    {
      id: "prep",
      subTitle: "From 1 to 100",
      title: "Draw, think, speak, and ask",
      description:
        "Upon starting the interview, you get brought into a whiteboard session. Here, you walk through your solution, speaking and asking questions just like a real interview.",
    },
    {
      id: "verbalize",
      subTitle: "From 100 to Infinity",
      title: "Structured feedback - Verbalized",
      description:
        "Upon submission, you get structured feedback on your performance. We use a strict rubric to grade your performace, offering feedback on your all skills and areas for improvement.",
    },
  ];

  const [selectedFeature, setSelectedFeature] = useState(FEATURES[0]);
    const [selectedVideo, setSelectedVideo] = useState("track");
  return (
    <div>
          <div className="max-w-[1800px] mx-auto  text-gray-800">
             <div
        className="fixed top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>

      {/* Navigation Bar */}
      <div className="w-full xl:px-16 lg:px-12 border-b bg-white z-20 border-gray-200 lg:py-8 px-5 py-5 flex justify-between items-center relative">
        <div className="w-12 h-12 rounded-lg overflow-hidden relative">
          <Image src="/logo.png" alt="logo" fill />
 
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
          className={`flex lg:static bg-white absolute bottom-0 z-20 lg:overflow-visible overflow-hidden lg:w-fit w-full left-0 lg:translate-y-0  translate-y-full lg:flex-row flex-col lg:gap-8  items-center ${
            isMenuOpen ? "max-h-screen" : " lg:h-fit max-h-0 "
          } transition-all duration-600`}
        >
          <Link
            href="/"
            className="lg:w-fit relative w-full  xl:border-t-0 border-t  transition-all duration-300 lg:p-0 py-4 px-4 border-b border-gray-200"
          >
            Home
          
          </Link>
       
          <div className="lg:w-fit w-full lg:p-0 lg:border-0 p-4 border-b border-gray-200">
            <div className="flex rounded-xl lg:w-fit w-full overflow-hidden  border border-gray-200">
              <Link
                href="/Signin"
                className="lg:w-fit w-full  hover:bg-gray-50  hover:px-6  transition-all duration-300 lg:p-3 lg:px-3 py-3 flex items-center justify-center px-4 border-r border-gray-200"
              >
                Sign In
              </Link>
              <Link
                href="/Signup"
                className="lg:w-fit w-full lg:p-3 hover:bg-gray-50  hover:px-6  transition-all duration-300 lg:px-4 py-3 flex items-center justify-center px-4 lg:border-0 "
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="w-full flex flex-col gap-4   lg:items-center  lg:px-24 lg:py-16 px-5  py-12 justify-center">
        {/* <div className="instrument-serif italic lg:text-center  text-orange-500 py-2 flex gap-2  items-center px-4 border border-orange-200 w-fit rounded-full uppercase">
          <div className="w-2 h-2 aspect-square bg-orange-500 rounded-full" />
          Live Interviews
        </div> */}

        {/* <motion.h1
          initial={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
          }}
          className="xl:text-5xl lg:text-4xl tracking-tight flex  gap-2 lg:text-center text-3xl "
        >
        
          <span className="font-serif lg:text-5xl xl:text-5xl text-2xl">
            We Help UX Designers Prep for
          </span>
          <SplinePointer size={44} strokeWidth={1.2}   fill="  lab(92.0301% -2.24757 -11.6453)"/>
                    <span className="font-serif lg:text-5xl xl:text-5xl text-4xl">
            Whiteboard Interviews.
          </span>
        </motion.h1> */}

          <motion.h1
          initial={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
          }} className="font-serif lg:text-5xl xl:text-5xl text-4xl tracking-tight gap-2">
  We Help UX Designers 
  Prep for {" "}
  
<SplinePointer
  strokeWidth={1.2}
  className="
    inline-block 
    w-7 h-7
    md:w-8 md:h-8
    lg:w-9 lg:h-9
    xl:w-10 xl:h-10
    -translate-y-[4px]
  "
  fill="lab(92.0301% -2.24757 -11.6453)"
/>


  {" "} Whiteboard Interviews.
</motion.h1>

        <div className="overflow-hidden xl:w-1/2 md:w-2/3 w-full">
          <motion.p
            initial={{ translateY: 80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 80,
              damping: 20,
              delay: 0.3,
            }}
            className=" text-gray-600 lg:text-center"
          >
          Choose your question, difficult, and time limit. Speak to an interviewer in a live-whiteboard session, and get feedback on your performance.
          </motion.p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button href="/Signin" className="cursor-pointer sm:w-fit flex gap-4 items-center justify-center w-full hover:scale-102 transition-all duration-300  active:scale-98   bg-black text-xl font-serif  text-white px-5 py-3 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg"  height="20px" viewBox="-3 0 262 262" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>
            Sign in with Google
          </button>

        </div>
      </div>
      <div className="lg:px-12 md:px-4 pb-12">
        <div className="w-full lg:rounded-xl md:rounded-lg relative   flex flex-col gap-4  bg-blue-100 overflow-hidden z-1 white p-5 xl:px-48 lg:px-24 py-12">
          <Image src = "/snow.jpg" alt="snow" fill className="object-cover object-center" />
          <div className="absolute top-0 left-0 w-full flex justify-between h-full">
            {Array.from({ length: 256 }).map((_, index) => (
              <div key={index} className="w-px h-full bg-white/10"></div>
            ))}
          </div>

          <div className="perspective-[1000px] ">
            <motion.div
              className="w-full bg-white aspect-video overflow-hidden relative shadow-lg  rounded-lg"
              initial={{
                rotateX: 8,

              }}
              whileInView={{
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
 
              }}
              viewport={{ amount: 1}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
             <Image src="/whiteboardtest.png" alt="main image" fill className="object-cover object-top" />
            </motion.div>
          </div>
        </div>
      </div>
      {/* Features Section DESKTOP */}
      <div className="hidden h-[300dvh] flex-col lg:flex-row  lg:flex ">
        <div className="w-1/2 h-dvh sticky top-0 bg-gray-50  xl:px-16 lg:px-12 py-0 border-r border-gray-200  justify-center    flex flex-col gap-4">

          {selectedFeature.subTitle === "Generate from 0–1" && (
            <p className=" bg-blue-100 text-sm w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
              <Sparkles size={16} strokeWidth={1.2}   />
            {selectedFeature.subTitle}
            </p>
          )}

          {selectedFeature.subTitle === "From 1 to 100" && (
            <p className=" bg-red-100 text-sm w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
              <SplinePointer size={16} strokeWidth={1.2}   />
            {selectedFeature.subTitle}
            </p>
          )}

          {selectedFeature.subTitle === "From 100 to Infinity" && (
            <p className=" bg-pink-100 text-sm w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
              <ChartBar size={16} strokeWidth={1.2}   />
            {selectedFeature.subTitle}
            </p>
          )}

          <h2 className="xl:text-3xl lg:text-lg font-serif font-normal ">
            {selectedFeature.title}
          </h2>
          <p className="w-6/7 xl:w-6/7 ">{selectedFeature.description}</p>
        </div>
        <div className="w-1/2 flex flex-col">
          <motion.div
            onViewportEnter={() => {
              setSelectedFeature(FEATURES[0]);
            }}
            viewport={{ amount: 0.5 }}
            className=" h-dvh relative overflow-hidden border-b  xl:px-16  z-20 lg:px-12 bg-gray-100  border-gray-200 flex items-center justify-center w-full"
          >

            <div className="perspective-[1000px]  w-full">
              <motion.div
                initial={{
                  rotateX: 12,
                  rotateY: -12,
                  rotateZ: 12,
                }}
                whileInView={{
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                }}
                viewport={{ amount: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className = "w-full bg-gray-200 rounded-lg">
                  <video 
                  className = "w-full  bg-gray-200 rounded-lg"
                  src="/landingpage/promptselect.mp4"
                  autoPlay
                  muted
                  loop
                  />
                </div>
              </motion.div>
            </div>


          </motion.div>
          <motion.div
            onViewportEnter={() => {
              setSelectedFeature(FEATURES[1]);
            }}
            ref={ref}
            viewport={{ amount: 0.5 }}
            className=" h-dvh border-b relative overflow-hidden xl:px-16 lg:px-12  border-gray-200 flex items-center justify-center w-full"
          >
          
            <div className="perspective-[1000px] w-full">
              <motion.div
                initial={{
                  rotateX: 20,
                  rotateY: -20,
                  rotateZ: -12,
                }}
                whileInView={{
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                }}
                viewport={{ amount: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className = "w-full  bg-gray-200 rounded-lg">
                  <video 
                  className = "w-full  bg-gray-200 rounded-lg"
                  src="/landingpage/whiteboardexample.mp4"
                  autoPlay
                  muted
                  loop
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            onViewportEnter={() => {
              setSelectedFeature(FEATURES[2]);
            }}
            viewport={{ amount: 0.5 }}
            className=" h-dvh relative overflow-hidden bg-gray-100  xl:px-16 lg:px-12  border-gray-200 flex items-center justify-center w-full"
          >
            
            <div className="perspective w-full -[1000px]">
              <motion.div
                initial={{
                  rotateX: 12,
                  rotateY: -12,
                  rotateZ: 12,
                }}
                whileInView={{
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                }}
                viewport={{ amount: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className = "w-full aspect-video bg-gray-200 rounded-lg">
                  <video 
                  className = "w-full aspect-video bg-gray-200 rounded-lg"
                  src="/video.mp4"
                  autoPlay
                  muted
                  loop
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Features Section MOBILE */}
      <div className="w-full lg:hidden px-5 py-16  border-b border-gray-200   justify-center    flex flex-col gap-4">
        <p className=" text-sm  bg-blue-100 w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
          {FEATURES[0].subTitle}
        </p>
        <h2 className=" text-3xl font-serif font-normal ">{FEATURES[0].title}</h2>
        <p className="  ">{FEATURES[0].description}</p>
        <div className = "w-full aspect-video bg-gray-200 rounded-lg">
                    <video 
                  className = "w-full h-full bg-gray-200 rounded-lg"
                  src="/landingpage/promptselect.mp4"
                  autoPlay
                  muted
                  loop
                  />
        </div>
      </div>
      <div className="w-full lg:hidden px-5 py-16 border-b border-gray-200   justify-center    flex flex-col gap-4">
        <p className=" text-sm  bg-pink-100 w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
          {FEATURES[1].subTitle}
        </p>
        <h2 className=" text-3xl font-serif font-normal ">{FEATURES[1].title}</h2>
        <p className="  ">{FEATURES[0].description}</p>
        <div className = "w-full aspect-video bg-gray-200 rounded-lg">
                    <video 
                  className = "w-full h-full bg-gray-200 rounded-lg"
                  src="/landingpage/whiteboardexample.mp4"
                  autoPlay
                  muted
                  loop
                  />

        </div>
      </div>
      <div className="w-full lg:hidden px-5 py-16     justify-center    flex flex-col gap-4">
        <p className=" text-sm  bg-red-100 w-fit px-4 py-3 flex items-center gap-2 rounded-xl ">
          {FEATURES[2].subTitle}
        </p>
        <h2 className=" text-3xl font-serif font-normal ">{FEATURES[2].title}</h2>
        <p className="  ">{FEATURES[0].description}</p>
        <div className="perspective-[1000px]">
         <div className = "w-full aspect-video bg-gray-200 rounded-lg">
          <video 
                  className = "w-full h-full bg-gray-200 rounded-lg"
                  src="/video.mp4"
                  autoPlay
                  muted
                  loop
                  />
         </div>
        </div>
      </div>
      {/* Details section */}
      {/* <div className="w-full  lg:p-24 p-5  border-t  border-gray-200  justify-center    flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className=" text-3xl font-semibold uppercase">
            Start Entirely for Free
          </h2>
          <p className=" uppercase lg:w-1/3 text-right ">
            {FEATURES[0].description}
          </p>
        </div>

        <div className="w-full relative  flex gap-8 flex-col items-center  px-56 p-12 bg-orange-500 rounded-xl ">
          <div className="absolute top-0 left-0 w-full flex justify-between h-full">
            {Array.from({ length: 256 }).map((_, index) => (
              <div key={index} className="w-px h-full bg-white/10"></div>
            ))}
          </div>
          <div className="w-fit  p-2 z-1 relative rounded-full bg-white overflow-hidden gap-2 flex">
            <button className="w-30 py-3 flex bg-orange-500 items-center  justify-center text-white rounded-full ">
              Billed Monthly
            </button>
            <button className="w-30 py-3 border rounded-full border-gray-200 flex items-center justify-center bg-white ">
              Billed Yearly
            </button>
          </div>
          <div className="flex gap-8 z-1 relative w-full">
            <div className="flex w-full flex-col bg-white rounded-xl ">
              <div className="w-full border-b border-gray-200 flex flex-col gap-4  p-6">
                <p className="uppercase text-xl">Free</p>
                <div className="flex items-end gap-1">
                  <h2 className="text-5xl font-semibold">$0</h2>
                  <h2 className="text-5xl font-semibold">/</h2>
                  <h2 className="text-xl font-semibold">Month</h2>
                </div>
              </div>
              <div className="w-full   flex flex-col gap-4  p-6">
                <p className="uppercase text-xl">Features</p>
                <p>Question Generation</p>
                <p>Live Text Interview</p>
                <p>3 Interviews a day - Everyday</p>
                <p>Result Viewing and tracking</p>
                <button className="cursor-pointer w-full hover:scale-102 transition-all duration-300  active:scale-98   bg-orange-500  text-white px-5 py-3 rounded-full">
                  Sign in with Google
                </button>
              </div>
            </div>
            <div className="flex w-full flex-col bg-white rounded-xl ">
              <div className="w-full border-b border-gray-200 flex flex-col gap-4  p-6">
                <p className="uppercase text-xl">Pro</p>
                <div className="flex items-end gap-1">
                  <h2 className="text-5xl font-semibold">$12</h2>
                  <h2 className="text-5xl font-semibold">/</h2>
                  <h2 className="text-xl font-semibold">Month</h2>
                </div>
              </div>
              <div className="w-full   flex flex-col gap-4  p-6">
                <p className="uppercase text-xl">Features</p>
                <p>Question Generation</p>
                <p>Live Text Interview</p>
                <p>3 Interviews a day - Everyday</p>
                <p>Result Viewing and tracking</p>
                <button className="cursor-pointer w-full hover:scale-102 transition-all duration-300  active:scale-98   border border-gray-200 px-5 py-3 rounded-full">
                  Try for 7 days free
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Footer */}
      <div className="bg-white ">
        <div className = "w-full xl:h-[400px] h-[300px] z-20 relative bg-white ">
         <div className = "w-full h-full relative flex flex-col justify-center items-center gap-4">
                     <div className = "z-20 flex flex-col gap-5 items-center justify-center">

                      <div className = "flex gap-2 items-center justify-center">
                        <h2 className="xl:text-4xl text-2xl font-serif font-normal text-white">Ace your next whiteboard technical.</h2> 
                      <Sparkles className="text-white xl:w-6 xl:h-6 " strokeWidth={1}  stroke="white" fill="white"/>
                      </div>
                     <button className="cursor-pointer w-fit flex gap-4 items-center justify-center  hover:scale-102 transition-all duration-300  active:scale-98   bg-black text-xl font-serif  text-white px-5 py-3 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg"  height="20px" viewBox="-3 0 262 262" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>
            Sign in with Google
          </button>
                     </div>
           <Image src="/talking.png" alt="snow" fill className="object-cover  absolute top-0 left-0 brightness-70" />

         </div>
        </div>
        <div className="flex  relative px-5 z-1 bg-white border-t border-gray-200 py-12 lg:px-16 lg:py-12 flex-col gap-16 w-full">
          <div className="w-12 h-12 rounded-lg overflow-hidden relative">
            <Image src="/logo.png" alt="logo" fill />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex md:flex-row flex-col md:justify-between gap-16 md:items-end">
              <div className="flex  gap-12">
                <div className="flex flex-col gap-4">
                  <Animatedlink href="#about">Home</Animatedlink>
                  <Animatedlink href="#works">Pricing</Animatedlink>
                  <Animatedlink href="#philosophy">Sign In</Animatedlink>
                </div>
                <div className="flex flex-col gap-4">
                  <Animatedlink link="https://www.linkedin.com/in/junhengzheng/">
                    Sign Up
                  </Animatedlink>
                  <Animatedlink link="https://github.com/junheng-zheng">
                    LinkedIn
                  </Animatedlink>
                  <Animatedlink link="https://mail.google.com/mail/?view=cm&fs=1&to=jz7259@g.rit.edu">
                    Contact Us
                  </Animatedlink>
                </div>
              </div>
              <p className=" text-gray-500">
                © 2026 UXInterviewer. All rights reserved.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 z-0 lg:px-16 px-5 lg:py-12 py-6 sticky bottom-0 w-full">
          {/* <svg
            width="100%"
            height="auto"
            viewBox="0 0 198 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-10"
          >
            <path
              d="M10.7813 0H14.4716V11.3352C14.4716 12.608 14.1676 13.7216 13.5597 14.6761C12.9574 15.6307 12.1136 16.375 11.0284 16.9091C9.94318 17.4375 8.67898 17.7017 7.2358 17.7017C5.78693 17.7017 4.51989 17.4375 3.43466 16.9091C2.34943 16.375 1.50568 15.6307 0.903409 14.6761C0.301136 13.7216 0 12.608 0 11.3352V0H3.69034V11.0199C3.69034 11.6847 3.83523 12.2756 4.125 12.7926C4.42045 13.3097 4.83523 13.7159 5.36932 14.0114C5.90341 14.3068 6.52557 14.4545 7.2358 14.4545C7.9517 14.4545 8.57386 14.3068 9.10227 14.0114C9.63636 13.7159 10.0483 13.3097 10.3381 12.7926C10.6335 12.2756 10.7813 11.6847 10.7813 11.0199V0Z"
              fill="black"
            />
            <path
              d="M20.968 0L24.4879 5.94886H24.6243L28.1612 0H32.3288L27.0021 8.72727L32.4482 17.4545H28.2038L24.6243 11.4972H24.4879L20.9084 17.4545H16.6811L22.1442 8.72727L16.7834 0H20.968Z"
              fill="black"
            />
            <path d="M38.3544 0V17.4545H34.6641V0H38.3544Z" fill="black" />
            <path
              d="M55.9901 0V17.4545H52.8026L45.2088 6.46875H45.081V17.4545H41.3906V0H44.6293L52.1634 10.9773H52.3168V0H55.9901Z"
              fill="black"
            />
            <path
              d="M58.3743 3.04261V0H72.7095V3.04261H67.3658V17.4545H63.718V3.04261H58.3743Z"
              fill="black"
            />
            <path
              d="M75.0703 17.4545V0H86.8317V3.04261H78.7607V7.2017H86.2266V10.2443H78.7607V14.4119H86.8658V17.4545H75.0703Z"
              fill="black"
            />
            <path
              d="M89.7656 17.4545V0H96.652C97.9702 0 99.0952 0.235795 100.027 0.707386C100.964 1.1733 101.678 1.83523 102.166 2.69318C102.661 3.54545 102.908 4.5483 102.908 5.7017C102.908 6.8608 102.658 7.85795 102.158 8.69318C101.658 9.52273 100.933 10.1591 99.9844 10.6023C99.0412 11.0455 97.8992 11.267 96.5582 11.267H91.9474V8.30114H95.9616C96.6662 8.30114 97.2514 8.20455 97.7173 8.01136C98.1832 7.81818 98.5298 7.52841 98.7571 7.14205C98.9901 6.75568 99.1065 6.27557 99.1065 5.7017C99.1065 5.12216 98.9901 4.63352 98.7571 4.2358C98.5298 3.83807 98.1804 3.53693 97.7088 3.33239C97.2429 3.12216 96.6548 3.01705 95.9446 3.01705H93.456V17.4545H89.7656ZM99.1918 9.51136L103.53 17.4545H99.456L95.2116 9.51136H99.1918Z"
              fill="black"
            />
            <path
              d="M108.2 0L112.419 13.2614H112.581L116.808 0H120.899L114.882 17.4545H110.126L104.101 0H108.2Z"
              fill="black"
            />
            <path d="M126.69 0V17.4545H123V0H126.69Z" fill="black" />
            <path
              d="M129.727 17.4545V0H141.488V3.04261H133.417V7.2017H140.883V10.2443H133.417V14.4119H141.522V17.4545H129.727Z"
              fill="black"
            />
            <path
              d="M148.351 17.4545L143.357 0H147.388L150.277 12.1278H150.422L153.609 0H157.061L160.24 12.1534H160.393L163.283 0H167.314L162.32 17.4545H158.723L155.399 6.04261H155.263L151.947 17.4545H148.351Z"
              fill="black"
            />
            <path
              d="M169.289 17.4545V0H181.05V3.04261H172.979V7.2017H180.445V10.2443H172.979V14.4119H181.085V17.4545H169.289Z"
              fill="black"
            />
            <path
              d="M183.984 17.4545V0H190.871C192.189 0 193.314 0.235795 194.246 0.707386C195.183 1.1733 195.896 1.83523 196.385 2.69318C196.879 3.54545 197.126 4.5483 197.126 5.7017C197.126 6.8608 196.876 7.85795 196.376 8.69318C195.876 9.52273 195.152 10.1591 194.203 10.6023C193.26 11.0455 192.118 11.267 190.777 11.267H186.166V8.30114H190.18C190.885 8.30114 191.47 8.20455 191.936 8.01136C192.402 7.81818 192.749 7.52841 192.976 7.14205C193.209 6.75568 193.325 6.27557 193.325 5.7017C193.325 5.12216 193.209 4.63352 192.976 4.2358C192.749 3.83807 192.399 3.53693 191.928 3.33239C191.462 3.12216 190.874 3.01705 190.163 3.01705H187.675V17.4545H183.984ZM193.411 9.51136L197.749 17.4545H193.675L189.43 9.51136H193.411Z"
              fill="black"
            />
          </svg> */}
          <svg width="100%" height="auto" viewBox="0 0 1312 165" className = "opacity-10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M34.0284 164.655C26.0612 164.655 19.2744 162.811 13.6678 159.122C8.0613 155.286 4.07771 150.049 1.71706 143.409C-0.49604 136.622 -0.569811 128.877 1.49575 120.172L25.176 17.9261C25.9137 14.8278 25.9137 12.7622 25.176 11.7295C24.4383 10.6967 22.594 9.88521 19.6432 9.29504L15.217 8.4098C13.299 7.96717 12.34 7.1557 12.34 5.97539C12.34 4.2049 13.6678 3.31966 16.3236 3.31966H56.1595C58.225 3.31966 59.2578 4.05736 59.2578 5.53276C59.2578 7.1557 58.225 8.11471 56.1595 8.4098L49.9628 9.29504C46.8644 9.73766 44.6513 10.5491 43.3234 11.7295C42.1431 12.9098 41.1841 15.0491 40.4464 18.1475L16.7662 120.393C14.1105 131.606 14.8482 140.311 18.9793 146.508C23.258 152.704 29.8235 155.803 38.6759 155.803C48.266 155.803 56.0119 152.704 61.9135 146.508C67.8152 140.311 72.02 131.606 74.5282 120.393L97.1019 22.5737C99.0199 14.3114 97.5445 9.88521 92.6757 9.29504L87.8069 8.63111C85.7413 8.33603 84.7085 7.45079 84.7085 5.97539C84.7085 5.09014 85.1511 4.42621 86.0364 3.98359C86.9216 3.54097 87.8806 3.31966 88.9134 3.31966H120.782C122.7 3.31966 123.659 4.05736 123.659 5.53276C123.659 7.00816 122.479 7.96717 120.118 8.4098L114.807 9.29504C109.643 10.1803 106.102 14.5327 104.184 22.3524L81.6102 120.172C78.5118 133.598 72.9053 144.368 64.7906 152.483C56.6758 160.598 46.4218 164.655 34.0284 164.655Z" fill="black"/>
<path d="M92.1864 162.663C90.8585 162.663 89.9733 162.442 89.5307 161.999C89.088 161.409 88.8667 160.819 88.8667 160.229C88.8667 158.606 90.1946 157.573 92.8503 157.131L96.3913 156.467C101.408 155.581 105.539 154.18 108.785 152.262C112.031 150.196 115.055 146.95 117.858 142.524L152.162 89.8521C153.342 88.0816 154.227 86.3849 154.817 84.7619C155.407 82.9915 155.407 80.7046 154.817 77.9013L141.981 18.1475C141.391 14.754 140.358 12.4672 138.883 11.2868C137.408 10.1065 135.711 9.36881 133.793 9.07374L129.809 8.4098C127.449 7.96717 126.49 7.00816 126.932 5.53276C127.227 4.05736 128.629 3.31966 131.137 3.31966H169.424C172.079 3.31966 173.26 4.05736 172.965 5.53276C172.522 7.00816 171.047 7.96717 168.539 8.4098L164.112 9.07374C161.457 9.51635 159.539 10.4016 158.358 11.7295C157.178 13.0573 156.883 15.1967 157.473 18.1475L168.096 66.3932C168.243 66.9833 168.539 67.3522 168.981 67.4997C169.571 67.6473 170.161 67.3522 170.752 66.6145L201.071 20.3606C203.137 17.1147 204.17 14.754 204.17 13.2786C204.317 11.6557 203.063 10.5491 200.407 9.95897L194.653 8.63111C192.145 8.04094 191.112 7.00816 191.555 5.53276C191.85 4.05736 193.325 3.31966 195.981 3.31966H230.284C233.087 3.31966 234.194 4.2049 233.604 5.97539C233.309 7.45079 231.981 8.4098 229.62 8.85241L226.079 9.51635C222.243 10.2541 218.776 11.6557 215.678 13.7212C212.727 15.7868 209.776 19.0327 206.825 23.4589L174.514 72.5899C173.186 74.5079 172.301 76.4997 171.858 78.5653C171.416 80.4833 171.563 83.139 172.301 86.5324L185.579 147.835C186.317 151.376 187.424 153.663 188.899 154.696C190.522 155.729 192.145 156.393 193.768 156.688L197.973 157.352C199.891 157.499 200.85 158.385 200.85 160.008C200.85 161.778 199.374 162.663 196.424 162.663H157.694C155.481 162.663 154.375 161.852 154.375 160.229C154.375 158.753 155.776 157.794 158.58 157.352L163.006 156.688C165.661 156.245 167.653 155.36 168.981 154.032C170.309 152.704 170.678 150.639 170.088 147.835L158.801 96.0488C158.653 95.1635 158.284 94.7209 157.694 94.7209C157.104 94.5734 156.514 94.8685 155.924 95.6062L123.834 145.622C121.768 148.868 120.662 151.303 120.514 152.926C120.514 154.401 121.842 155.434 124.498 156.024L130.473 157.352C132.391 157.794 133.35 158.68 133.35 160.008C133.35 161.778 131.949 162.663 129.145 162.663H92.1864Z" fill="black"/>
<path d="M224.955 162.663C222.742 162.663 221.636 161.852 221.636 160.229C221.636 158.901 222.595 158.016 224.513 157.573L229.603 156.688C232.701 156.098 234.693 155.286 235.578 154.253C236.611 153.221 237.127 151.155 237.127 148.057V17.9261C237.127 14.8278 236.611 12.7622 235.578 11.7295C234.693 10.6967 232.701 9.88521 229.603 9.29504L224.513 8.4098C222.595 7.96717 221.636 7.08193 221.636 5.75407C221.636 4.13113 222.742 3.31966 224.955 3.31966H265.013C267.226 3.31966 268.332 4.13113 268.332 5.75407C268.332 7.08193 267.373 7.96717 265.455 8.4098L260.365 9.29504C257.267 9.88521 255.201 10.6967 254.168 11.7295C253.283 12.7622 252.841 14.8278 252.841 17.9261V148.057C252.841 151.155 253.283 153.221 254.168 154.253C255.201 155.286 257.267 156.098 260.365 156.688L265.455 157.573C267.373 158.016 268.332 158.901 268.332 160.229C268.332 161.852 267.226 162.663 265.013 162.663H224.955Z" fill="black"/>
<path d="M367.485 164.655C365.124 164.655 363.132 162.885 361.509 159.344L301.534 29.213C301.091 28.1802 300.501 27.7376 299.764 27.8851C299.173 28.0327 298.878 28.6966 298.878 29.8769V143.631C298.878 147.762 299.542 150.934 300.87 153.147C302.346 155.212 304.927 156.54 308.616 157.131L311.493 157.573C313.411 157.721 314.37 158.606 314.37 160.229C314.37 161.852 313.263 162.663 311.05 162.663H279.403C277.19 162.663 276.083 161.852 276.083 160.229C276.083 158.606 277.042 157.721 278.96 157.573L281.837 157.131C285.673 156.54 288.329 155.212 289.805 153.147C291.28 150.934 292.018 147.762 292.018 143.631V17.9261C292.018 14.8278 291.501 12.7622 290.469 11.7295C289.583 10.6967 287.444 9.88521 284.051 9.29504L278.96 8.4098C277.042 7.96717 276.083 7.08193 276.083 5.75407C276.083 4.13113 277.19 3.31966 279.403 3.31966H303.083C306.772 3.31966 309.354 4.9426 310.829 8.18849L363.058 123.049C363.501 123.934 364.017 124.303 364.608 124.155C365.345 124.008 365.714 123.491 365.714 122.606V22.3524C365.714 17.6311 364.903 14.3852 363.28 12.6147C361.657 10.6967 359.591 9.51635 357.083 9.07374L353.099 8.4098C351.181 7.96717 350.222 7.08193 350.222 5.75407C350.222 4.13113 351.329 3.31966 353.542 3.31966H385.189C387.403 3.31966 388.509 4.13113 388.509 5.75407C388.509 7.37702 387.55 8.26226 385.632 8.4098L382.755 8.85241C378.919 9.44258 376.263 10.6967 374.788 12.6147C373.312 14.3852 372.575 17.6311 372.575 22.3524V157.573C372.575 160.229 372.058 162.073 371.026 163.106C370.14 164.139 368.96 164.655 367.485 164.655Z" fill="black"/>
<path d="M418.173 162.663C415.96 162.663 414.854 161.852 414.854 160.229C414.854 158.606 415.813 157.721 417.731 157.573L427.69 156.024C430.641 155.581 432.632 154.844 433.665 153.811C434.698 152.631 435.214 150.491 435.214 147.393V14.6065C435.214 12.5409 434.772 11.0655 433.886 10.1803C433.001 9.29504 431.157 8.85241 428.354 8.85241C422.895 8.85241 417.509 11.2131 412.198 15.9344C406.887 20.6556 403.419 28.254 401.796 38.7293L400.69 46.0326C400.395 47.9506 399.362 48.9096 397.591 48.9096C395.378 48.9096 394.419 47.6555 394.714 45.1474L396.706 5.09014C397.001 1.69671 398.329 0 400.69 0C401.723 0 402.682 0.295081 403.567 0.885244C404.452 1.32786 405.927 1.84425 407.993 2.43441C410.206 3.02457 413.673 3.31966 418.395 3.31966H467.747C472.468 3.31966 475.862 3.02457 477.927 2.43441C480.14 1.84425 481.689 1.32786 482.575 0.885244C483.607 0.295081 484.567 0 485.452 0C487.812 0 489.14 1.69671 489.435 5.09014L491.427 45.1474C491.722 47.6555 490.763 48.9096 488.55 48.9096C486.78 48.9096 485.747 47.9506 485.452 46.0326L484.345 38.7293C482.87 28.254 479.476 20.6556 474.165 15.9344C468.854 11.2131 463.394 8.85241 457.788 8.85241C454.985 8.85241 453.14 9.29504 452.255 10.1803C451.37 11.0655 450.927 12.5409 450.927 14.6065V147.393C450.927 150.491 451.444 152.631 452.476 153.811C453.657 154.844 455.649 155.581 458.452 156.024L468.411 157.573C470.329 157.721 471.288 158.606 471.288 160.229C471.288 161.852 470.181 162.663 467.968 162.663H418.173Z" fill="black"/>
<path d="M501.594 162.663C499.38 162.663 498.274 161.852 498.274 160.229C498.274 158.901 499.233 158.016 501.151 157.573L506.241 156.688C509.339 156.098 511.331 155.286 512.216 154.253C513.249 153.221 513.766 151.155 513.766 148.057V17.9261C513.766 14.8278 513.249 12.7622 512.216 11.7295C511.331 10.6967 509.339 9.88521 506.241 9.29504L501.151 8.4098C499.233 7.96717 498.274 7.08193 498.274 5.75407C498.274 4.13113 499.38 3.31966 501.594 3.31966H575.954C579.347 3.31966 581.192 5.01637 581.487 8.4098L583.257 45.1474C583.552 47.6555 582.593 48.9096 580.38 48.9096C578.61 48.9096 577.577 47.9506 577.282 46.0326L575.954 37.8441C574.331 27.8114 571.011 20.5081 565.995 15.9344C560.979 11.2131 554.044 8.85241 545.192 8.85241C539.29 8.85241 535.159 9.73766 532.798 11.5081C530.585 13.1311 529.479 16.0819 529.479 20.3606V73.6964C529.479 75.762 530.511 76.7948 532.577 76.7948H543.643C550.134 76.7948 554.118 73.3276 555.593 66.3932L557.806 55.3276C558.397 53.1145 559.651 52.1555 561.569 52.4506C563.192 52.7457 564.003 53.9998 564.003 56.2129V106.008C564.003 108.221 563.192 109.475 561.569 109.77C559.651 110.065 558.397 109.106 557.806 106.893L555.593 96.0488C554.561 90.8849 553.085 87.4914 551.167 85.8685C549.397 84.2456 546.815 83.4341 543.421 83.4341H532.577C530.511 83.4341 529.479 84.4669 529.479 86.5324V142.081C529.479 147.393 530.807 151.229 533.462 153.59C536.266 155.95 541.282 157.131 548.511 157.131C555.888 157.131 562.159 155.286 567.323 151.598C572.634 147.762 576.323 140.68 578.388 130.352L581.044 117.295C581.487 115.377 582.593 114.418 584.364 114.418C586.429 114.418 587.315 115.672 587.02 118.18L584.806 157.573C584.511 160.967 582.667 162.663 579.274 162.663H501.594Z" fill="black"/>
<path d="M693.94 164.655C681.104 164.655 672.916 156.245 669.375 139.426L664.284 114.86C662.662 106.893 660.817 100.844 658.752 96.7127C656.834 92.5816 654.104 89.7783 650.563 88.3029C647.17 86.8275 642.449 86.0898 636.399 86.0898C634.334 86.0898 632.711 86.68 631.531 87.8603C630.35 88.8931 629.76 90.2209 629.76 91.8439V147.172C629.76 150.27 630.35 152.409 631.531 153.59C632.711 154.622 635.367 155.508 639.498 156.245L647.686 157.573C649.309 157.868 650.121 158.68 650.121 160.008C650.121 161.778 649.014 162.663 646.801 162.663H601.875C599.662 162.663 598.555 161.852 598.555 160.229C598.555 158.901 599.514 158.016 601.432 157.573L606.522 156.688C609.621 156.098 611.613 155.286 612.498 154.253C613.531 153.221 614.047 151.155 614.047 148.057V17.9261C614.047 14.8278 613.531 12.7622 612.498 11.7295C611.613 10.6967 609.621 9.88521 606.522 9.29504L601.432 8.4098C599.514 7.96717 598.555 7.08193 598.555 5.75407C598.555 4.13113 599.662 3.31966 601.875 3.31966H646.801C655.506 3.31966 663.252 5.01637 670.039 8.4098C676.825 11.8032 682.137 16.5245 685.973 22.5737C689.809 28.4753 691.727 35.3359 691.727 43.1556C691.727 52.4506 688.924 60.8604 683.317 68.385C677.711 75.762 670.629 80.9997 662.071 84.098C661.039 84.3931 660.448 84.9095 660.301 85.6472C660.301 86.2373 660.817 86.7537 661.85 87.1964C666.571 89.4095 670.26 92.5078 672.916 96.4914C675.719 100.475 677.858 105.786 679.334 112.426L684.202 134.999C685.825 142.672 687.743 148.131 689.957 151.376C692.17 154.622 694.973 156.245 698.366 156.245C699.547 156.245 700.579 156.098 701.465 155.803C702.497 155.36 703.751 154.622 705.227 153.59C706.407 152.852 707.514 152.704 708.547 153.147C709.579 153.442 710.096 154.18 710.096 155.36C710.096 157.868 708.473 160.081 705.227 161.999C701.981 163.77 698.219 164.655 693.94 164.655ZM644.588 80.557C654.621 80.557 662.219 77.2374 667.383 70.5981C672.547 63.8112 675.129 54.8112 675.129 43.5982C675.129 32.6802 672.104 24.1966 666.055 18.1475C660.153 11.9508 651.965 8.85241 641.489 8.85241C633.67 8.85241 629.76 11.8032 629.76 17.7048V68.385C629.76 76.4997 634.703 80.557 644.588 80.557Z" fill="black"/>
<path d="M754.173 164.876C753.583 164.876 752.919 164.655 752.181 164.212C751.443 163.77 750.927 162.811 750.632 161.335L715.665 21.0245C714.632 16.8934 713.452 14.0163 712.124 12.3934C710.944 10.7704 708.878 9.66389 705.927 9.07374L702.607 8.4098C700.542 7.96717 699.509 7.00816 699.509 5.53276C699.509 4.05736 700.616 3.31966 702.829 3.31966H740.673C742.739 3.31966 743.771 4.13113 743.771 5.75407C743.771 7.37702 742.517 8.26226 740.009 8.4098L735.804 8.85241C733.296 8.99996 731.673 9.81144 730.935 11.2868C730.345 12.6147 730.419 14.9016 731.157 18.1475L756.829 124.598C757.124 125.483 757.566 125.926 758.156 125.926C758.894 125.926 759.337 125.483 759.484 124.598L784.935 22.795C787.001 14.3852 784.788 9.73766 778.296 8.85241L774.976 8.4098C772.468 7.96717 771.214 7.08193 771.214 5.75407C771.214 4.13113 772.247 3.31966 774.312 3.31966H805.296C807.509 3.31966 808.615 4.05736 808.615 5.53276C808.615 7.00816 807.582 7.96717 805.517 8.4098L802.197 9.07374C799.394 9.66389 797.181 11.1393 795.558 13.4999C794.083 15.713 792.829 18.8852 791.796 23.0163L757.493 161.335C757.197 162.811 756.681 163.77 755.943 164.212C755.353 164.655 754.763 164.876 754.173 164.876Z" fill="black"/>
<path d="M808.705 162.663C806.492 162.663 805.385 161.852 805.385 160.229C805.385 158.901 806.344 158.016 808.263 157.573L813.353 156.688C816.451 156.098 818.443 155.286 819.328 154.253C820.361 153.221 820.877 151.155 820.877 148.057V17.9261C820.877 14.8278 820.361 12.7622 819.328 11.7295C818.443 10.6967 816.451 9.88521 813.353 9.29504L808.263 8.4098C806.344 7.96717 805.385 7.08193 805.385 5.75407C805.385 4.13113 806.492 3.31966 808.705 3.31966H848.762C850.975 3.31966 852.082 4.13113 852.082 5.75407C852.082 7.08193 851.123 7.96717 849.205 8.4098L844.115 9.29504C841.017 9.88521 838.951 10.6967 837.918 11.7295C837.033 12.7622 836.59 14.8278 836.59 17.9261V148.057C836.59 151.155 837.033 153.221 837.918 154.253C838.951 155.286 841.017 156.098 844.115 156.688L849.205 157.573C851.123 158.016 852.082 158.901 852.082 160.229C852.082 161.852 850.975 162.663 848.762 162.663H808.705Z" fill="black"/>
<path d="M863.817 162.663C861.604 162.663 860.497 161.852 860.497 160.229C860.497 158.901 861.456 158.016 863.374 157.573L868.464 156.688C871.563 156.098 873.554 155.286 874.44 154.253C875.472 153.221 875.989 151.155 875.989 148.057V17.9261C875.989 14.8278 875.472 12.7622 874.44 11.7295C873.554 10.6967 871.563 9.88521 868.464 9.29504L863.374 8.4098C861.456 7.96717 860.497 7.08193 860.497 5.75407C860.497 4.13113 861.604 3.31966 863.817 3.31966H938.177C941.57 3.31966 943.415 5.01637 943.71 8.4098L945.48 45.1474C945.775 47.6555 944.816 48.9096 942.603 48.9096C940.833 48.9096 939.8 47.9506 939.505 46.0326L938.177 37.8441C936.554 27.8114 933.234 20.5081 928.218 15.9344C923.202 11.2131 916.267 8.85241 907.415 8.85241C901.513 8.85241 897.382 9.73766 895.021 11.5081C892.808 13.1311 891.702 16.0819 891.702 20.3606V73.6964C891.702 75.762 892.735 76.7948 894.8 76.7948H905.866C912.357 76.7948 916.341 73.3276 917.816 66.3932L920.03 55.3276C920.62 53.1145 921.874 52.1555 923.792 52.4506C925.415 52.7457 926.226 53.9998 926.226 56.2129V106.008C926.226 108.221 925.415 109.475 923.792 109.77C921.874 110.065 920.62 109.106 920.03 106.893L917.816 96.0488C916.784 90.8849 915.308 87.4914 913.39 85.8685C911.62 84.2456 909.038 83.4341 905.644 83.4341H894.8C892.735 83.4341 891.702 84.4669 891.702 86.5324V142.081C891.702 147.393 893.03 151.229 895.685 153.59C898.489 155.95 903.505 157.131 910.735 157.131C918.112 157.131 924.382 155.286 929.546 151.598C934.857 147.762 938.546 140.68 940.611 130.352L943.267 117.295C943.71 115.377 944.816 114.418 946.587 114.418C948.652 114.418 949.538 115.672 949.243 118.18L947.029 157.573C946.734 160.967 944.89 162.663 941.497 162.663H863.817Z" fill="black"/>
<path d="M1050.88 164.876C1050.29 164.876 1049.7 164.655 1049.11 164.212C1048.52 163.77 1048.08 162.811 1047.78 161.335L1030.74 92.7291C1030.6 91.5488 1030.15 91.0324 1029.42 91.1799C1028.68 91.1799 1028.16 91.6963 1027.87 92.7291L1008.83 161.335C1008.39 162.811 1007.87 163.77 1007.28 164.212C1006.84 164.655 1006.33 164.876 1005.74 164.876C1005.15 164.876 1004.48 164.655 1003.74 164.212C1003.15 163.77 1002.71 162.811 1002.42 161.335L967.449 21.0245C966.416 16.8934 965.236 14.0163 963.908 12.3934C962.727 10.7704 960.662 9.66389 957.711 9.07374L954.391 8.4098C952.326 7.96717 951.293 7.00816 951.293 5.53276C951.293 4.05736 952.4 3.31966 954.613 3.31966H990.244C992.309 3.31966 993.342 4.13113 993.342 5.75407C993.342 7.08193 992.236 7.96717 990.023 8.4098L987.588 8.85241C985.08 9.29504 983.457 10.1803 982.719 11.5081C982.129 12.6885 982.203 14.9016 982.941 18.1475L1009.06 126.147C1009.35 127.18 1009.79 127.696 1010.38 127.696C1011.12 127.696 1011.64 127.18 1011.93 126.147L1021.89 90.0734C1023.51 84.4669 1024.33 79.303 1024.33 74.5817C1024.33 69.8604 1023.59 64.6227 1022.11 58.8686L1012.82 21.0245C1011.78 16.8934 1010.75 13.9426 1009.72 12.1721C1008.83 10.4016 1007.58 9.36881 1005.96 9.07374L1002.64 8.4098C1000.57 7.96717 999.539 7.00816 999.539 5.53276C999.539 4.05736 1000.65 3.31966 1002.86 3.31966H1033.18C1035.24 3.31966 1036.28 4.13113 1036.28 5.75407C1036.28 7.08193 1035.17 7.96717 1032.96 8.4098L1030.52 8.85241C1028.6 9.1475 1027.42 9.95897 1026.98 11.2868C1026.69 12.6147 1026.91 14.9016 1027.65 18.1475L1035.17 49.7949C1035.46 50.8277 1035.91 51.3441 1036.5 51.3441C1037.24 51.3441 1037.75 50.8277 1038.05 49.7949L1046.01 22.795C1047.64 17.1885 1048.23 13.4999 1047.78 11.7295C1047.49 9.95897 1046.68 8.99996 1045.35 8.85241L1042.92 8.4098C1040.7 7.96717 1039.6 7.08193 1039.6 5.75407C1039.6 4.13113 1040.63 3.31966 1042.69 3.31966H1063.72C1066.23 3.31966 1067.48 4.13113 1067.48 5.75407C1067.48 7.22947 1066.23 8.11471 1063.72 8.4098L1061.28 8.63111C1059.37 8.77864 1057.74 9.95897 1056.42 12.1721C1055.24 14.3852 1053.91 17.9999 1052.43 23.0163L1044.02 52.008C1042.4 57.467 1041.51 62.6309 1041.37 67.4997C1041.37 72.221 1042.03 77.4587 1043.36 83.2128L1053.32 124.819C1053.61 125.852 1054.06 126.368 1054.65 126.368C1055.38 126.368 1055.83 125.852 1055.97 124.819L1081.42 22.795C1083.49 14.2376 1082.16 9.59011 1077.44 8.85241L1075.01 8.4098C1072.79 7.96717 1071.69 7.00816 1071.69 5.53276C1071.69 4.05736 1072.72 3.31966 1074.78 3.31966H1099.57C1102.08 3.31966 1103.33 4.13113 1103.33 5.75407C1103.33 7.22947 1102.08 8.11471 1099.57 8.4098L1097.14 8.63111C1095.22 8.77864 1093.52 9.95897 1092.05 12.1721C1090.72 14.2376 1089.46 17.8524 1088.28 23.0163L1053.98 161.335C1053.69 162.811 1053.24 163.77 1052.65 164.212C1052.06 164.655 1051.47 164.876 1050.88 164.876Z" fill="black"/>
<path d="M1103.5 162.663C1101.28 162.663 1100.18 161.852 1100.18 160.229C1100.18 158.901 1101.14 158.016 1103.06 157.573L1108.15 156.688C1111.24 156.098 1113.24 155.286 1114.12 154.253C1115.15 153.221 1115.67 151.155 1115.67 148.057V17.9261C1115.67 14.8278 1115.15 12.7622 1114.12 11.7295C1113.24 10.6967 1111.24 9.88521 1108.15 9.29504L1103.06 8.4098C1101.14 7.96717 1100.18 7.08193 1100.18 5.75407C1100.18 4.13113 1101.28 3.31966 1103.5 3.31966H1177.86C1181.25 3.31966 1183.1 5.01637 1183.39 8.4098L1185.16 45.1474C1185.46 47.6555 1184.5 48.9096 1182.28 48.9096C1180.51 48.9096 1179.48 47.9506 1179.19 46.0326L1177.86 37.8441C1176.24 27.8114 1172.92 20.5081 1167.9 15.9344C1162.88 11.2131 1155.95 8.85241 1147.1 8.85241C1141.19 8.85241 1137.06 9.73766 1134.7 11.5081C1132.49 13.1311 1131.38 16.0819 1131.38 20.3606V73.6964C1131.38 75.762 1132.42 76.7948 1134.48 76.7948H1145.55C1152.04 76.7948 1156.02 73.3276 1157.5 66.3932L1159.71 55.3276C1160.3 53.1145 1161.55 52.1555 1163.47 52.4506C1165.1 52.7457 1165.91 53.9998 1165.91 56.2129V106.008C1165.91 108.221 1165.1 109.475 1163.47 109.77C1161.55 110.065 1160.3 109.106 1159.71 106.893L1157.5 96.0488C1156.46 90.8849 1154.99 87.4914 1153.07 85.8685C1151.3 84.2456 1148.72 83.4341 1145.33 83.4341H1134.48C1132.42 83.4341 1131.38 84.4669 1131.38 86.5324V142.081C1131.38 147.393 1132.71 151.229 1135.37 153.59C1138.17 155.95 1143.19 157.131 1150.42 157.131C1157.79 157.131 1164.06 155.286 1169.23 151.598C1174.54 147.762 1178.23 140.68 1180.29 130.352L1182.95 117.295C1183.39 115.377 1184.5 114.418 1186.27 114.418C1188.33 114.418 1189.22 115.672 1188.92 118.18L1186.71 157.573C1186.42 160.967 1184.57 162.663 1181.18 162.663H1103.5Z" fill="black"/>
<path d="M1295.84 164.655C1283.01 164.655 1274.82 156.245 1271.28 139.426L1266.19 114.86C1264.57 106.893 1262.72 100.844 1260.66 96.7127C1258.74 92.5816 1256.01 89.7783 1252.47 88.3029C1249.07 86.8275 1244.35 86.0898 1238.3 86.0898C1236.24 86.0898 1234.61 86.68 1233.43 87.8603C1232.25 88.8931 1231.66 90.2209 1231.66 91.8439V147.172C1231.66 150.27 1232.25 152.409 1233.43 153.59C1234.61 154.622 1237.27 155.508 1241.4 156.245L1249.59 157.573C1251.21 157.868 1252.02 158.68 1252.02 160.008C1252.02 161.778 1250.92 162.663 1248.71 162.663H1203.78C1201.57 162.663 1200.46 161.852 1200.46 160.229C1200.46 158.901 1201.42 158.016 1203.34 157.573L1208.43 156.688C1211.52 156.098 1213.52 155.286 1214.4 154.253C1215.43 153.221 1215.95 151.155 1215.95 148.057V17.9261C1215.95 14.8278 1215.43 12.7622 1214.4 11.7295C1213.52 10.6967 1211.52 9.88521 1208.43 9.29504L1203.34 8.4098C1201.42 7.96717 1200.46 7.08193 1200.46 5.75407C1200.46 4.13113 1201.57 3.31966 1203.78 3.31966H1248.71C1257.41 3.31966 1265.16 5.01637 1271.94 8.4098C1278.73 11.8032 1284.04 16.5245 1287.88 22.5737C1291.71 28.4753 1293.63 35.3359 1293.63 43.1556C1293.63 52.4506 1290.83 60.8604 1285.22 68.385C1279.61 75.762 1272.53 80.9997 1263.98 84.098C1262.94 84.3931 1262.35 84.9095 1262.21 85.6472C1262.21 86.2373 1262.72 86.7537 1263.75 87.1964C1268.48 89.4095 1272.16 92.5078 1274.82 96.4914C1277.62 100.475 1279.76 105.786 1281.24 112.426L1286.11 134.999C1287.73 142.672 1289.65 148.131 1291.86 151.376C1294.07 154.622 1296.88 156.245 1300.27 156.245C1301.45 156.245 1302.48 156.098 1303.37 155.803C1304.4 155.36 1305.66 154.622 1307.13 153.59C1308.31 152.852 1309.42 152.704 1310.45 153.147C1311.48 153.442 1312 154.18 1312 155.36C1312 157.868 1310.38 160.081 1307.13 161.999C1303.89 163.77 1300.12 164.655 1295.84 164.655ZM1246.49 80.557C1256.52 80.557 1264.12 77.2374 1269.29 70.5981C1274.45 63.8112 1277.03 54.8112 1277.03 43.5982C1277.03 32.6802 1274.01 24.1966 1267.96 18.1475C1262.06 11.9508 1253.87 8.85241 1243.39 8.85241C1235.57 8.85241 1231.66 11.8032 1231.66 17.7048V68.385C1231.66 76.4997 1236.61 80.557 1246.49 80.557Z" fill="black"/>
</svg>


        </div>
      </div>
    </div>
    </div>
  );
};








