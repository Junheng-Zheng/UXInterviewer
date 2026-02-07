'use client';
import { House, Redo2, Edit, Eye, Sparkles, Clock, Calendar, Zap, PenTool, MessageSquareText, SplinePointer, BadgeQuestionMark } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
const Grade = () => {

    
  return (
    <div className = "h-dvh flex text-sm bg-gray-100">
      <div className = "w-[360px]  h-full border-r bg-gray-50  border-gray-200">
        <div className = "p-6 flex gap-3 ">
         <Link href="/">
         <House size={24} strokeWidth={1.3} />
         </Link>
        <Redo2 size={24} strokeWidth={1.3} />
        <Eye size={24} strokeWidth={1.3} />
        </div>
        
        <div className = "flex flex-col   items-center gap-0">
            
             <motion.div className = "h-px items-start flex bg-gray-300"
             initial = {{ width: 0 }}
             animate = {{ width: '100%' }}
             transition = {{ duration: 0.5, ease: 'easeOut' }}
             >
             </motion.div>

            <div className = "w-[156px] h-[102px] items-end flex justify-between">
                <motion.div 
                className = "w-px h-full bg-gray-300 rounded-xl"
                initial = {{ height: 0 }}
                animate = {{ height: '100%' }}
                transition = {{ duration: 0.5, ease: 'easeOut' }}
                >
                </motion.div>
                <motion.div 
                className = "w-px  bg-gray-300 rounded-xl"
                initial = {{ height: 0 }}
                animate = {{ height: '100%' }}
                transition = {{ duration: 0.5, ease: 'easeOut' }}
                >
                </motion.div>
            </div>
            <div className = "w-full flex h-[156px] ">
                <div className = "w-full h-full  flex-1 flex-col  items-end justify-between flex ">
                    <motion.div
                     className = "h-px items-start flex bg-gray-300"
                     initial = {{ width: 0 }}
                     animate = {{ width: '100%' }}
                     transition = {{ duration: 0.5, ease: 'easeOut' }}
                     >
                     </motion.div>
                    <motion.div className = "h-px items-start flex bg-gray-300"
                     initial = {{ width: 0 }}
                     animate = {{ width: '100%' }}
                     transition = {{ duration: 0.5, ease: 'easeOut' }}
                     >
                     </motion.div>
                </div>
                <div className = "flex-1 aspect-square flex-col gap-3 text-white flex justify-center items-center bg-black">
                    <div className = "flex items-center gap-2">
                        <Sparkles size={16} strokeWidth={1.3} fill="#fcd34d" stroke="#fcd34d" />
                    <p className = ""> Overall Score</p>
                    </div>
                    <h1 className = "text-5xl font-serif">78%</h1>
                </div>
                 <div className = "w-full h-full  flex-1 flex-col justify-between flex ">
                    <motion.div className = "h-px items-start flex bg-gray-300"
                     initial = {{ width: 0 }}
                     animate = {{ width: '100%' }}
                     transition = {{ duration: 0.5, ease: 'easeOut' }}
                     >
                     </motion.div>
                    <motion.div className = "h-px items-start flex bg-gray-300"
                     initial = {{ width: 0 }}
                     animate = {{ width: '100%' }}
                     transition = {{ duration: 0.5, ease: 'easeOut' }}
                     >
                     </motion.div>
                </div>
            </div>

                <div className = "w-[156px] h-[102px] items-start flex justify-between">
                <motion.div 
                className = "w-px h-full bg-gray-300 rounded-xl"
                initial = {{ height: 0 }}
                animate = {{ height: '100%' }}
                transition = {{ duration: 0.5, ease: 'easeOut' }}
                >
                </motion.div>
                <motion.div 
                className = "w-px  bg-gray-300 rounded-xl"
                initial = {{ height: 0 }}
                animate = {{ height: '100%' }}
                transition = {{ duration: 0.5, ease: 'easeOut' }}
                >
                </motion.div>
            </div>
            <motion.div className = "h-px items-start flex bg-gray-300"
             initial = {{ width: 0 }}
             animate = {{ width: '100%' }}
             transition = {{ duration: 0.5, ease: 'easeOut' }}
             >
             </motion.div>
        </div>
        <motion.div
        initial = {{ opacity: 0 , y: 20 }}
        animate = {{ opacity: 1 , y: 0 }}
        transition = {{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
         className = "p-6 border-b justify-between flex items-center border-gray-300">
           <div className = "flex items-center gap-2">
             <Clock size={16} strokeWidth={1.3}  />
            <p className = "text-xl font-serif ">Duration</p>
           </div>
            <p className = " text-gray-600">32m</p>
        </motion.div>
         <motion.div
         initial = {{ opacity: 0 , y: 20 }}
         animate = {{ opacity: 1 , y: 0 }}
         transition = {{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
         className = "p-6 border-b justify-between flex items-center border-gray-300">
            <div className = "flex items-center gap-2">
             <Zap size={16} strokeWidth={1.3}  />
            <p className = "text-xl font-serif ">Difficulty</p>
           </div>
            <p className = " text-gray-600">Easy</p>
        </motion.div>
         <motion.div
         initial = {{ opacity: 0 , y: 20 }}
         animate = {{ opacity: 1 , y: 0 }}
         transition = {{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
         className = "p-6 border-b justify-between flex items-center border-gray-300">
            <div className = "flex items-center gap-2">
             <Clock size={16} strokeWidth={1.3}  />
            <p className = "text-xl font-serif ">Time Limit</p>
           </div>
            <p className = " text-gray-600">45m</p>
        </motion.div>
         <motion.div
         initial = {{ opacity: 0 , y: 20 }}
         animate = {{ opacity: 1 , y: 0 }}
         transition = {{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
         className = "p-6 border-b justify-between flex items-center border-gray-300">
            <div className = "flex items-center gap-2">
             <Calendar size={16} strokeWidth={1.3}  />
            <p className = "text-xl font-serif ">Date</p>
           </div>
            <p className = " text-gray-600">Oct 12, 2025</p>
        </motion.div>
      </div>
      <div className = "p-8 flex-1 flex flex-col  items-start  h-full relative">
          <div
        className="absolute top-0 left-0   w-full h-full z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>

        <div className = "overflow-y-auto bg-white rounded-xl  scrollbar-hide h-full flex-1 flex flex-col">
            <div>
            <div className = " flex  gap-8 border-b   relative  overflow-hidden  border-gray-200"> 
                

             <div className="flex p-6   flex-col  border-gray-200  gap-8 items-start w-full">
                             <h2 className = "text-2xl font-serif">Challenge Details</h2>
        <div className = "flex flex-col gap-2">

              <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
            <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-red-100">DESIGN</p>{' '}
              <p className="font-normal">{ 'a landing page'}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
            <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-blue-100">FOR</p>{' '}
              <p className="font-normal">{ 'a hospital recipient page'}</p>
            </div>
          </div>
          <div className="bg-gray-100 pl-2 pr-5 py-2 rounded-lg w-fit">
              <div className="text-base flex items-center gap-2 text-black">
              <p className="font-serif px-3 text-lg py-1 rounded-lg bg-pink-100">TO HELP</p>{' '}
              <p className="font-normal">{ 'neurodivergent people'}</p>
            </div>
          </div>
        </div>
        </div>
        <div className="perspective-[1000px] w-full  p-6  h-full">
  <div className="
    aspect-video h-full relative bg-gray-100 border border-gray-200 overflow-hidden rounded-xl
    transform
    transform-3d

    -rotate-y-16
    rotate-x-16
    rotate-z-12
  ">
    <Image src="/whiteboardtest.png" alt="submission" fill />
  </div>
</div>

         {/* <div className = "flex justify-between items-end   gap-2  flex-col ">
          <div className = "p-6">
              <div className="items-center relative flex flex-nowrap w-fit h-fit rounded-xl  bg-gray-100">

            <div className = "flex flex-nowrap w-fit p-2 px-4  font-serif text-lg items-center gap-2">
          Options 
           </div>
            <div className = "w-px  self-stretch bg-gray-200" />

                <div className = "flex gap-2 flex-nowrap p-2 items-center rounded-xl">
                  <button className="px-3 py-2 bg-white h-fit text-nowrap text-black cursor-pointer pointer-events-auto flex-nowrap rounded-xl flex items-center gap-2">
                    <Redo2 size={16} strokeWidth={1.2} />
                    Try Again
                  </button>
                  <button className="px-3 py-2 bg-white h-fit text-nowrap text-black cursor-pointer pointer-events-auto flex-nowrap rounded-xl flex items-center gap-2">
                    <Eye size={16} strokeWidth={1.2} />
                    View Submission
                  </button>
                </div>
            </div>
          </div>

       
         </div> */}

</div>
        <div className = "p-6  flex flex-col gap-12 border-b  border-gray-200">
             

            <div className = "flex  gap-2 items-start">
                <h2 className = "text-2xl font-serif">Rubric Breakdown</h2>
                 <BadgeQuestionMark size={16} strokeWidth={1.3}  />
            </div>
{/* Rubric Breakdown [Technical] */}
            <div className= "flex">
            <div className = "w-[240px]">
                <div className = "py-2 px-3 w-fit flex items-center gap-2 bg-red-100 rounded-xl">
                    <PenTool size={16} strokeWidth={1.3}  /> Technical</div>
            </div>
            <div className = "flex-1 flex-col flex w-full items-center gap-8">
                <div className = "flex w-full self-stretch flex-1 gap-3 items-center">
                    <div className = "w-full items-center flex h-full  gap-0">
                        <div className = "w-[92%] h-px bg-black"></div>
                        <div className = "w-px h-full bg-red-400"></div>
                        <div className = "flex-1 h-px bg-gray-400"></div>
                    </div>
                    92/100%
                </div>
        <div className = "flex flex-col w-full gap-8">


                <div className = "w-full text-gray-600 justify-between flex items-center">
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-red-100 ">
                    <p>Logical Flow of Experience</p>
                    <p className = "text-gray-400 text-xs">Was the problem broken down into sensible parts?</p>
                    </div>
                <p>Excellent</p>
            </div>
                    <div className = "w-full text-gray-600 justify-between flex items-center">
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-red-100 ">
                    <p>Constraint Awareness</p>
                    <p className = "text-gray-400 text-xs">Were the constraints of the problem considered?</p>
                    </div>
                <p>Good</p>
            </div>
            <div className = "w-full text-gray-600 justify-between flex items-center">  
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-red-100 ">
                    <p>Decision Justification</p>
                    <p className = "text-gray-400 text-xs">Were the decisions justified?</p>
                    </div>
                <p>Good</p>
            </div>

        </div>
        
            </div>
            </div>

{/* Rubric Breakdown [Diagramming] */}
          <div className= "flex">
           <div className = "w-[240px]">
             <div className = "py-2 px-3 w-fit bg-blue-100 rounded-xl flex items-center gap-2"><SplinePointer size={16} strokeWidth={1.3}  /> Diagramming</div>
           </div>
           <div className = "flex-1 flex-col flex w-full items-center gap-8">
            <div className = "flex w-full self-stretch flex-1 gap-3 items-center">
                <div className = "w-full items-center flex h-full  gap-0">
                    <div className = "w-[92%] h-px bg-black"></div>
                    <div className = "w-px h-full bg-red-400"></div>
                    <div className = "flex-1 h-px bg-gray-400"></div>
                </div>
                   92/100%
            </div>
            <div className = "flex flex-col w-full gap-8">
            <div className = "w-full text-gray-600 justify-between flex items-center">  
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-blue-100 ">
                    <p>Prompt-to-Screen Solution</p>
                    <p className = "text-gray-400 text-xs">Was the prompt-to-screen solution executed?</p>
                    </div>
                <p>Good</p>
            </div>
         <div className = "w-full text-gray-600 justify-between flex items-center">
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-blue-100 ">
                    <p>Visual Hierarchy</p>
                    <p className = "text-gray-400 text-xs">Was the visual hierarchy executed?</p>
                    </div>
            <p>Excellent</p>
         </div>
                  <div className = "w-full text-gray-600 justify-between flex items-center">
                <div className = "flex flex-col gap-1 border-l-2 pl-3 border-blue-100 ">
                    <p>Funcitonal Layout</p>
                    <p className = "text-gray-400 text-xs">Was the functional layout executed?</p>
                    </div>
            <p>Good</p>
         </div>
         </div>
           </div>
          </div>



{/* Rubric Breakdown [Communication] */}
          <div className= "flex">
           <div className = "w-[240px]">
             <div className = "py-2 px-3 w-fit bg-pink-100 rounded-xl flex items-center gap-2"> <MessageSquareText size={16} strokeWidth={1.3}  /> Communication</div>
           </div>
           <div className = "flex-1 flex-col flex w-full items-center gap-8">
            <div className = "flex w-full self-stretch flex-1 gap-3 items-center">
                <div className = "w-full items-center flex h-full  gap-0">
                    <div className = "w-[92%] h-px bg-black"></div>
                    <div className = "w-px h-full bg-red-400"></div>
                    <div className = "flex-1 h-px bg-gray-400"></div>
                </div>
                   92/100%
            </div>
            <div className = "flex flex-col w-full gap-8">
            <div className = "w-full text-gray-600 justify-between flex items-center">
            <div className = "flex flex-col gap-1 border-l-2 pl-3 border-pink-100 ">
                    <p>Question Quality</p>
                    <p className = "text-gray-400 text-xs">Was the question quality executed?</p>
                    </div>
            <p>Good</p>
         </div>
                  <div className = "w-full text-gray-600 justify-between flex items-center">
            <div className = "flex flex-col gap-1 border-l-2 pl-3 border-pink-100 ">
                    <p>Responsiveness to prompts</p>
                    <p className = "text-gray-400 text-xs">Was the responsiveness to prompts executed?</p>
                    </div>
            <p>Good</p>
         </div>
         <div className = "w-full text-gray-600 justify-between flex items-center">
            <div className = "flex flex-col gap-1 border-l-2 pl-3 border-pink-100 ">
                    <p>Clarification Timing</p>
                    <p className = "text-gray-400 text-xs">Was the clarification timing executed?</p>
                    </div>
            <p>Excellent</p>
         </div>
         </div>
           </div>
          </div>


        </div>

                <div className = "p-6  flex flex-col gap-12 border-b border-gray-200">
            <h2 className = "text-2xl font-serif">Feedback</h2>
{/* Feedback [Technical] */}
            <div className= "flex">
            <div className = "w-[240px]">
                <div className = "py-2 px-3 w-fit bg-red-100 rounded-xl flex items-center gap-2"><PenTool size={16} strokeWidth={1.3}  /> Technical</div>
            </div>
            <div className = "flex-1 text-gray-600 flex-col flex w-full items-center gap-3">
                Your approach to defining the data relationships was excellent. You correctly identified the many-to-many relationship between Users and Projects early in the whiteboard session.
However, you missed defining the edge case for archiving old projects, which was hinted at in the prompt requirements.
            </div>
            </div>

{/* Feedback [Diagramming] */}
            <div className= "flex">
            <div className = "w-[240px]">
                <div className = "py-2 px-3 w-fit bg-blue-100 rounded-xl flex items-center gap-2"><SplinePointer size={16} strokeWidth={1.3}  /> Diagramming</div>
            </div>
            <div className = "flex-1 text-gray-600 flex-col flex w-full items-center gap-3">
                Your approach to defining the data relationships was excellent. You correctly identified the many-to-many relationship between Users and Projects early in the whiteboard session.
However, you missed defining the edge case for archiving old projects, which was hinted at in the prompt requirements.
            </div>
            </div>



{/* Feedback [Communication] */}
            <div className= "flex">
            <div className = "w-[240px]">
                <div className = "py-2 px-3 w-fit bg-pink-100 rounded-xl flex items-center gap-2"><MessageSquareText size={16} strokeWidth={1.3}  /> Communication</div>
            </div>
            <div className = "flex-1 text-gray-600 flex-col flex w-full items-center gap-3">
                Your approach to defining the data relationships was excellent. You correctly identified the many-to-many relationship between Users and Projects early in the whiteboard session.
However, you missed defining the edge case for archiving old projects, which was hinted at in the prompt requirements.
            </div>
            </div>


        </div>

      </div>
      </div>
      </div>
    </div>
  );
};

export default Grade;