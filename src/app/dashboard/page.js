'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Components/Navbar';
import { RefreshCw, Sparkles, Keyboard, AudioLines, Tally1, Tally2, Tally3, Zap, Clock, Mic, Lock, Unlock, ArrowUp, Plus, Minus     } from 'lucide-react';
import Profile from '../Components/Profile';
import useStore from '../../store/module';
import { SplinePointer } from 'lucide-react';
import { HeartHandshake, UserSearch, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

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
  
  // Lock states for each prompt line
  const [lockedFields, setLockedFields] = useState({
    design: false,
    target: false,
    tohelp: false
  });

  // Load lock states from localStorage on mount
  useEffect(() => {
    const savedLocks = localStorage.getItem('promptLockStates');
    if (savedLocks) {
      try {
        setLockedFields(JSON.parse(savedLocks));
      } catch (error) {
        console.error('Error loading lock states:', error);
      }
    }
  }, []);

  // Save lock states to localStorage when they change
  useEffect(() => {
    localStorage.setItem('promptLockStates', JSON.stringify(lockedFields));
  }, [lockedFields]);

  // Toggle lock state for a field
  const toggleLock = (field) => {
    setLockedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

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

const [challenges, setChallenges] = useState([]);

  const parseCSV = (text) => {
  const [header, ...rows] = text.trim().split('\n');
  const keys = header.split(',');

  return rows.map(row => {
    const values = row.split(',');
    return Object.fromEntries(
      keys.map((key, i) => [key, values[i]])
    );
  });
};



useEffect(() => {
  const loadCSV = async () => {
    const res = await fetch('/csv/challenges.csv');
    const text = await res.text();
    setChallenges(parseCSV(text));
  };

  loadCSV();
}, []);


const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reloadChallenge = () => {
  if (!challenges.length) return;

  // Only reload unlocked fields
  if (!lockedFields.design) {
    const designOptions = challenges.filter(
      c => c.type === 'design' && c.difficulty === difficulty
    );
    setDesign(getRandom(designOptions)?.value);
  }

  if (!lockedFields.target) {
    const targetOptions = challenges.filter(
      c => c.type === 'target' && c.difficulty === difficulty
    );
    setTarget(getRandom(targetOptions)?.value);
  }

  if (!lockedFields.tohelp) {
    const toHelpOptions = challenges.filter(
      c => c.type === 'tohelp' && c.difficulty === difficulty
    );
    setTohelp(getRandom(toHelpOptions)?.value);
  }
};


useEffect(() => {
  if (challenges.length) {
    reloadChallenge();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [difficulty, challenges]);



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
      <div className = "flex-1 flex flex-col gap-0 items-center  justify-center xl:p-8">

       <div className="flex w-full h-full flex-1 flex-col bg-white relative rounded-xl gap-0 items-center z-1 justify-center">
        
                    <div
        className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
        <div className = "flex border-b z-200 border-gray-200 justify-between w-full items-center p-6">
       <div className = "w-full flex justify-start">
        <div className="w-11 h-11 opacity-12 rounded-lg overflow-hidden relative">
            <Image src="/logo.png" alt="logo" fill />
          </div>
       </div>
          <Navbar />
        <div className = "w-full flex justify-end">
          <Profile />
          </div>
        </div>
        <div className = "border-l border-r border-gray-200 p-5 w-3xl flex h-fit " >
          <div className = "w-full  border border-gray-200/80 relative overflow-hidden  bg-white  z-20 p-4 flex h-fit gap-4 items-start">
               <div className="w-11 h-11  rounded-md overflow-hidden relative">
            <Image src="/logo.png" alt="logo" fill />
          </div>
          <div className = "flex flex-col  gap-1">
            <h3 className="text-2xl font-serif">Start An Interview</h3>
            <p className="text-gray-500 line-clamp-2  w-2/3">
              Generate your prompt, reload, choose your difficulty and duration,  and start the interview. 
            </p>
<div className="absolute bottom-0 h-full opacity-10 right-0 perspective-[1000px]">
  <SplinePointer
    className="
      block
      w-full h-full
      scale-140
          transform
      transform-3d
      origin-center
      rotate-z-0
      -rotate-x-32 rotate-y-32
    "
    strokeWidth={1.2}
  />
</div>

          </div>
          </div>
        </div>
                <div className = "h-px w-full bg-gray-200" />
        <div className=" border-l border-r border-gray-200  z-20 p-5 flex flex-col gap-5 max-w-3xl relative w-full">
        {/* Top Controls */}
          
        <div className="flex  items-end">
       
          
          <div className="flex gap-3 xl:items-center  flex-col xl:flex-row justify-center">

            <div className="flex gap-3">
             <button
            onClick={reloadChallenge}
            className="border border-gray-200  bg-white px-6 py-4  w-fit flex items-center justify-center gap-2 rounded-xl cursor-pointer text-black font-normal hover:bg-gray-50 transition-colors"
          >

            <RefreshCw size={16} />
            New

            
          </button>

      
            <div className="items-center relative flex flex-nowrap w-fit h-fit rounded-xl  bg-gray-100">

            <div className = "flex flex-nowrap w-fit p-2 px-4  font-serif text-lg items-center gap-2">
          Time
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2 flex-nowrap p-2 items-center rounded-xl">
                 <div className="px-3 py-2 bg-white rounded-xl flex items-center ">

  <button
    onClick={() => setTime(Math.max(5, time - 5))}
    className="hover:bg-gray-100 p-1 rounded-lg"
  >
    <Minus size={16} strokeWidth={1.2} />
  </button>

  <span className="min-w-[60px] text-center">
    {time} Min
  </span>

  <button
    onClick={() => setTime(Math.min(60, time + 5))}
    className="hover:bg-gray-100 p-1 rounded-lg"
  >
    <Plus size={16} strokeWidth={1.2} />
  </button>

</div>

                </div>
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
                        : 'bg-gray-100 text-black bg-white hover:bg-gray-50'
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
        <div className="flex flex-col gap-2.5 text-2xl font-serif items-start w-full">
          <div className = "flex w-full  justify-between items-center">
            <div className="bg-gray-100   flex items-center h-fit rounded-xl w-fit">
          
            <div className = "flex items-center p-2">
                <div className="font-serif flex items-center gap-2 px-3 py-2 rounded-xl  bg-blue-100"> <SplinePointer size={24} strokeWidth={1.2}  /> Design </div>{' '}
            </div>
              <div className = "w-px self-stretch bg-gray-200" />
           <div className = "p-2 px-4">
               <p className="font-normal ">{design || ''}</p>
           </div>
          </div>
             <button 
               onClick={() => toggleLock('design')}
               className="cursor-pointer hover:opacity-70 transition-opacity"
               title={lockedFields.design ? "Click to unlock" : "Click to lock"}
             >
               {lockedFields.design ? <Lock size={20} strokeWidth={1.5} /> : <Unlock size={20} strokeWidth={1.5} />}
             </button>
          </div>
            <div className = "flex w-full  justify-between items-center">
            <div className="bg-gray-100   flex items-center h-fit rounded-xl w-fit">
          
            <div className = "flex items-center p-2">
                <div className="font-serif flex items-center gap-2 px-3 py-2 rounded-xl  bg-red-100">  <UserSearch size={24} strokeWidth={1.2}  /> For </div>{' '}
            </div>
              <div className = "w-px self-stretch bg-gray-200" />
           <div className = "p-2 px-4">
               <p className="font-normal ">{target || ''}</p>
           </div>
          </div>
             <button 
               onClick={() => toggleLock('target')}
               className="cursor-pointer hover:opacity-70 transition-opacity"
               title={lockedFields.target ? "Click to unlock" : "Click to lock"}
             >
               {lockedFields.target ? <Lock size={20} strokeWidth={1.5} /> : <Unlock size={20} strokeWidth={1.5} />}
             </button>
          </div>
          <div className = "flex w-full  justify-between items-center">
          <div className="bg-gray-100   flex items-center h-fit  rounded-xl w-fit">
            <div className = "flex items-center p-2">
                <div className="font-serif flex items-center gap-2 px-3 py-2 rounded-xl  bg-pink-100"> <HeartHandshake  size={24} strokeWidth={1.2}  /> To Help </div>{' '}
            </div>
              <div className = "w-px self-stretch bg-gray-200" />
           <div className = "p-2 px-4">
               <p className="font-normal ">{tohelp || ''}</p>
           </div>
          </div>
          <button 
            onClick={() => toggleLock('tohelp')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            title={lockedFields.tohelp ? "Click to unlock" : "Click to lock"}
          >
            {lockedFields.tohelp ? <Lock size={20} strokeWidth={1.5} /> : <Unlock size={20} strokeWidth={1.5} />}
          </button>
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
      <div className = "flex gap-2 h-fit ">
        {/* <button className = " bg-gray-100 items-center hover:bg-gray-200 transition-all duration-300  rounded-xl gap-2 flex flex-nowrap px-4 py-3 text-nowrap justify-center"> 
          <Mic size={16} strokeWidth={1.6} /> Microphone Settings
        </button> */}
          <button
          onClick={startInterview}
          className="bg-[#262626] flex-1 px-4 py-4 flex items-center justify-center gap-2 cursor-pointer rounded-xl  text-xl font-serif  w-full hover:bg-black  text-white transition-colors"
        >
{/* <svg width="100%" height="auto" viewBox="0 0 120 13" fill="none" xmlns="http://www.w3.org/2000/svg" className = "opacity-80">
<path d="M2.70933 12.404C2.41067 12.404 2.09067 12.372 1.74933 12.308C1.41867 12.244 1.104 12.1587 0.805333 12.052C0.517333 11.9347 0.288 11.8013 0.117333 11.652C0.064 11.5987 0.0266667 11.5453 0.00533333 11.492C-0.00533333 11.4387 0 11.3587 0.0213333 11.252L0.469333 8.74C0.501333 8.548 0.586667 8.452 0.725333 8.452C0.853333 8.452 0.917333 8.55867 0.917333 8.772L0.933333 9.396C0.954667 10.292 1.10933 10.9373 1.39733 11.332C1.68533 11.7267 2.15467 11.924 2.80533 11.924C3.40267 11.924 3.89867 11.7107 4.29333 11.284C4.688 10.8467 4.88533 10.2653 4.88533 9.54C4.88533 9.07067 4.75733 8.58 4.50133 8.068C4.24533 7.556 3.888 7.044 3.42933 6.532C2.88533 5.924 2.48 5.36933 2.21333 4.868C1.95733 4.36667 1.82933 3.83867 1.82933 3.284C1.82933 2.84667 1.936 2.42533 2.14933 2.02C2.36267 1.604 2.68267 1.26267 3.10933 0.995999C3.54667 0.718666 4.10133 0.58 4.77333 0.58C5.70133 0.58 6.41067 0.788 6.90133 1.204C7.05067 1.32133 7.104 1.49733 7.06133 1.732L6.61333 4.068C6.58133 4.228 6.50667 4.308 6.38933 4.308C6.272 4.308 6.20267 4.21733 6.18133 4.036L6.16533 3.7C6.12267 2.836 6 2.18 5.79733 1.732C5.60533 1.27333 5.216 1.044 4.62933 1.044C4.20267 1.044 3.86133 1.14 3.60533 1.332C3.34933 1.524 3.16267 1.764 3.04533 2.052C2.928 2.32933 2.86933 2.60667 2.86933 2.884C2.86933 3.19333 2.912 3.492 2.99733 3.78C3.08267 4.05733 3.22667 4.356 3.42933 4.676C3.64267 4.98533 3.93067 5.364 4.29333 5.812C4.80533 6.42 5.20533 7.00133 5.49333 7.556C5.78133 8.11067 5.92533 8.64933 5.92533 9.172C5.92533 9.80133 5.78133 10.3613 5.49333 10.852C5.216 11.332 4.83733 11.7107 4.35733 11.988C3.87733 12.2653 3.328 12.404 2.70933 12.404Z" fill="white"/>
<path d="M7.63758 12.26C7.48825 12.26 7.41358 12.2067 7.41358 12.1C7.41358 11.9933 7.49892 11.924 7.66958 11.892L8.34158 11.78C8.55492 11.748 8.71492 11.6947 8.82158 11.62C8.92825 11.5347 9.00292 11.38 9.04558 11.156L11.2696 1.556C11.3016 1.40667 11.2856 1.3 11.2216 1.236C11.1683 1.172 11.0403 1.14 10.8376 1.14C10.4749 1.14 10.0749 1.28933 9.63758 1.588C9.21092 1.876 8.82692 2.42 8.48558 3.22L8.22958 3.828C8.17625 3.96667 8.08558 4.036 7.95758 4.036C7.80825 4.036 7.76025 3.94533 7.81358 3.764L8.61358 0.868C8.67758 0.622667 8.79492 0.5 8.96558 0.5C9.06158 0.5 9.13625 0.521333 9.18958 0.564C9.25358 0.596 9.35492 0.633333 9.49358 0.676C9.63225 0.718666 9.87225 0.74 10.2136 0.74H13.7816C14.1229 0.74 14.3736 0.718666 14.5336 0.676C14.7043 0.633333 14.8269 0.596 14.9016 0.564C14.9869 0.521333 15.0616 0.5 15.1256 0.5C15.3069 0.5 15.3709 0.622667 15.3176 0.868L14.8056 3.764C14.7736 3.94533 14.6829 4.036 14.5336 4.036C14.3949 4.036 14.3363 3.96667 14.3576 3.828L14.3896 3.428C14.4536 2.63867 14.3523 2.06267 14.0856 1.7C13.8189 1.32667 13.4456 1.14 12.9656 1.14C12.7629 1.14 12.6189 1.172 12.5336 1.236C12.4589 1.3 12.4056 1.40667 12.3736 1.556L10.1496 11.156C10.0963 11.38 10.1016 11.5347 10.1656 11.62C10.2403 11.6947 10.3789 11.748 10.5816 11.78L11.3336 11.892C11.4509 11.9027 11.5096 11.9613 11.5096 12.068C11.5096 12.196 11.4243 12.26 11.2536 12.26H7.63758Z" fill="white"/>
<path d="M12.3087 12.26C12.1807 12.26 12.1167 12.2067 12.1167 12.1C12.1167 12.004 12.202 11.9347 12.3727 11.892L12.6287 11.844C12.842 11.8013 13.0287 11.7 13.1887 11.54C13.338 11.3693 13.482 11.1347 13.6207 10.836L18.4047 0.835999C18.458 0.729333 18.5114 0.66 18.5647 0.627999C18.618 0.596 18.666 0.58 18.7087 0.58C18.762 0.58 18.8047 0.596 18.8367 0.627999C18.8794 0.66 18.9007 0.729333 18.9007 0.835999L19.0767 10.98C19.0874 11.2787 19.1247 11.4867 19.1887 11.604C19.2527 11.7107 19.386 11.7907 19.5887 11.844L19.7967 11.892C19.9247 11.924 19.9887 11.988 19.9887 12.084C19.9887 12.2013 19.898 12.26 19.7167 12.26H17.0767C16.938 12.26 16.8687 12.2067 16.8687 12.1C16.8687 11.9827 16.9754 11.9133 17.1887 11.892L17.5087 11.86C17.69 11.8387 17.8127 11.78 17.8767 11.684C17.9514 11.588 17.9887 11.4227 17.9887 11.188L17.9567 8.708C17.9567 8.43067 17.8127 8.292 17.5247 8.292H15.8127C15.5354 8.292 15.3274 8.43067 15.1887 8.708L14.1487 10.852C13.8607 11.46 13.9567 11.796 14.4367 11.86L14.6607 11.892C14.8207 11.9133 14.9007 11.9773 14.9007 12.084C14.9007 12.2013 14.81 12.26 14.6287 12.26H12.3087ZM15.8767 7.812H17.6687C17.85 7.812 17.9407 7.72133 17.9407 7.54L17.9087 3.172H17.8287L15.7327 7.54C15.69 7.61467 15.6847 7.67867 15.7167 7.732C15.7487 7.78533 15.802 7.812 15.8767 7.812Z" fill="white"/>
<path d="M26.7952 12.404C26.3472 12.404 25.9792 12.244 25.6912 11.924C25.4139 11.604 25.2805 11.156 25.2912 10.58L25.3072 8.804C25.3179 8.228 25.2859 7.79067 25.2112 7.492C25.1365 7.19333 24.9979 6.99067 24.7952 6.884C24.5925 6.77733 24.2939 6.724 23.8992 6.724C23.6645 6.724 23.4885 6.76667 23.3712 6.852C23.2645 6.93733 23.1899 7.07067 23.1472 7.252L22.2192 11.14C22.1659 11.364 22.1712 11.5187 22.2352 11.604C22.2992 11.6893 22.4645 11.7533 22.7312 11.796L23.4352 11.892C23.5845 11.9027 23.6592 11.9613 23.6592 12.068C23.6592 12.196 23.5739 12.26 23.4032 12.26H20.0112C19.8619 12.26 19.7872 12.2067 19.7872 12.1C19.7872 11.9827 19.8939 11.908 20.1072 11.876L20.4272 11.828C20.6619 11.796 20.8219 11.7427 20.9072 11.668C21.0032 11.5827 21.0725 11.428 21.1152 11.204L23.2912 1.796C23.3445 1.572 23.3445 1.42267 23.2912 1.348C23.2379 1.27333 23.1045 1.21467 22.8912 1.172L22.5712 1.108C22.4325 1.076 22.3632 1.01733 22.3632 0.932C22.3632 0.804 22.4592 0.74 22.6512 0.74H25.8992C26.5285 0.74 27.0512 0.852 27.4672 1.076C27.8832 1.3 28.1925 1.59867 28.3952 1.972C28.6085 2.34533 28.7152 2.756 28.7152 3.204C28.7152 3.76933 28.5712 4.28133 28.2832 4.74C27.9952 5.19867 27.6165 5.588 27.1472 5.908C26.6885 6.21733 26.1925 6.44667 25.6592 6.596C25.5952 6.60667 25.5579 6.63867 25.5472 6.692C25.5472 6.73467 25.5792 6.772 25.6432 6.804C25.9419 6.964 26.1445 7.188 26.2512 7.476C26.3579 7.764 26.4112 8.148 26.4112 8.628V10.26C26.4112 10.8467 26.4752 11.252 26.6032 11.476C26.7312 11.6893 26.9072 11.796 27.1312 11.796C27.2165 11.796 27.2912 11.7853 27.3552 11.764C27.4192 11.732 27.5045 11.6787 27.6112 11.604C27.6965 11.5293 27.7712 11.508 27.8352 11.54C27.9099 11.572 27.9472 11.6307 27.9472 11.716C27.9472 11.8653 27.8352 12.02 27.6112 12.18C27.3872 12.3293 27.1152 12.404 26.7952 12.404ZM24.4592 6.324C24.9925 6.324 25.4939 6.18 25.9632 5.892C26.4325 5.604 26.8112 5.21467 27.0992 4.724C27.3979 4.23333 27.5472 3.684 27.5472 3.076C27.5472 2.47867 27.3979 2.00933 27.0992 1.668C26.8112 1.316 26.3045 1.14 25.5792 1.14C24.8965 1.14 24.5019 1.35333 24.3952 1.78L23.5472 5.444C23.4085 6.03067 23.7125 6.324 24.4592 6.324Z" fill="white"/>
<path d="M29.497 12.26C29.3476 12.26 29.273 12.2067 29.273 12.1C29.273 11.9933 29.3583 11.924 29.529 11.892L30.201 11.78C30.4143 11.748 30.5743 11.6947 30.681 11.62C30.7876 11.5347 30.8623 11.38 30.905 11.156L33.129 1.556C33.161 1.40667 33.145 1.3 33.081 1.236C33.0276 1.172 32.8996 1.14 32.697 1.14C32.3343 1.14 31.9343 1.28933 31.497 1.588C31.0703 1.876 30.6863 2.42 30.345 3.22L30.089 3.828C30.0356 3.96667 29.945 4.036 29.817 4.036C29.6676 4.036 29.6196 3.94533 29.673 3.764L30.473 0.868C30.537 0.622667 30.6543 0.5 30.825 0.5C30.921 0.5 30.9956 0.521333 31.049 0.564C31.113 0.596 31.2143 0.633333 31.353 0.676C31.4916 0.718666 31.7316 0.74 32.073 0.74H35.641C35.9823 0.74 36.233 0.718666 36.393 0.676C36.5636 0.633333 36.6863 0.596 36.761 0.564C36.8463 0.521333 36.921 0.5 36.985 0.5C37.1663 0.5 37.2303 0.622667 37.177 0.868L36.665 3.764C36.633 3.94533 36.5423 4.036 36.393 4.036C36.2543 4.036 36.1956 3.96667 36.217 3.828L36.249 3.428C36.313 2.63867 36.2116 2.06267 35.945 1.7C35.6783 1.32667 35.305 1.14 34.825 1.14C34.6223 1.14 34.4783 1.172 34.393 1.236C34.3183 1.3 34.265 1.40667 34.233 1.556L32.009 11.156C31.9556 11.38 31.961 11.5347 32.025 11.62C32.0996 11.6947 32.2383 11.748 32.441 11.78L33.193 11.892C33.3103 11.9027 33.369 11.9613 33.369 12.068C33.369 12.196 33.2836 12.26 33.113 12.26H29.497Z" fill="white"/>
<path d="M39.0947 12.26C38.9347 12.26 38.8547 12.2013 38.8547 12.084C38.8547 11.988 38.924 11.924 39.0627 11.892L39.4307 11.828C39.6547 11.7853 39.7987 11.7267 39.8627 11.652C39.9374 11.5773 39.9747 11.428 39.9747 11.204V1.796C39.9747 1.572 39.9374 1.42267 39.8627 1.348C39.7987 1.27333 39.6547 1.21467 39.4307 1.172L39.0627 1.108C38.924 1.076 38.8547 1.012 38.8547 0.915999C38.8547 0.798666 38.9347 0.74 39.0947 0.74H41.9907C42.1507 0.74 42.2307 0.798666 42.2307 0.915999C42.2307 1.012 42.1614 1.076 42.0227 1.108L41.6547 1.172C41.4307 1.21467 41.2814 1.27333 41.2067 1.348C41.1427 1.42267 41.1107 1.572 41.1107 1.796V11.204C41.1107 11.428 41.1427 11.5773 41.2067 11.652C41.2814 11.7267 41.4307 11.7853 41.6547 11.828L42.0227 11.892C42.1614 11.924 42.2307 11.988 42.2307 12.084C42.2307 12.2013 42.1507 12.26 41.9907 12.26H39.0947Z" fill="white"/>
<path d="M49.3991 12.404C49.2284 12.404 49.0844 12.276 48.9671 12.02L44.6311 2.612C44.5991 2.53733 44.5564 2.50533 44.5031 2.516C44.4604 2.52667 44.4391 2.57467 44.4391 2.66V10.884C44.4391 11.1827 44.4871 11.412 44.5831 11.572C44.6898 11.7213 44.8764 11.8173 45.1431 11.86L45.3511 11.892C45.4897 11.9027 45.5591 11.9667 45.5591 12.084C45.5591 12.2013 45.4791 12.26 45.3191 12.26H43.0311C42.8711 12.26 42.7911 12.2013 42.7911 12.084C42.7911 11.9667 42.8604 11.9027 42.9991 11.892L43.2071 11.86C43.4844 11.8173 43.6764 11.7213 43.7831 11.572C43.8898 11.412 43.9431 11.1827 43.9431 10.884V1.796C43.9431 1.572 43.9058 1.42267 43.8311 1.348C43.7671 1.27333 43.6124 1.21467 43.3671 1.172L42.9991 1.108C42.8604 1.076 42.7911 1.012 42.7911 0.915999C42.7911 0.798666 42.8711 0.74 43.0311 0.74H44.7431C45.0098 0.74 45.1964 0.857333 45.3031 1.092L49.0791 9.396C49.1111 9.46 49.1484 9.48667 49.1911 9.476C49.2444 9.46533 49.2711 9.428 49.2711 9.364V2.116C49.2711 1.77467 49.2124 1.54 49.0951 1.412C48.9778 1.27333 48.8284 1.188 48.6471 1.156L48.3591 1.108C48.2204 1.076 48.1511 1.012 48.1511 0.915999C48.1511 0.798666 48.2311 0.74 48.3911 0.74H50.6791C50.8391 0.74 50.9191 0.798666 50.9191 0.915999C50.9191 1.03333 50.8497 1.09733 50.7111 1.108L50.5031 1.14C50.2257 1.18267 50.0337 1.27333 49.9271 1.412C49.8204 1.54 49.7671 1.77467 49.7671 2.116V11.892C49.7671 12.084 49.7297 12.2173 49.6551 12.292C49.5911 12.3667 49.5057 12.404 49.3991 12.404Z" fill="white"/>
<path d="M53.0637 12.26C52.9037 12.26 52.8237 12.2013 52.8237 12.084C52.8237 11.9667 52.893 11.9027 53.0317 11.892L53.7517 11.78C53.965 11.748 54.109 11.6947 54.1837 11.62C54.2584 11.5347 54.2957 11.38 54.2957 11.156V1.556C54.2957 1.40667 54.2637 1.3 54.1997 1.236C54.1357 1.172 54.0024 1.14 53.7997 1.14C53.405 1.14 53.0157 1.31067 52.6317 1.652C52.2477 1.99333 51.997 2.54267 51.8797 3.3L51.7997 3.828C51.7784 3.96667 51.7037 4.036 51.5757 4.036C51.4157 4.036 51.3464 3.94533 51.3677 3.764L51.5117 0.868C51.533 0.622667 51.629 0.5 51.7997 0.5C51.8744 0.5 51.9437 0.521333 52.0077 0.564C52.0717 0.596 52.1784 0.633333 52.3277 0.676C52.4877 0.718666 52.7384 0.74 53.0797 0.74H56.6477C56.989 0.74 57.2344 0.718666 57.3837 0.676C57.5437 0.633333 57.6557 0.596 57.7197 0.564C57.7944 0.521333 57.8637 0.5 57.9277 0.5C58.0984 0.5 58.1944 0.622667 58.2157 0.868L58.3597 3.764C58.381 3.94533 58.3117 4.036 58.1517 4.036C58.0237 4.036 57.949 3.96667 57.9277 3.828L57.8477 3.3C57.741 2.54267 57.4957 1.99333 57.1117 1.652C56.7277 1.31067 56.333 1.14 55.9277 1.14C55.725 1.14 55.5917 1.172 55.5277 1.236C55.4637 1.3 55.4317 1.40667 55.4317 1.556V11.156C55.4317 11.38 55.469 11.5347 55.5437 11.62C55.629 11.6947 55.773 11.748 55.9757 11.78L56.6957 11.892C56.8344 11.9027 56.9037 11.9667 56.9037 12.084C56.9037 12.2013 56.8237 12.26 56.6637 12.26H53.0637Z" fill="white"/>
<path d="M59.0947 12.26C58.9347 12.26 58.8547 12.2013 58.8547 12.084C58.8547 11.988 58.924 11.924 59.0627 11.892L59.4307 11.828C59.6547 11.7853 59.7987 11.7267 59.8627 11.652C59.9374 11.5773 59.9747 11.428 59.9747 11.204V1.796C59.9747 1.572 59.9374 1.42267 59.8627 1.348C59.7987 1.27333 59.6547 1.21467 59.4307 1.172L59.0627 1.108C58.924 1.076 58.8547 1.012 58.8547 0.915999C58.8547 0.798666 58.9347 0.74 59.0947 0.74H64.4707C64.716 0.74 64.8494 0.862666 64.8707 1.108L64.9987 3.764C65.02 3.94533 64.9507 4.036 64.7907 4.036C64.6627 4.036 64.588 3.96667 64.5667 3.828L64.4707 3.236C64.3534 2.51067 64.1134 1.98267 63.7507 1.652C63.388 1.31067 62.8867 1.14 62.2467 1.14C61.82 1.14 61.5214 1.204 61.3507 1.332C61.1907 1.44933 61.1107 1.66267 61.1107 1.972V5.828C61.1107 5.97733 61.1854 6.052 61.3347 6.052H62.1347C62.604 6.052 62.892 5.80133 62.9987 5.3L63.1587 4.5C63.2014 4.34 63.292 4.27067 63.4307 4.292C63.548 4.31333 63.6067 4.404 63.6067 4.564V8.164C63.6067 8.324 63.548 8.41467 63.4307 8.436C63.292 8.45733 63.2014 8.388 63.1587 8.228L62.9987 7.444C62.924 7.07067 62.8174 6.82533 62.6787 6.708C62.5507 6.59067 62.364 6.532 62.1187 6.532H61.3347C61.1854 6.532 61.1107 6.60667 61.1107 6.756V10.772C61.1107 11.156 61.2067 11.4333 61.3987 11.604C61.6014 11.7747 61.964 11.86 62.4867 11.86C63.02 11.86 63.4734 11.7267 63.8467 11.46C64.2307 11.1827 64.4974 10.6707 64.6467 9.924L64.8387 8.98C64.8707 8.84133 64.9507 8.772 65.0787 8.772C65.228 8.772 65.292 8.86267 65.2707 9.044L65.1107 11.892C65.0894 12.1373 64.956 12.26 64.7107 12.26H59.0947Z" fill="white"/>
<path d="M73.0007 12.404C72.0727 12.404 71.4807 11.796 71.2247 10.58L70.8567 8.804C70.7394 8.228 70.606 7.79067 70.4567 7.492C70.318 7.19333 70.1207 6.99067 69.8647 6.884C69.6194 6.77733 69.278 6.724 68.8407 6.724C68.6914 6.724 68.574 6.76667 68.4887 6.852C68.4034 6.92667 68.3607 7.02267 68.3607 7.14V11.14C68.3607 11.364 68.4034 11.5187 68.4887 11.604C68.574 11.6787 68.766 11.7427 69.0647 11.796L69.6567 11.892C69.774 11.9133 69.8327 11.972 69.8327 12.068C69.8327 12.196 69.7527 12.26 69.5927 12.26H66.3447C66.1847 12.26 66.1047 12.2013 66.1047 12.084C66.1047 11.988 66.174 11.924 66.3127 11.892L66.6807 11.828C66.9047 11.7853 67.0487 11.7267 67.1127 11.652C67.1874 11.5773 67.2247 11.428 67.2247 11.204V1.796C67.2247 1.572 67.1874 1.42267 67.1127 1.348C67.0487 1.27333 66.9047 1.21467 66.6807 1.172L66.3127 1.108C66.174 1.076 66.1047 1.012 66.1047 0.915999C66.1047 0.798666 66.1847 0.74 66.3447 0.74H69.5927C70.222 0.74 70.782 0.862666 71.2727 1.108C71.7634 1.35333 72.1474 1.69467 72.4247 2.132C72.702 2.55867 72.8407 3.05467 72.8407 3.62C72.8407 4.292 72.638 4.9 72.2327 5.444C71.8274 5.97733 71.3154 6.356 70.6967 6.58C70.622 6.60133 70.5794 6.63867 70.5687 6.692C70.5687 6.73467 70.606 6.772 70.6807 6.804C71.022 6.964 71.2887 7.188 71.4807 7.476C71.6834 7.764 71.838 8.148 71.9447 8.628L72.2967 10.26C72.414 10.8147 72.5527 11.2093 72.7127 11.444C72.8727 11.6787 73.0754 11.796 73.3207 11.796C73.406 11.796 73.4807 11.7853 73.5447 11.764C73.6194 11.732 73.71 11.6787 73.8167 11.604C73.902 11.5507 73.982 11.54 74.0567 11.572C74.1314 11.5933 74.1687 11.6467 74.1687 11.732C74.1687 11.9133 74.0514 12.0733 73.8167 12.212C73.582 12.34 73.31 12.404 73.0007 12.404ZM69.4327 6.324C70.158 6.324 70.7074 6.084 71.0807 5.604C71.454 5.11333 71.6407 4.46267 71.6407 3.652C71.6407 2.86267 71.422 2.24933 70.9847 1.812C70.558 1.364 69.966 1.14 69.2087 1.14C68.6434 1.14 68.3607 1.35333 68.3607 1.78V5.444C68.3607 6.03067 68.718 6.324 69.4327 6.324Z" fill="white"/>
<path d="M77.3553 12.42C77.3127 12.42 77.2647 12.404 77.2113 12.372C77.158 12.34 77.1207 12.2707 77.0993 12.164L74.5713 2.02C74.4967 1.72133 74.4113 1.51333 74.3153 1.396C74.23 1.27867 74.0807 1.19867 73.8673 1.156L73.6273 1.108C73.478 1.076 73.4033 1.00667 73.4033 0.9C73.4033 0.793333 73.4833 0.74 73.6433 0.74H76.3793C76.5287 0.74 76.6033 0.798666 76.6033 0.915999C76.6033 1.03333 76.5127 1.09733 76.3313 1.108L76.0273 1.14C75.846 1.15067 75.7287 1.20933 75.6753 1.316C75.6327 1.412 75.638 1.57733 75.6913 1.812L77.5473 9.508C77.5687 9.572 77.6007 9.604 77.6433 9.604C77.6967 9.604 77.7287 9.572 77.7393 9.508L79.5793 2.148C79.7287 1.54 79.5687 1.204 79.0993 1.14L78.8593 1.108C78.678 1.076 78.5873 1.012 78.5873 0.915999C78.5873 0.798666 78.662 0.74 78.8113 0.74H81.0513C81.2113 0.74 81.2913 0.793333 81.2913 0.9C81.2913 1.00667 81.2167 1.076 81.0673 1.108L80.8273 1.156C80.6247 1.19867 80.4647 1.30533 80.3473 1.476C80.2407 1.636 80.15 1.86533 80.0753 2.164L77.5953 12.164C77.574 12.2707 77.5367 12.34 77.4833 12.372C77.4407 12.404 77.398 12.42 77.3553 12.42Z" fill="white"/>
<path d="M81.2978 12.26C81.1378 12.26 81.0578 12.2013 81.0578 12.084C81.0578 11.988 81.1272 11.924 81.2658 11.892L81.6338 11.828C81.8578 11.7853 82.0018 11.7267 82.0658 11.652C82.1405 11.5773 82.1778 11.428 82.1778 11.204V1.796C82.1778 1.572 82.1405 1.42267 82.0658 1.348C82.0018 1.27333 81.8578 1.21467 81.6338 1.172L81.2658 1.108C81.1272 1.076 81.0578 1.012 81.0578 0.915999C81.0578 0.798666 81.1378 0.74 81.2978 0.74H84.1938C84.3538 0.74 84.4338 0.798666 84.4338 0.915999C84.4338 1.012 84.3645 1.076 84.2258 1.108L83.8578 1.172C83.6338 1.21467 83.4845 1.27333 83.4098 1.348C83.3458 1.42267 83.3138 1.572 83.3138 1.796V11.204C83.3138 11.428 83.3458 11.5773 83.4098 11.652C83.4845 11.7267 83.6338 11.7853 83.8578 11.828L84.2258 11.892C84.3645 11.924 84.4338 11.988 84.4338 12.084C84.4338 12.2013 84.3538 12.26 84.1938 12.26H81.2978Z" fill="white"/>
<path d="M85.2822 12.26C85.1222 12.26 85.0422 12.2013 85.0422 12.084C85.0422 11.988 85.1115 11.924 85.2502 11.892L85.6182 11.828C85.8422 11.7853 85.9862 11.7267 86.0502 11.652C86.1249 11.5773 86.1622 11.428 86.1622 11.204V1.796C86.1622 1.572 86.1249 1.42267 86.0502 1.348C85.9862 1.27333 85.8422 1.21467 85.6182 1.172L85.2502 1.108C85.1115 1.076 85.0422 1.012 85.0422 0.915999C85.0422 0.798666 85.1222 0.74 85.2822 0.74H90.6582C90.9035 0.74 91.0369 0.862666 91.0582 1.108L91.1862 3.764C91.2075 3.94533 91.1382 4.036 90.9782 4.036C90.8502 4.036 90.7755 3.96667 90.7542 3.828L90.6582 3.236C90.5409 2.51067 90.3009 1.98267 89.9382 1.652C89.5755 1.31067 89.0742 1.14 88.4342 1.14C88.0075 1.14 87.7089 1.204 87.5382 1.332C87.3782 1.44933 87.2982 1.66267 87.2982 1.972V5.828C87.2982 5.97733 87.3729 6.052 87.5222 6.052H88.3222C88.7915 6.052 89.0795 5.80133 89.1862 5.3L89.3462 4.5C89.3889 4.34 89.4795 4.27067 89.6182 4.292C89.7355 4.31333 89.7942 4.404 89.7942 4.564V8.164C89.7942 8.324 89.7355 8.41467 89.6182 8.436C89.4795 8.45733 89.3889 8.388 89.3462 8.228L89.1862 7.444C89.1115 7.07067 89.0049 6.82533 88.8662 6.708C88.7382 6.59067 88.5515 6.532 88.3062 6.532H87.5222C87.3729 6.532 87.2982 6.60667 87.2982 6.756V10.772C87.2982 11.156 87.3942 11.4333 87.5862 11.604C87.7889 11.7747 88.1515 11.86 88.6742 11.86C89.2075 11.86 89.6609 11.7267 90.0342 11.46C90.4182 11.1827 90.6849 10.6707 90.8342 9.924L91.0262 8.98C91.0582 8.84133 91.1382 8.772 91.2662 8.772C91.4155 8.772 91.4795 8.86267 91.4582 9.044L91.2982 11.892C91.2769 12.1373 91.1435 12.26 90.8982 12.26H85.2822Z" fill="white"/>
<path d="M98.8065 12.42C98.7638 12.42 98.7211 12.404 98.6785 12.372C98.6358 12.34 98.6038 12.2707 98.5825 12.164L97.3505 7.204C97.3398 7.11867 97.3078 7.08133 97.2545 7.092C97.2011 7.092 97.1638 7.12933 97.1425 7.204L95.7665 12.164C95.7345 12.2707 95.6971 12.34 95.6545 12.372C95.6225 12.404 95.5851 12.42 95.5425 12.42C95.4998 12.42 95.4518 12.404 95.3985 12.372C95.3558 12.34 95.3238 12.2707 95.3025 12.164L92.7745 2.02C92.6998 1.72133 92.6145 1.51333 92.5185 1.396C92.4331 1.27867 92.2838 1.19867 92.0705 1.156L91.8305 1.108C91.6811 1.076 91.6065 1.00667 91.6065 0.9C91.6065 0.793333 91.6865 0.74 91.8465 0.74H94.4225C94.5718 0.74 94.6465 0.798666 94.6465 0.915999C94.6465 1.012 94.5665 1.076 94.4065 1.108L94.2305 1.14C94.0491 1.172 93.9318 1.236 93.8785 1.332C93.8358 1.41733 93.8411 1.57733 93.8945 1.812L95.7825 9.62C95.8038 9.69467 95.8358 9.732 95.8785 9.732C95.9318 9.732 95.9691 9.69467 95.9905 9.62L96.7105 7.012C96.8278 6.60667 96.8865 6.23333 96.8865 5.892C96.8865 5.55067 96.8331 5.172 96.7265 4.756L96.0545 2.02C95.9798 1.72133 95.9051 1.508 95.8305 1.38C95.7665 1.252 95.6758 1.17733 95.5585 1.156L95.3185 1.108C95.1691 1.076 95.0945 1.00667 95.0945 0.9C95.0945 0.793333 95.1745 0.74 95.3345 0.74H97.5265C97.6758 0.74 97.7505 0.798666 97.7505 0.915999C97.7505 1.012 97.6705 1.076 97.5105 1.108L97.3345 1.14C97.1958 1.16133 97.1105 1.22 97.0785 1.316C97.0571 1.412 97.0731 1.57733 97.1265 1.812L97.6705 4.1C97.6918 4.17467 97.7238 4.212 97.7665 4.212C97.8198 4.212 97.8571 4.17467 97.8785 4.1L98.4545 2.148C98.5718 1.74267 98.6145 1.476 98.5825 1.348C98.5611 1.22 98.5025 1.15067 98.4065 1.14L98.2305 1.108C98.0705 1.076 97.9905 1.012 97.9905 0.915999C97.9905 0.798666 98.0651 0.74 98.2145 0.74H99.7345C99.9158 0.74 100.006 0.798666 100.006 0.915999C100.006 1.02267 99.9158 1.08667 99.7345 1.108L99.5585 1.124C99.4198 1.13467 99.3025 1.22 99.2065 1.38C99.1211 1.54 99.0251 1.80133 98.9185 2.164L98.3105 4.26C98.1931 4.65467 98.1291 5.028 98.1185 5.38C98.1185 5.72133 98.1665 6.1 98.2625 6.516L98.9825 9.524C99.0038 9.59867 99.0358 9.636 99.0785 9.636C99.1318 9.636 99.1638 9.59867 99.1745 9.524L101.014 2.148C101.164 1.52933 101.068 1.19333 100.726 1.14L100.55 1.108C100.39 1.076 100.31 1.00667 100.31 0.9C100.31 0.793333 100.385 0.74 100.534 0.74H102.326C102.508 0.74 102.598 0.798666 102.598 0.915999C102.598 1.02267 102.508 1.08667 102.326 1.108L102.15 1.124C102.012 1.13467 101.889 1.22 101.782 1.38C101.686 1.52933 101.596 1.79067 101.51 2.164L99.0305 12.164C99.0091 12.2707 98.9771 12.34 98.9345 12.372C98.8918 12.404 98.8491 12.42 98.8065 12.42Z" fill="white"/>
<path d="M117.892 5.51921V1.7548C117.892 1.42201 117.759 1.10284 117.524 0.867523C117.289 0.632202 116.97 0.5 116.637 0.5H107.853C107.52 0.5 107.201 0.632202 106.966 0.867523C106.731 1.10284 106.598 1.42201 106.598 1.7548V10.5384C106.598 10.8712 106.731 11.1904 106.966 11.4257C107.201 11.661 107.52 11.7932 107.853 11.7932H111.618M112.266 6.57387C112.244 6.51712 112.238 6.455 112.251 6.39517C112.263 6.33534 112.292 6.28043 112.336 6.23724C112.379 6.19405 112.434 6.16447 112.494 6.15215C112.553 6.13983 112.616 6.14532 112.672 6.16794L118.319 8.36384C118.379 8.38749 118.431 8.42937 118.467 8.48368C118.503 8.53798 118.521 8.60204 118.518 8.667C118.516 8.73195 118.494 8.7946 118.454 8.84628C118.415 8.89795 118.36 8.93611 118.298 8.95548L116.137 9.62554C116.04 9.65568 115.951 9.70915 115.879 9.78131C115.807 9.85347 115.754 9.94213 115.723 10.0396L115.054 12.1998C115.035 12.2618 114.996 12.3163 114.945 12.3557C114.893 12.3951 114.83 12.4175 114.765 12.4198C114.7 12.4221 114.636 12.4041 114.582 12.3684C114.528 12.3327 114.486 12.281 114.462 12.2205L112.266 6.57387Z" stroke="white" stroke-linecap="round"/>
</svg> */}





            Start Interview
          <ArrowUpRight
            size={20}
            strokeWidth={1.5}

          />
          </button>

        
        </div>
        </div>
        <div className = "h-px w-full bg-gray-200" />
         <div className = "border-l border-r border-gray-200 w-3xl text-gray-400 flex justify-between items-start p-5 relative flex-1 overflow-hidden ">
          <p>0 of 3 Interviews Used Today</p>
          <p>Want Unlimited Interviews? <span className = "underline underline-offset-5">Upgrade to Pro</span></p>
         </div>
      </div>
      </div>
    </div>
  );
}
