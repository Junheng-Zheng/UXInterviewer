'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import {  CheckIcon, PencilIcon, SearchIcon, Square, SquareMinus, CodeIcon, SparklesIcon, SquareCheck, ArrowUpRightIcon, Paperclip, CheckCircle2, Target, FileText, Calculator, Hash, X} from "lucide-react";
import { motion } from "framer-motion";
import useStore from '../../store/module';

const RubricList = ({checked = false, partial = false, children, aiexplanation}) =>{
  const [showExplain, setShowExplain] = useState(false);
    return (
        <div 
        onClick = {() => setShowExplain(!showExplain)}
        onMouseLeave = {() => setShowExplain(false)}
        className = "flex-1 px-6 cursor-pointer py-3 flex relative group hover:bg-purple-100 border-gray-200 items-start gap-2 border-b ">
          <button className = 'cursor-pointer items-center justify-between w-full   text-purple-900  group-hover:flex hidden  '>
            <div className = "flex items-center gap-2">
              <SparklesIcon size={14} className = "" />
            <p>Explain</p>
            </div>
            <ArrowUpRightIcon size={14} />
            </button>
            {checked ? <SquareCheck size={14} className = "translate-y-1  bg-lime-100 group-hover:hidden" /> : partial ? <SquareMinus size={14} className = "translate-y-1 bg-yellow-100 group-hover:hidden" /> : <Square size={14} className = "translate-y-1 bg-red-100 group-hover:hidden" />}
           <div className = "flex group-hover:hidden gap-1">
             <p>{children}</p>
             {/* <p className = "text-xs text-gray-500 pl-">user has created a basic layout and indicated a flow, but lacks detailed user flows or interactions. </p> */}
             </div>
             <div className ={`w-[300px] pointer-events-none ${showExplain ? 'opacity-100 scale-100' : 'opacity-0 scale-80'}  absolute flex flex-col gap-2 right-6 z-200 -translate-y-1/2  top-1/2 shadow-md   rounded-lg px-6 py-3  bg-white transition-all duration-300`}>
             <div className = "text-xs py-1 px-2 bg-purple-100 w-fit flex items-center gap-1 rounded-sm">
              <SparklesIcon size={12} />
              <p>AI Explanation</p>
             </div>
             <p className = " text-gray-700">{aiexplanation}</p>
             </div>
        </div>
    )
}

const gradeColors = {
  A: 'oklch(93.8% 0.127 124.321)',
  B: 'oklch(96.7% 0.067 122.328)',
  C: 'oklch(94.5% 0.129 101.54)',
  D: 'oklch(95.4% 0.038 75.164)',
  F: 'oklch(88.5% 0.062 18.334)',
};

const GradingAssessment = ({ selectedGrade }) => {
    const grades = ['F', 'D', 'C', 'B', 'A'];
    return (
           <div className = "px-4 py-3 flex items-center justify-center">
            <div className = "w-full bg-gray-100 flex flex-col lg:flex-row justify-between">
                <p className = "px-6 py-3">Grading Assessment</p>
                <div className = "flex items-center border-l justify-end  border-t w-full lg:w-fit lg:border-t-0 border-gray-200  "> 
                   {grades.map((grade) => (
            <div
              key={grade}
              style={{
                backgroundColor:
                  grade === selectedGrade ? gradeColors[grade] : 'transparent',
              }}
              className="w-11 aspect-square border-r border-gray-200 flex items-center justify-center transition-colors"
            >
              {grade}
            </div>
          ))}
                </div>  


            </div>
        </div>

    )

}


const pulse = {
  animate: {
    opacity: [0.2, 1, 0.2],
  },
};

const dot = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};


// Helper function to get points from criterion status
const getPointsFromStatus = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s === 'yes') return 2;
  if (s === 'partial') return 1;
  return 0;
};

// Helper function to calculate phase grade from criteria (point-based: 0-8 points)
const getGradeFromPhaseCriteria = (phase, phaseName) => {
  if (!phase) return 'F';
  
  // Determine which criteria belong to this phase
  let criteria = [];
  
  if (
    phaseName === 'discovery' ||
    phase.target_user_who_context !== undefined ||
    phase.pain_points_real_problems !== undefined ||
    phase.constraints_reality_check !== undefined ||
    phase.goals_success_criteria !== undefined ||
    phase.identified_target_user !== undefined // backward compatibility
  ) {
    // Discovery now uses exactly FOUR rubric subfactors, in this order:
    // 1) target user, 2) pain points, 3) constraints, 4) measurements of success
    criteria = [
      phase.target_user_who_context ?? phase.identified_target_user,
      phase.pain_points_real_problems ?? phase.identified_pain_points,
      phase.constraints_reality_check ?? phase.identified_constraints,
      phase.goals_success_criteria,
    ];
  } else if (phaseName === 'define' || phase.problem_statement_created !== undefined) {
    criteria = [
      phase.problem_statement_created,
      phase.prioritization_completed,
      phase.scope_defined,
      phase.outcomes_defined,
    ];
  } else if (phaseName === 'development' || phase.multiple_ideas_generated !== undefined) {
    criteria = [
      phase.multiple_ideas_generated,
      phase.user_flows_created,
      phase.diagrams_or_screens_created,
      phase.tradeoffs_explained,
    ];
  } else if (phaseName === 'delivery' || phase.final_solution_presented !== undefined) {
    criteria = [
      phase.final_solution_presented,
      phase.end_to_end_journey_shown,
      phase.decisions_justified,
      phase.risks_addressed,
    ];
  }
  
  // Filter out undefined/null and calculate total points
  const validCriteria = criteria.filter(c => c !== undefined && c !== null);
  const totalPoints = validCriteria.reduce((sum, c) => sum + getPointsFromStatus(c.status), 0);
  
  // Convert points to letter grade
  if (totalPoints >= 7) return 'A';
  if (totalPoints >= 5) return 'B';
  if (totalPoints >= 3) return 'C';
  if (totalPoints >= 1) return 'D';
  return 'F';
};

// Helper function to get grade from phase result (backward compatibility)
const getGradeFromPhaseResult = (phaseResult, phase, phaseName) => {
  // If phase has criteria, use point-based system
  if (phase) {
    return getGradeFromPhaseCriteria(phase, phaseName);
  }
  // Fallback to old pass/fail system
  if (!phaseResult) return 'F';
  return phaseResult.toLowerCase() === 'pass' ? 'A' : 'F';
};

// Helper function to get status from phase criteria
// Returns: true for checked, 'partial' for partial credit, false for unchecked
const getStatusFromCriteria = (criteria) => {
  if (!criteria || !criteria.status) return false;
  const status = criteria.status.toLowerCase();
  if (status === 'yes') return true;
  if (status === 'partial') return 'partial';
  return false;
};

// Helper function to format AI explanation with correctness statement
const formatAIExplanation = (criteria) => {
  if (!criteria) return "No evidence provided";
  
  const status = criteria.status?.toLowerCase();
  const userCapture = criteria.user_capture || criteria.evidence;
  const modelProvided = criteria.model_provided;
  const accuracyMatch = criteria.accuracy_match?.toLowerCase();
  const evidence = criteria.evidence || "No evidence provided";
  
  // If accuracy failed (wrong numbers/info), show what interviewer said vs what user captured
  if (status === 'no' && accuracyMatch === 'no' && modelProvided && userCapture) {
    // Extract the exact quote from user_capture if it contains quotes
    let userQuote = userCapture;
    if (userCapture.includes("'") || userCapture.includes('"')) {
      const match = userCapture.match(/['"]([^'"]+)['"]/);
      if (match) {
        userQuote = match[1];
      }
    }
    
    return `This does not align with what the interviewer said. The interviewer said: "${modelProvided}". However, the user captured: ${userCapture}`;
  }
  
  // Handle partial credit status - provide detailed explanation of what was correct and what was wrong
  if (status === 'partial') {
    // Always prioritize the evidence field as it should contain the detailed explanation
    // The prompt instructs to write: "User correctly captured X, but misidentified Y"
    if (evidence && evidence !== "No evidence provided") {
      // If evidence already explains what was correct/wrong, use it directly
      if (evidence.includes("correctly") || evidence.includes("but") || evidence.includes("however") || 
          evidence.includes("misidentified") || evidence.includes("missing") || evidence.includes("did not")) {
        return evidence;
      }
      // If evidence is less detailed, enhance it with user_capture and model_provided
      if (modelProvided && userCapture && modelProvided !== "N/A") {
        return `${evidence} User captured: "${userCapture}". Interviewer said: "${modelProvided}".`;
      }
      return evidence;
    }
    
    // Fallback: construct explanation from available data
    if (modelProvided && userCapture && modelProvided !== "N/A") {
      return `They partially completed this. User captured: "${userCapture}". However, this does not fully match what the interviewer said: "${modelProvided}".`;
    }
    
    // Last resort fallback
    if (userCapture) {
      return `They partially completed this. User captured: "${userCapture}". Some information was correct, but other details were missing or incorrect.`;
    }
    
    return `They partially completed this. Some aspects were done correctly, but the requirement was not fully met.`;
  }
  
  // If we have user_capture with exact quotes, use it
  if (userCapture && userCapture !== evidence) {
    if (status === 'yes' && accuracyMatch === 'yes') {
      return `They did this correctly. ${userCapture}`;
    } else if (status === 'no') {
      return `They did not do this correctly. ${userCapture}`;
    }
  }
  
  // Fallback to evidence
  if (status === 'yes') {
    return `They did this correctly, as they did this: ${evidence}`;
  } else if (status === 'no') {
    return `They did not do this correctly, as ${evidence}`;
  }
  
  return evidence;
};

const GradeTest = () => {
  const evaluation = useStore((state) => state.evaluation);
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const time = useStore((state) => state.time);
  
  // Real loading state - derived from evaluation data (ready to be connected to actual API later)
  const isLoading = !evaluation;
  
  // Get parsed evaluation data
  const parsed = evaluation?.parsed;
  const hasParsedData = !!parsed;
  
  // Get phase data
  const discovery = parsed?.discovery;
  const define = parsed?.define;
  const development = parsed?.development;
  const delivery = parsed?.delivery;
  
  // Get overall grade (calculate from phase results)
  const getOverallGrade = () => {
    if (!hasParsedData) return 'F';
    const phases = [discovery, define, development, delivery];
    const passCount = phases.filter(p => p?.phase_result?.toLowerCase() === 'pass').length;
    if (passCount === 4) return 'A';
    if (passCount === 3) return 'B';
    if (passCount === 2) return 'C';
    if (passCount === 1) return 'D';
    return 'F';
  };
  
  const overallGrade = getOverallGrade();
  const [showHowToGrade, setShowHowToGrade] = useState(false);
  return (
    isLoading ? (
    <div className="h-dvh w-full flex flex-col  gap-2 text-sm items-center justify-center">
        <motion.div
        
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className = "absolute bg-lime-200 px-4 py-2 rounded-md top-6 left-1/2 -translate-x-1/2">
            Grading in progress
        </motion.div>
      <div className="w-[64px] h-[64px] bg-gray-100 rounded-xl grid p-2 grid-cols-2 grid-rows-2 gap-1">
        {[0, 0.3, 0.6, 0.9].map((delay, i) => (
          <motion.div
            key={i}
            className="w-full h-full rounded-md bg-gray-300"
            variants={pulse}
            animate="animate"
            transition={{
              duration: .8,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="text-gray-400">
      loading
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          variants={dot}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.4,
          }}
        >
          .
        </motion.span>
      ))}
    </p>
    <p className = "absolute bottom-6 text-gray-600 left-1/2 -translate-x-1/2">
      Grading can take up to 1 minute.
    </p>
    </div>
    ) : (
    <div className = "text-sm  text-gray-800 ">
      <div className = {`fixed top-0 left-0 w-full h-full flex items-center justify-center   z-900 ${showHowToGrade ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <button 
        onClick={() => setShowHowToGrade(false)}
      className = "absolute w-full h-full bg-black/20 rounded-sm"/>
      <div className = {`w-3xl text-gray-600 z-20 p-4 bg-white rounded-sm flex flex-col gap-7 ${showHowToGrade ? 'scale-100 opacity-100' : 'scale-80 opacity-0'} transition-all duration-300`}>
       <div className = "flex items-center justify-between">
         <p className = "text-3xl ">✳</p>
         <X size={20} className = "cursor-pointer" onClick={() => setShowHowToGrade(false)} />
         </div>
        <h2 className = "text-xl tracking-tight">How do we {" "} <span className = "bg-lime-100 px-2 py-1 rounded-sm"> grade</span> {" "}?</h2>
        <p className = "w-1/2">
          We grade following a criteria-based approach, following the double diamond model.
        </p>
        <div className = "flex text-xs items-center ">
          <p className = "bg-gray-100 px-2 py-1 rounded-sm">Discovery</p>
          <div className = "h-px w-[20px] bg-gray-200" />
          <p className = "bg-gray-100 px-2 py-1 rounded-sm">Define</p>
          <div className = "h-px w-[20px] bg-gray-200" />
          <p className = "bg-gray-100 px-2 py-1 rounded-sm">Development</p>
          <div className = "h-px w-[20px] bg-gray-200" />
          <p className = "bg-gray-100 px-2 py-1 rounded-sm">Delivery</p>
        </div>
        <p className = "w-1/2">We grade each phase based on the criteria. We use a simple 3 key rubric to grade each phase.</p>
      <div className = "flex items-center gap-2">
           <div className = "text-xs py-1 px-2 flex items-center gap-1 w-fit bg-gray-100 rounded-sm">
              <SquareCheck size={14} className = "bg-lime-100" /> Correct
            </div>
             <div className = "text-xs py-1 px-2 flex items-center gap-1 w-fit bg-gray-100 rounded-sm">
              <SquareMinus size={14} className = "bg-yellow-100" /> Partially Correct
            </div>
           
            <div className = "text-xs py-1 px-2 flex items-center gap-1 w-fit bg-gray-100 rounded-sm">
              <Square size={14} className = "bg-red-100" /> Incorrect
            </div>
      </div>
     <div className = 'grid grid-cols-3 gap-3'>
       <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <Paperclip size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Evidence Sources</p>
       <p className = "text-xs">The system checks both transcript and whiteboard. Evidence from either source counts toward meeting criteria.</p>
      </div>
      </div>
         <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <CheckCircle2 size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Cross-Referencing</p>
       <p className = "text-xs">3-step process: identify model-provided info, identify user capture, then cross-check for accuracy match.</p>
      </div>
      </div>
         <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <Target size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Accuracy Match</p>
       <p className = "text-xs">Determined by comparing model vs user: &quot;yes&quot; (all match), &quot;partial&quot; (some match), or &quot;no&quot; (none match).</p>
      </div>
      </div>
         <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <FileText size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Evidence Requirements</p>
       <p className = "text-xs">Must include exact quotes, what model provided, what user captured, and whether they match accurately.</p>
      </div>
      </div>
         <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <Calculator size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Mathematical Relationship</p>
       <p className = "text-xs">If accuracy_match is &quot;no&quot; → status is &quot;no&quot;. If &quot;partial&quot; → status is &quot;partial&quot;. If &quot;yes&quot; → status can be &quot;yes&quot;.</p>
      </div>
      </div>
         <div className = 'flex gap-2 p-3 bg-gray-100 rounded-sm'>
        <Hash size={14} className = "translate-y-1 "/>
      <div className = 'flex-1 flex flex-col gap-1'>
         <p>Strict Number Matching</p>
       <p className = "text-xs">Age ranges, percentages, counts, and timeframes must match exactly. Wrong numbers = automatic &quot;no&quot;.</p>
      </div>
      </div>
      
     </div>
        
      </div>
      </div>
      {/* JSON Output Section */}
      {hasParsedData && parsed && (
        <div className = "px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className = "text-base font-medium mb-2">JSON Output</h3>
          <div className = "bg-white p-4 rounded border border-gray-200">
            <pre className = "text-sm text-gray-800 whitespace-pre-wrap wrap-break-word overflow-auto max-h-96 font-sans">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Raw Output Section - only show if parsing failed or for debugging */}
      {evaluation?.rawResponse && (evaluation?.parseError || !hasParsedData) && (
        <div className = "px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className = "text-base font-medium mb-2">Raw Response {evaluation?.parseError && '(Parse Error)'}</h3>
          {evaluation?.parseError && (
            <div className = "mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Parse Error: {evaluation.parseError}
            </div>
          )}
          <div className = "bg-white p-4 rounded border border-gray-200">
            <pre className = "text-sm text-gray-800 whitespace-pre-wrap wrap-break-word overflow-auto max-h-96 font-sans">
              {evaluation.rawResponse}
            </pre>
          </div>
        </div>
      )}

         <div className = "px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className = "flex items-center gap-3">
            {/* <Image src = "/logo.png" alt = "logo" width = {40} height = {40} className = "hidden md:block" /> */}
              <p className = "flex items-center py-2 px-3 rounded-sm bg-gray-100">Back Home</p>
        </div>
                <div className = "flex items-center gap-3">
            <p className = "flex items-center py-2 px-3 rounded-sm bg-gray-100">View Submission</p>
        <p className = "flex items-center py-2 px-3 rounded-sm bg-gray-100">Try Again</p>
        </div>

      </div>
      {/* <div className = "w-full border-  bg-white/20 backdrop-blur-sm flex items-center  border-gray-200 text-xl font-medium justify-between">
            <p className = "px-6 py-3 ">Total Assessment Score</p>
          <div className = "w-[53px] bg-lime-200 self-stretch items-center flex justify-center">A+</div>
      </div> */}
      <div className = "px-6 py-3 flex border-b border-gray-200 flex-col gap-3 ">
      <div className = "flex items-center justify-between gap-3">
          <div className = {`w-[48px] bg-lime-200 self-stretch aspect-square text-xl font-medium items-center flex justify-center ${overallGrade === 'F' ? 'bg-red-100' : overallGrade === 'D' ? 'bg-yellow-100' : overallGrade === 'C' ? 'bg-blue-100' : overallGrade === 'B' ? 'bg-purple-100' : 'bg-lime-100'}`}>
            {overallGrade}
          </div>
      </div>
        <h1 className = "text-2xl font-normal w-2/3 tracking-tight  lg:w-2/5">
          <span className = "bg-blue-100 px-2 ">Design</span> {design || 'a Landing page'}  {" "}
          <span className = "bg-red-100 px-2 ">for</span> {target || 'a SaaS product'}  {" "}
          <span className = "bg-lime-100 px-2 ">to help</span> {tohelp || 'users manage their finances'}.
        </h1>

      <div className = "flex items-center text-xs gap-3">
        <p className = "flex items-center py-1 px-2 rounded-sm bg-gray-100">{time || 30}m</p>
        <p className = "flex items-center py-1 px-2 rounded-sm bg-gray-100">Easy</p>
      </div>
      </div>
      <div className = "flex lg:flex-row flex-col lg:items-center  justify-between ">
      <div className = "px-6 py-3 flex items-center gap-3">
        <p className = "text-lg">Rubric</p>
      </div>
        <div className = "flex gap-3 px-6 py-3 border-l border-gray-200 text-sm items-center">
          Key
          <div className = "flex gap-3 items-center">
            <div className = "text-xs py-1 px-2 flex items-center gap-1 bg-gray-100 rounded-sm">
              <SquareCheck size={14} className = "bg-lime-100" /> Correct
            </div>
            <div className = "text-xs py-1 px-2 flex items-center gap-1 bg-gray-100 rounded-sm"> <SquareMinus size={14} className = "bg-yellow-100" /> Partially Correct </div>
            <div className = "text-xs py-1 px-2 flex items-center gap-1 bg-gray-100 rounded-sm"> <Square size={14} className = "bg-red-100" /> Incorrect </div>
          </div>
        </div>
      </div>
      <div className = "flex-col md:flex-row flex w-full ">
      <div className = "flex-1 flex flex-col border-r border-gray-200">
          <div className = "flex-1 px-6 py-3 bg-gray-100 border-gray-200 flex items-center gap-2 border-b ">
            <SearchIcon size={14} />
            <p>Discovery</p>
        </div>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(discovery?.target_user_who_context ?? discovery?.identified_target_user) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(discovery?.target_user_who_context ?? discovery?.identified_target_user) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(discovery?.target_user_who_context ?? discovery?.identified_target_user) : "No evidence provided"}
        >
          Identify target user (role, context, goals)
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(discovery?.pain_points_real_problems ?? discovery?.identified_pain_points) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(discovery?.pain_points_real_problems ?? discovery?.identified_pain_points) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(discovery?.pain_points_real_problems ?? discovery?.identified_pain_points) : "No evidence provided"}
        >
          Define key pain points (not assumptions)
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(discovery?.constraints_reality_check ?? discovery?.identified_constraints) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(discovery?.constraints_reality_check ?? discovery?.identified_constraints) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(discovery?.constraints_reality_check ?? discovery?.identified_constraints) : "No evidence provided"}
        >
          Identify constraints (time, tech, business)
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(discovery?.goals_success_criteria) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(discovery?.goals_success_criteria) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(discovery?.goals_success_criteria) : "No evidence provided"}
        >
          Define goals and success criteria (what “good” looks like)
        </RubricList>
        <GradingAssessment selectedGrade = {hasParsedData ? getGradeFromPhaseResult(discovery?.phase_result, discovery, 'discovery') : 'F'} />
      </div>
        <div className = "flex-1 flex flex-col border-r border-gray-200">
          <div className = "flex-1 px-6 py-3 bg-gray-100 border-gray-200 flex items-center gap-2 border-b ">
            <PencilIcon size={14} />
            <p>Define</p>
          </div>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(define?.problem_statement_created) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(define?.problem_statement_created) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(define?.problem_statement_created) : "No evidence provided"}
          >
            Define a clear problem statement
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(define?.prioritization_completed) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(define?.prioritization_completed) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(define?.prioritization_completed) : "No evidence provided"}
          >
            Create a focused solution/design goal
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(define?.scope_defined) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(define?.scope_defined) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(define?.scope_defined) : "No evidence provided"}
          >
            Define the developmental approach
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(define?.outcomes_defined) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(define?.outcomes_defined) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(define?.outcomes_defined) : "No evidence provided"}
          >
            Translate insights into clear user needs & requirements
          </RubricList>
          <GradingAssessment selectedGrade = {hasParsedData ? getGradeFromPhaseResult(define?.phase_result, define, 'define') : 'F'} />
        </div>
      </div>
    <div className = "flex-col border-b border-gray-200 md:flex-row flex w-full ">
      <div className = "flex-1 flex flex-col border-r border-gray-200">
          <div className = "flex-1 px-6 py-3 bg-gray-100 border-gray-200 flex items-center gap-2 border-b ">
            <CodeIcon size={14} />
            <p>Development</p>
        </div>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(development?.multiple_ideas_generated) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(development?.multiple_ideas_generated) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(development?.multiple_ideas_generated) : "No evidence provided"}
        >
          Generate multiple solution ideas
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(development?.user_flows_created) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(development?.user_flows_created) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(development?.user_flows_created) : "No evidence provided"}
        >
          Create user flows or experience map
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(development?.diagrams_or_screens_created) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(development?.diagrams_or_screens_created) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(development?.diagrams_or_screens_created) : "No evidence provided"}
        >
          Sketch layout or system diagram
        </RubricList>
        <RubricList 
          checked = {hasParsedData ? getStatusFromCriteria(development?.tradeoffs_explained) === true : false}
          partial = {hasParsedData ? getStatusFromCriteria(development?.tradeoffs_explained) === 'partial' : false}
          aiexplanation = {hasParsedData ? formatAIExplanation(development?.tradeoffs_explained) : "No evidence provided"}
        >
          Explain tradeoffs and decisions
        </RubricList>
        <GradingAssessment selectedGrade = {hasParsedData ? getGradeFromPhaseResult(development?.phase_result, development) : 'F'} />

      </div>
        <div className = "flex-1 flex flex-col border-r border-gray-200">
          <div className = "flex-1 px-6 py-3 bg-gray-100 border-gray-200 flex items-center gap-2 border-b ">
            <CheckIcon size={14} />
            <p>Delivery</p>
          </div>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(delivery?.final_solution_presented) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(delivery?.final_solution_presented) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(delivery?.final_solution_presented) : "No evidence provided"}
          >
            Present a clear final solution
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(delivery?.end_to_end_journey_shown) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(delivery?.end_to_end_journey_shown) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(delivery?.end_to_end_journey_shown) : "No evidence provided"}
          >
            Walk through end-to-end user journey
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(delivery?.decisions_justified) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(delivery?.decisions_justified) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(delivery?.decisions_justified) : "No evidence provided"}
          >
            Justify design decisions with reasoning
          </RubricList>
          <RubricList 
            checked = {hasParsedData ? getStatusFromCriteria(delivery?.risks_addressed) === true : false}
            partial = {hasParsedData ? getStatusFromCriteria(delivery?.risks_addressed) === 'partial' : false}
            aiexplanation = {hasParsedData ? formatAIExplanation(delivery?.risks_addressed) : "No evidence provided"}
          >
            Address edge cases or risks
          </RubricList>
          <GradingAssessment selectedGrade = {hasParsedData ? getGradeFromPhaseResult(delivery?.phase_result, delivery, 'delivery') : 'F'} />
        </div>
      </div>
      <div className = "w-full  flex sticky bottom-0 pointer-events-none lg:p-12 md:p-6 justify-center z-800">
        <div 
          className = "px-6 pointer-events-auto py-3 flex gap-3 w-full lg:w-1/2 md:shadow-sm items-start bg-purple-100/50 backdrop-blur-lg rounded-lg relative z-100"
        >
       <div className = "flex w-8 rounded-sm pointer-events-none h-8 aspect-square bg-purple-100 translate-y-1 items-center justify-center ">
         <SparklesIcon size={14} className = "text-purple-500"/>
       </div>
        <div className = "flex flex-col gap-2">
          <h2 className = "text-base text-purple-900">Feedback</h2>
          <p className = "text-sm flex-1 text-purple-900">
            {hasParsedData ? (parsed?.overall_feedback_summary || "No overall feedback available.") : "Overall, the design is well-structured and visually appealing, with a clear focus on user needs. The layout is intuitive, and the use of color and typography effectively guides the user through the page."}
          </p>
          {/* {hasParsedData && (
            <div className = "flex flex-col gap-2 mt-2">
              {discovery?.feedback_summary && (
                <div className = "text-xs text-purple-800">
                  <strong>Discovery:</strong> {discovery.feedback_summary}
                </div>
              )}
              {define?.feedback_summary && (
                <div className = "text-xs text-purple-800">
                  <strong>Define:</strong> {define.feedback_summary}
                </div>
              )}
              {development?.feedback_summary && (
                <div className = "text-xs text-purple-800">
                  <strong>Development:</strong> {development.feedback_summary}
                </div>
              )}
              {delivery?.feedback_summary && (
                <div className = "text-xs text-purple-800">
                  <strong>Delivery:</strong> {delivery.feedback_summary}
                </div>
              )}
            </div>
          )} */}
           <div 
            className = "flex pointer-events-auto items-center gap-2 relative z-[101]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
             <div 
               className = "flex items-center gap-1 pointer-events-auto bg-purple-200 text-purple-900 text-xs px-2 py-1 rounded-sm w-fit relative z-[101] cursor-pointer"
               onClick={(e) => e.stopPropagation()}
               onMouseDown={(e) => e.stopPropagation()}
             >More Analysis <ArrowUpRightIcon size={14} /> </div>
             <button
             onClick={() => setShowHowToGrade(true)} 
               className = "flex items-center gap-1 bg-purple-200  text-purple-900 opacity-60 text-xs px-2 py-1 rounded-sm w-fit relative z-[101] cursor-pointer"
             >How do we grade? <ArrowUpRightIcon size={14} /> </button>
           </div>
        </div>
        </div>
      </div>
    </div>
    )
  );
};

export default GradeTest;


    