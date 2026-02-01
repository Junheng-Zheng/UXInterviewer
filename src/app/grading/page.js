'use client';

import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import useStore from '../../store/module';
import { Keyboard, AudioLines, Sparkles } from 'lucide-react';
export default function GradingPage() {
  const router = useRouter();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  
  // Get evaluation data from zustand store
  const evaluation = useStore((state) => state.evaluation);
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const time = useStore((state) => state.time);
  const screenshot = useStore((state) => state.screenshot);
  
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Progress bar simulation
  useEffect(() => {
    if (!evaluation || (evaluation.overall_score === undefined && evaluation.technical_overall_score === undefined)) {
      // Simulate progress with breaks
      const progressSteps = [
        { value: 15, delay: 500 },   // Fast start
        { value: 30, delay: 1500 },  // Analyzing design
        { value: 45, delay: 3000 },  // Technical review
        { value: 60, delay: 5000 },  // Deep analysis
        { value: 75, delay: 8000 },  // Communication check
        { value: 85, delay: 12000 }, // Final review
        { value: 95, delay: 15000 }, // Almost done
      ];

      const timers = progressSteps.map(step => 
        setTimeout(() => setProgress(step.value), step.delay)
      );

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [evaluation]);

  useEffect(() => {
    console.log('Grading page - evaluation:', evaluation);
    
    // Check if evaluation data exists - API returns diagram_overall_score, technical_overall_score, transcript_overall_score
    if (evaluation && (evaluation.overall_score !== undefined || evaluation.technical_overall_score !== undefined)) {
      // Set progress to 100% when complete
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(100);
      
      // Use overall_score if available, otherwise calculate sum from new rubric
      const avgScore = evaluation.overall_score || (
        (evaluation.thinking_score || evaluation.diagram_overall_score || 0) + 
        (evaluation.solution_score || evaluation.technical_overall_score || 0) + 
        (evaluation.communication_score || evaluation.transcript_overall_score || 0)
      );
      
      console.log('Scores:', {
        thinking: evaluation.thinking_score || evaluation.diagram_overall_score,
        solution: evaluation.solution_score || evaluation.technical_overall_score,
        communication: evaluation.communication_score || evaluation.transcript_overall_score,
        overall: evaluation.overall_score,
        calculated: avgScore
      });
      
      // Wait a moment to show 100% before revealing results
      setTimeout(() => {
        const controls = animate(count, avgScore, {
          duration: 2,
          delay: 0.5,
          ease: 'easeOut',
        });
        
        setIsLoading(false);
        return controls.stop;
      }, 800);
    } else {
      // If no evaluation data, show loading or redirect
      const timer = setTimeout(() => {
        if (!evaluation) {
          console.log('No evaluation data found after timeout');
          alert('No evaluation data found. Please complete an interview first.');
          router.push('/Refactor');
        }
      }, 60000); // 60 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [evaluation]);

  const handleViewSubmission = () => {
    router.push('/refactor/whiteboard');
  };

  const handleReloadChallenge = () => {
    router.push('/Refactor');
  };
  
  // Show loading state with progress bar
  if (isLoading || !evaluation || (evaluation.overall_score === undefined && evaluation.technical_overall_score === undefined)) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-100">
        <div className="w-full max-w-md mx-4">
          {/* Progress Box */}
          <div className="bg-white border border-[#e4e4e4] rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <p className="text-2xl text-black font-serif mb-2">Grading Interview</p>
              <p className="text-base text-gray-600 font-light">Our AI is analyzing your design</p>
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative w-full h-3 bg-[#f1f1f1] rounded-full overflow-hidden mb-3">
              {/* Progress Bar Fill */}
              <div 
                className="absolute left-0 top-0 h-full bg-[#3168f5] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress Percentage */}
            <div className="text-center">
              <p className="text-lg text-black font-light">{progress}%</p>
            </div>
          </div>
          
          {/* Status Messages */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 font-light">
              {progress < 30 && "Analyzing thinking & problem-solving..."}
              {progress >= 30 && progress < 60 && "Evaluating solution logic & structure..."}
              {progress >= 60 && progress < 85 && "Reviewing communication & annotations..."}
              {progress >= 85 && progress < 100 && "Finalizing evaluation..."}
              {progress === 100 && "Complete! Loading results..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-[60px] relative w-full h-screen bg-gray-100">
            <div className = "absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({length: 256}).map((_, index) => (
          <div key={index} className="w-px h-full bg-gray-50 rounded-full" />
        ))}
      </div>

     <div className=" bg-white rounded-xl z-50 w-full h-fit flex items-center">
     {/* Left Side - Decorative Border with Score */}
      <div className="flex flex-col h-[704px] items-start shrink-0 relative">
        {/* Top Vertical Lines */}
        <div className="flex flex-1 items-center min-h-0 pl-[96px] relative">
          <div className="relative w-[122px] h-full">
            {/* Left vertical line - animates upward */}
            <motion.div
              className="absolute left-0 bottom-0 w-px bg-gray-200"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            />
            {/* Right vertical line - animates upward */}
            <motion.div
              className="absolute right-0 bottom-0 w-px bg-gray-200"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        {/* Center Score Box with Horizontal Lines */}
        <div className="flex items-center px-[96px] shrink-0 w-[218px] relative">
          {/* Top horizontal line */}
          <motion.div
            className="absolute top-0 left-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          />
          {/* Bottom horizontal line */}
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          />
          
          {/* Blue Score Box */}
          <motion.div
            className="bg-blue-500 flex flex-col items-center justify-center p-[48px] shrink-0 w-[122px] h-[122px] relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Left vertical line of box */}
            <motion.div
              className="absolute left-0 top-0 w-px h-full bg-gray-200"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            />
            {/* Right vertical line of box */}
            <motion.div
              className="absolute right-0 top-0 w-px h-full bg-gray-200"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
            />
            <motion.p
              className="font-serif text-[48px] text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <motion.span>{rounded}</motion.span>%
            </motion.p>
          </motion.div>
        </div>
        
        {/* Bottom Vertical Lines */}
        <div className="flex flex-1 items-center min-h-0 pl-[96px] relative">
          <div className="relative w-[122px] h-full">
            {/* Left vertical line - animates downward */}
            <motion.div
              className="absolute left-0 top-0 w-px bg-gray-200"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            />
            {/* Right vertical line - animates downward */}
            <motion.div
              className="absolute right-0 top-0 w-px bg-gray-200"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Middle Connector Lines */}
      <div className="flex flex-1 items-center min-h-0">
        <div className="flex flex-col h-[704px] items-start justify-center flex-1 relative">
          <div className="h-[122px] shrink-0 w-full relative">
            {/* Top horizontal line - animates right */}
            <motion.div
              className="absolute top-0 left-0 h-px bg-gray-200"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            />
            {/* Bottom horizontal line - animates right */}
            <motion.div
              className="absolute bottom-0 left-0 h-px bg-gray-200"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        className="flex flex-col h-[705px] items-start py-8 justify-between shrink-0 w-[862px]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
      >
        {/* Challenge Description */}
        <div className="flex flex-col gap-[16px] items-start flex-1 min-h-0">
           <div className="flex  flex-col gap-2 items-start w-full">
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-lg w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-lg bg-red-100">DESIGN</span>{' '}
              <span className="font-light">{design || 'a landing page'}</span>
            </p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-lg w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-lg bg-blue-100">FOR</span>{' '}
              <span className="font-light">{target || 'a hospital recipient page'}</span>
            </p>
          </div>
          <div className="bg-gray-100 pl-3 pr-5 py-3 rounded-lg w-fit">
            <p className="text-lg text-black">
              <span className="font-serif px-3 py-2 rounded-lg bg-pink-100">TO HELP</span>{' '}
              <span className="font-light">{tohelp || 'neurodivergent people'}</span>
            </p>
          </div>
        </div>
        </div>

        {/* Score Cards */}
        <div className="flex  items-center shrink-0 w-full">
          {/* Thinking & Problem-Solving Card */}
          <motion.div
            className="bg-white border border-[#e4e4e4] flex flex-1 flex-col gap-[16px] items-start justify-center overflow-clip p-[24px] rounded-[12px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          >
            <div className="flex gap-[10px] h-[54px] items-center w-full">
              <div className="bg-red-100 flex h-full items-center justify-center rounded-[12px] shrink-0 w-[54px]">
                <p className="font-serif text-[24px] ">
                  {evaluation.thinking_score || evaluation.diagram_overall_score || 0}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-start justify-center">
                <p className="font-serif text-[24px] text-black">Thinking</p>
                <p className="font-light text-[16px] text-black w-full">
                  Problem-solving & process
                </p>
              </div>
            </div>
            <div className="bg-gray-100 px-[16px] py-[8px] rounded-[12px] w-full max-h-32 overflow-y-auto">
              <p className="font-light text-[14px] text-black">
                {evaluation.criteria?.thinking?.[0]?.feedback || evaluation.criteria?.diagramming?.[0]?.feedback || 'Strong problem-solving approach!'}
              </p>
            </div>
          </motion.div>
        <div className="h-[122px] shrink-0 w-6 relative">
          {/* Top horizontal line - animates left */}
          <motion.div
            className="absolute top-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
          {/* Bottom horizontal line - animates left */}
          <motion.div
            className="absolute bottom-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
        </div>
          {/* Solution Logic & Structure Card */}
          <motion.div
            className="bg-white border border-gray-200 flex flex-1 flex-col gap-[16px] items-start justify-center overflow-clip p-[24px] rounded-[12px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: 'easeOut' }}
          >
            <div className="flex gap-[10px] h-[54px] items-center w-full">
              <div className="bg-blue-100 flex h-full items-center justify-center rounded-[12px] shrink-0 w-[54px]">
                <p className="font-serif text-[24px]">
                  {evaluation.solution_score || evaluation.technical_overall_score || 0}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-start justify-center">
                <p className="font-serif text-[24px] text-black">Solution</p>
                <p className="font-light text-[16px] text-black w-full">
                  Logic & structure
                </p>
              </div>
            </div>
            <div className="bg-gray-100 px-[16px] py-[8px] rounded-[12px] w-full max-h-32 overflow-y-auto">
              <p className="font-light text-[14px] text-black">
                {evaluation.criteria?.solution?.[0]?.feedback || evaluation.criteria?.technical?.[0]?.feedback || 'Solid solution structure!'}
              </p>
            </div>
          </motion.div>
        <div className="h-[122px] shrink-0 w-6 relative">
          {/* Top horizontal line - animates left */}
          <motion.div
            className="absolute top-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
          {/* Bottom horizontal line - animates left */}
          <motion.div
            className="absolute bottom-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
        </div>
          {/* Communication on Diagram Card */}
          <motion.div
            className="bg-white border border-gray-200 flex flex-1 flex-col gap-[16px] items-start justify-center overflow-clip p-[24px] rounded-[12px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: 'easeOut' }}
          >
            <div className="flex gap-[10px] h-[54px] items-center w-full">
              <div className="bg-pink-100 flex h-full items-center justify-center rounded-[12px] shrink-0 w-[54px]">
                <p className="font-serif text-[24px] ">
                  {evaluation.communication_score || evaluation.transcript_overall_score || 0}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-start justify-center">
                <p className="font-serif text-[24px] text-black">Communication</p>
                <p className="font-light text-[16px] text-black w-full">
                  Labels & annotations
                </p>
              </div>
            </div>
            <div className="bg-[#f1f1f1] px-[16px] py-[8px] rounded-[12px] w-full max-h-32 overflow-y-auto">
              <p className="font-light text-[14px] text-black">
                {evaluation.criteria?.communication?.[0]?.feedback || evaluation.criteria?.linguistic?.[0]?.feedback || 'Clear diagram communication!'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex flex-col items-center justify-end flex-1 ">
          <div className="bg-[#e7e7e7] flex flex-wrap gap-[12] start  p-[12px] rounded-[12px]">
            <button
              onClick={handleViewSubmission}
              className="bg-white flex items-center px-[16px] py-[8px] rounded-[12px] hover:bg-[#f5f5f5] transition-colors"
            >
              <p className="font-light text-[16px] text-black">View Submission</p>
            </button>
            <button
              onClick={handleReloadChallenge}
              className="bg-[#3168f5] flex items-center px-[16px] py-[8px] rounded-[12px] hover:bg-[#2555d9] transition-colors"
            >
              <p className="font-light text-[16px] text-white">Reload Challenge</p>
            </button>
          </div>
        </div> */}
          <div className="items-center relative flex  w-fit h-fit rounded-xl  bg-gray-100">

           <div className = "flex w-fit p-2 px-4  font-serif text-lg bg items-center gap-2">
          Input
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2  p-2 items-center rounded-xl">
                  <button 
                    className="h-full px-3 py-2 rounded-xl pointer-events-auto gap-2 flex-nowrap cursor-pointer flex items-center justify-center bg-white"
                  >
                    <Keyboard size={16} strokeWidth={1.2} /> Text
                  </button>
                  <button 
                    className="h-full px-3 py-2 rounded-xl pointer-events-auto gap-2 cursor-pointer flex items-center justify-center bg-white"
                  >
                    <AudioLines size={16} strokeWidth={1.2} /> Speech
                  </button>
                </div>
          <div className = "w-px  self-stretch bg-gray-200" />
          <div className = "flex w-fit  p-2 items-center gap-2">
            <button className="px-3 py-2 bg-blue-100 h-fit text-black cursor-pointer pointer-events-auto flex-nowrap rounded-xl flex items-center gap-2">
              <Sparkles size={16} strokeWidth={1.2} />
            Feedback
          </button>
          </div>
      
        </div>
       



      </motion.div>

      {/* Right Connector Lines */}
      <div className="flex flex-1 flex-col h-[704px] items-start justify-center relative">
        <div className="h-[122px] shrink-0 w-full relative">
          {/* Top horizontal line - animates left */}
          <motion.div
            className="absolute top-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
          {/* Bottom horizontal line - animates left */}
          <motion.div
            className="absolute bottom-0 right-0 h-px bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>
        </div>
    </div>
  );
}

