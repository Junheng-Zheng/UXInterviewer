'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Components/Navbar';
import { RefreshCw, Sparkles, Keyboard, AudioLines, Tally1, Tally2, Tally3, Zap, Clock     } from 'lucide-react';
import Profile from '../Components/Profile';
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
    <div className="flex flex-col min-h-screen  text-sm bg-gray-100">

      {/* <div className = "absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({length: 256}).map((_, index) => (
          <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
        ))}
      </div>
      
      {/* Profile Button - Top Right */}
      
      {/* Navbar */}
      {/* <Navbar activeTab="interview" className="absolute left-1/2 -translate-x-1/2" /> */}

      {/* Main Content */}
      <div className = "flex-1 flex flex-col gap-0 items-center  justify-center p-8">

       <div className="flex w-full h-full flex-1 flex-col bg-white relative rounded-xl gap-0 items-center z-1 justify-center">
        
                    <div
        className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
        <div className = "flex border-b z-200 border-gray-200 justify-between w-full items-center p-6">
       <div className = "w-full flex justify-start">
         <div className = "w-[56px] h-[56px] relative bg-gray-200 rounded-full"/>
       </div>
          <Navbar />
        <div className = "w-full flex justify-end">
          <Profile />
          </div>
        </div>
        <div className = "border-l border-r border-gray-200 w-3xl flex-1" />
                <div className = "h-px w-full bg-gray-200" />
        <div className=" border-l border-r border-gray-200  z-20 p-8 flex flex-col gap-5 max-w-3xl relative w-full">
        {/* Top Controls */}
          
        <div className="flex gap-5 items-end">
       
          
          <div className="flex gap-3 items-center justify-center">
             <button
            onClick={reloadChallenge}
            className="bg-blue-100 px-4 py-4  w-fit flex items-center justify-center gap-2 rounded-xl cursor-pointer text-black font-normal hover:bg-[#e5e5e5] transition-colors"
          >

            <RefreshCw size={16} />
            New

            
          </button>

            {/* <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" /> */}
            
            {/* Time Selector */}
            {/* <div className="flex flex-col gap-2">
              <p className="text-xl text-black font-serif">Time</p>
              <div className="flex gap-2.5 items-center">
                <div className="bg-gray-100 px-4 py-2 rounded-xl flex items-center justify-center">
                  <input
                    type="number"
                    value={time || 30}
                    onChange={(e) => setTime(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-black font-normal w-12 text-center outline-none"
                    min="1"
                    max="120"
                  />
                </div>
                <p className="text-black font-normal text-base">Min</p>
              </div>
            </div> */}
            <div className="items-center relative flex flex-nowrap w-fit h-fit rounded-xl  bg-gray-100">

            <div className = "flex flex-nowrap w-fit p-2 px-4  font-serif text-lg items-center gap-2">
          Time
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2 flex-nowrap p-2 items-center rounded-xl">
                  <button className="px-3 py-2 bg-white h-fit text-black cursor-pointer pointer-events-auto flex-nowrap rounded-xl flex items-center gap-2">
                    <Clock size={16} strokeWidth={1.2} />
                    {time} Min
                  </button>
                </div>
            </div>

            {/* <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" /> */}

            {/* Difficulty Selector */}
            {/* <div className="flex flex-col gap-2 justify-end">
              <p className="text-xl text-black font-serif">Difficulty</p>
              <div className="flex gap-2.5 items-start">
                {['Easy', 'Medium', 'Hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-xl cursor-pointer font-normal transition-colors ${
                      difficulty === level
                        ? 'bg-[#262626] text-white'
                        : 'bg-gray-100 text-black hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div> */}
              <div className="items-center relative flex  w-fit h-fit rounded-xl  bg-gray-100">

           <div className = "flex w-fit p-2 px-4  font-serif text-lg bg items-center gap-2">
          Difficulty
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2  p-2 items-center rounded-xl">
                   {['Easy', 'Medium', 'Hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer font-normal transition-colors ${
                      difficulty === level
                        ? 'bg-[#262626] text-white'
                        : 'bg-gray-100 text-black bg-white hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {difficulty === level ? <Zap  size={16} strokeWidth={1.2} stroke="#fcd34d" fill="#fcd34d" /> : <Zap  size={16} strokeWidth={1.2} />} 
                    {level}
                  </button>
                ))}
                  
                </div>
       
      
        </div>


           
          </div>
        </div>

        <div className="bg-[#e4e4e4] h-px w-full rounded-full" />

        {/* Challenge Display */}
        <div className="flex flex-col gap-2.5  text-base items-start w-full">
          <div className="bg-gray-100 pl-3 pr-5  flex gap-2 items-center py-2 h-fit rounded-xl w-fit">
          
              <div className="font-serif text-lg px-3 py-2 rounded-xl  bg-red-100">DESIGN</div>{' '}
              <p className="font-normal">{design || 'a landing page'}</p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5  flex gap-2 items-center py-3 h-fit  rounded-xl w-fit">
          
              <div className="font-serif text-lg px-3 py-2 rounded-xl bg-blue-100">FOR</div>{' '}
              <p className="font-normal">{target || 'a hospital recipient page'}</p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5  flex gap-2 items-center py-3 h-fit  rounded-xl w-fit">
            <div className="font-serif text-lg px-3 py-2 rounded-xl bg-pink-100">TO HELP</div>{' '}
            <p className="font-normal">{tohelp || 'neurodivergent people'}</p>
          </div>
        </div>

        <div className="bg-[#e4e4e4] h-px w-full rounded-full" />

        {/* Audio Settings */}
        {/* <div className="flex gap-5 items-start">
          <div className="flex flex-col gap-2">
            <p className="text-lg text-black font-serif">Input</p>
            <div className="flex gap-2 items-start">
              <div className="bg-gray-100 px-4 py-2 rounded-xl w-40 relative">
                <p className="text-black font-normal text-base truncate">
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
                className="bg-white border border-gray-200 px-4 py-2 rounded-xl cursor-pointer text-black font-normal hover:bg-[#f9f9f9] transition-colors"
              >
                Test Microphone
              </button>
            </div>
          </div>

          <div className="bg-[#e4e4e4] w-px self-stretch rounded-full" />

          <div className="flex flex-col gap-2">
            <p className="text-lg text-black font-serif">Output</p>
            <div className="bg-gray-100 px-4 py-2 rounded-xl w-40 relative">
              <p className="text-black font-normal text-base truncate">
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
        </div> */}

        {/* Start Button */}
        <button
          onClick={startInterview}
          className="bg-[#262626] px-4 py-3 flex items-center justify-center gap-2 cursor-pointer rounded-xl  text-xl font-serif  w-full hover:bg-black  text-white transition-colors"
        >
          <Sparkles size={20} strokeWidth={1.2} />

          Start Interview
        </button>
        </div>
        <div className = "h-px w-full bg-gray-200" />
         <div className = "border-l border-r border-gray-200 w-3xl flex-1" />
      </div>
      </div>
    </div>
  );
}
