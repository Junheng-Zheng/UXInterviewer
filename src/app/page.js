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

export default function Home() {
  return (
    <>
      <Script id="excalidraw-assets" strategy="beforeInteractive">
        {`window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw/dist/";`}
      </Script>

      <Interview />
    </>
  );
}
