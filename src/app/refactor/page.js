'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Components/Navbar';
import useStore from '../../store/module';

export default function Home() {
  const router = useRouter();
  
  // Use zustand store for interview parameters
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const time = useStore((state) => state.time);
  const selectedModel = useStore((state) => state.selectedModel);
  const setDesign = useStore((state) => state.setDesign);
  const setTarget = useStore((state) => state.setTarget);
  const setTohelp = useStore((state) => state.setTohelp);
  const setTime = useStore((state) => state.setTime);
  const setSelectedModel = useStore((state) => state.setSelectedModel);
  
  const [difficulty, setDifficulty] = useState('Easy');
  const [inputDevice, setInputDevice] = useState('Desktop Microphone');
  const [outputDevice, setOutputDevice] = useState('Desktop Speakers');
  const [audioDevices, setAudioDevices] = useState({
    input: [],
    output: []
  });

  // Fetch available audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(device => device.kind === 'audioinput');
        const outputs = devices.filter(device => device.kind === 'audiooutput');
        
        setAudioDevices({
          input: inputs.length > 0 ? inputs : [{ deviceId: 'default', label: 'Desktop Microphone' }],
          output: outputs.length > 0 ? outputs : [{ deviceId: 'default', label: 'Desktop Speakers' }]
        });

        if (inputs.length > 0) setInputDevice(inputs[0].label || 'Desktop Microphone');
        if (outputs.length > 0) setOutputDevice(outputs[0].label || 'Desktop Speakers');
      } catch (error) {
        console.log('Audio device enumeration not available');
      }
    };

    getAudioDevices();
  }, []);

  const designOptions = [
    'a FAQ page',
    'a landing page',
    'a product page',
    'a pricing page',
    'a signup page',
    'a login page',
    'a dashboard page',
    'a settings page',
    'a profile page',
    'a blog page',
    'a contact page',
    'a about page',
    'a services page',
    'a products page',
    'a testimonials page'
  ];

  const forOptions = [
    'a finance tracking app',
    'a fitness tracking app',
    'a productivity app',
    'a task management app',
    'a calendar app',
    'a notes app',
    'a music player app',
    'a video player app',
    'a hospital recipient page',
    'a local coffee shop',
    'a nonprofit organization',
    'a tech startup'
  ];

  const toHelpOptions = [
    'accountants',
    'fitness trainers',
    'productivity experts',
    'task management experts',
    'calendar experts',
    'notes experts',
    'music players',
    'video players',
    'neurodivergent people',
    'elderly users',
    'busy professionals',
    'students'
  ];

  const reloadChallenge = () => {
    const randomDesign = designOptions[Math.floor(Math.random() * designOptions.length)];
    const randomFor = forOptions[Math.floor(Math.random() * forOptions.length)];
    const randomToHelp = toHelpOptions[Math.floor(Math.random() * toHelpOptions.length)];

    setDesign(randomDesign);
    setTarget(randomFor);
    setTohelp(randomToHelp);
  };
  
  // Initialize with random values on mount
  useEffect(() => {
    if (!design || !target || !tohelp) {
      reloadChallenge();
    }
  }, []);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert('Microphone is working! You should see a permission prompt if this is your first time.');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('Microphone access denied or not available.');
    }
  };

  const startInterview = () => {
    // Navigate to refactor/whiteboard page with time parameter
    const timeInSeconds = time * 60; // Convert minutes to seconds
    router.push(`/whiteboard?time=${timeInSeconds}`);
  };

  return (
    <div className="flex flex-col min-h-screen  bg-gray-100">

      <div className = "absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({length: 256}).map((_, index) => (
          <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
        ))}
      </div>
      {/* Navbar */}
      {/* <Navbar activeTab="interview" className="absolute left-1/2 -translate-x-1/2" /> */}
      
      {/* Main Content */}
      <div className = "flex-1 flex flex-col gap-0 items-center z-1 justify-center p-6">
       <div className="flex w-full h-full flex-1 flex-col bg-white border border-gray-200 rounded-xl gap-0 items-center z-1 justify-center">
        <div className = "border-l border-r border-gray-200 w-3xl flex-1" />
        <div className = "h-px w-full bg-gray-200" />
        <div className="bg-white border-l border-r border-gray-200  p-8 flex flex-col gap-5 max-w-3xl relative w-full">
        {/* Top Controls */}
        <div className="flex gap-5 items-end">
          <button
            onClick={reloadChallenge}
            className="bg-gray-100 px-4 py-2 rounded-xl cursor-pointer text-black font-light hover:bg-[#e5e5e5] transition-colors"
          >
            Reload Challenge
          </button>
          
          <div className="flex gap-5 items-end justify-center">
            <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" />
            
            {/* Time Selector */}
            <div className="flex flex-col gap-2">
              <p className="text-lg text-black font-serif">Time</p>
              <div className="flex gap-2.5 items-center">
                <div className="bg-gray-100 px-4 py-2 rounded-xl flex items-center justify-center">
                  <input
                    type="number"
                    value={time || 30}
                    onChange={(e) => setTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-black font-light w-12 text-center outline-none"
                    min="1"
                    max="120"
                  />
                </div>
                <p className="text-black font-light text-base">Min</p>
              </div>
            </div>

            <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" />

            {/* Difficulty Selector */}
            <div className="flex flex-col gap-2 justify-end">
              <p className="text-lg text-black font-serif">Difficulty</p>
              <div className="flex gap-2.5 items-start">
                {['Easy', 'Medium', 'Hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-xl cursor-pointer font-light transition-colors ${
                      difficulty === level
                        ? 'bg-[#262626] text-white'
                        : 'bg-gray-100 text-black hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

           
          </div>
        </div>

        <div className="bg-[#e4e4e4] h-px w-full rounded-full" />

        {/* Challenge Display */}
        <div className="flex flex-col gap-2.5 items-start w-full">
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-xl w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-xl bg-red-100">DESIGN</span>{' '}
              <span className="font-light">{design || 'a landing page'}</span>
            </p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-xl w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-xl bg-blue-100">FOR</span>{' '}
              <span className="font-light">{target || 'a hospital recipient page'}</span>
            </p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-xl w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-xl bg-pink-100">TO HELP</span>{' '}
              <span className="font-light">{tohelp || 'neurodivergent people'}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#e4e4e4] h-px w-full rounded-full" />

        {/* Audio Settings */}
        <div className="flex gap-5 items-start">
          <div className="flex flex-col gap-2">
            <p className="text-lg text-black font-serif">Input</p>
            <div className="flex gap-2 items-start">
              <div className="bg-gray-100 px-4 py-2 rounded-xl w-40 relative">
                <p className="text-black font-light text-base truncate">
                  {inputDevice || 'Desktop Microphone'}
                </p>
                <select
                  value={inputDevice}
                  onChange={(e) => setInputDevice(e.target.value)}
                  className="absolute opacity-0 inset-0 w-full cursor-pointer"
                >
                  {audioDevices.input.map((device, idx) => (
                    <option key={idx} value={device.label || `Microphone ${idx + 1}`}>
                      {device.label || `Microphone ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={testMicrophone}
                className="bg-white border border-gray-200 px-4 py-2 rounded-xl cursor-pointer text-black font-light hover:bg-[#f9f9f9] transition-colors"
              >
                Test Microphone
              </button>
            </div>
          </div>

          <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" />

          <div className="flex flex-col gap-2">
            <p className="text-lg text-black font-serif">Output</p>
            <div className="bg-gray-100 px-4 py-2 rounded-xl w-40 relative">
              <p className="text-black font-light text-base truncate">
                {outputDevice || 'Desktop Speakers'}
              </p>
              <select
                value={outputDevice}
                onChange={(e) => setOutputDevice(e.target.value)}
                className="absolute opacity-0 inset-0 w-full cursor-pointer"
              >
                {audioDevices.output.map((device, idx) => (
                  <option key={idx} value={device.label || `Speaker ${idx + 1}`}>
                    {device.label || `Speaker ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startInterview}
          className="bg-[#386ef8] px-4 py-3 cursor-pointer rounded-xl text-white text-lg font-serif w-full hover:bg-[#2557d4] transition-colors"
        >
          START INTERVIEW
        </button>
        </div>
        <div className = "h-px w-full bg-gray-200" />
         <div className = "border-l border-r border-gray-200 w-3xl flex-1" />
      </div>
      </div>
    </div>
  );
}
