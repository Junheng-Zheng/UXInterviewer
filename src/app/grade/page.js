'use client';
import { useState } from 'react';
import { House, Redo2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import useStore from '../../store/module';

const Grade = () => {
  // State to track which section is open (default to 'Technical')
  const [openSection, setOpenSection] = useState('Technical');
  // Get evaluation data from zustand store
  const evaluation = useStore((state) => state.evaluation);
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const screenshot = useStore((state) => state.screenshot);

  // Helper function to get score percentage
  const getScorePercentage = (score) => {
    if (typeof score === 'number') return score;
    return 0;
  };

  // Helper function to get grade letter from score
  const getGradeLetter = (score) => {
    const num = getScorePercentage(score);
    if (num >= 90) return 'A';
    if (num >= 80) return 'B';
    if (num >= 70) return 'C';
    if (num >= 60) return 'D';
    return 'F';
  };

  // Helper function to get score level text
  const getScoreLevel = (score) => {
    const num = getScorePercentage(score);
    if (num >= 90) return 'Excellent';
    if (num >= 75) return 'Good';
    if (num >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  // Check if this is a raw response (testing mode)
  const isRawResponse = evaluation?.rawResponse !== undefined;

  // Extract scores with fallbacks for both old and new formats (only if not raw response)
  const overallScore = isRawResponse ? 0 : (evaluation?.overall_score ?? 
    Math.round((
      (evaluation?.thinking_score ?? evaluation?.diagram_overall_score ?? 0) +
      (evaluation?.solution_score ?? evaluation?.technical_overall_score ?? 0) +
      (evaluation?.communication_score ?? evaluation?.transcript_overall_score ?? 0)
    ) / 3));

  const technicalScore = isRawResponse ? 0 : (evaluation?.solution_score ?? evaluation?.technical_overall_score ?? 0);
  const diagrammingScore = isRawResponse ? 0 : (evaluation?.thinking_score ?? evaluation?.diagram_overall_score ?? 0);
  const communicationScore = isRawResponse ? 0 : (evaluation?.communication_score ?? evaluation?.transcript_overall_score ?? 0);

  // Extract criteria - support both new and old formats
  const criteriaObj = evaluation?.criteria;
  let technicalCriteria = [];
  let diagrammingCriteria = [];
  let communicationCriteria = [];

  if (criteriaObj && typeof criteriaObj === 'object' && !Array.isArray(criteriaObj)) {
    // New format: criteria is an object with nested arrays
    technicalCriteria = criteriaObj.solution || criteriaObj.technical || [];
    diagrammingCriteria = criteriaObj.thinking || criteriaObj.diagramming || [];
    communicationCriteria = criteriaObj.communication || criteriaObj.linguistic || [];
  } else if (Array.isArray(criteriaObj)) {
    // Legacy format: criteria is a flat array - try to categorize by name
    technicalCriteria = criteriaObj.filter(c => 
      c.name?.toLowerCase().includes('logical') || 
      c.name?.toLowerCase().includes('constraint') || 
      c.name?.toLowerCase().includes('decision') ||
      c.name?.toLowerCase().includes('technical')
    );
    diagrammingCriteria = criteriaObj.filter(c => 
      c.name?.toLowerCase().includes('prompt') || 
      c.name?.toLowerCase().includes('visual') || 
      c.name?.toLowerCase().includes('hierarchy') ||
      c.name?.toLowerCase().includes('layout') ||
      c.name?.toLowerCase().includes('diagram')
    );
    communicationCriteria = criteriaObj.filter(c => 
      c.name?.toLowerCase().includes('question') || 
      c.name?.toLowerCase().includes('responsive') || 
      c.name?.toLowerCase().includes('clarification') ||
      c.name?.toLowerCase().includes('communication')
    );
  }

  // Extract summary/feedback - try multiple sources
  const summary = evaluation?.summary || {};
  
  // Helper to format feedback text (preserve line breaks, handle multiple paragraphs)
  const formatFeedback = (text) => {
    if (!text) return '';
    // If it's an array, join with line breaks
    if (Array.isArray(text)) {
      return text.join('\n\n');
    }
    // If it's a string, preserve line breaks
    return String(text);
  };

  // Extract technical feedback (try multiple field names)
  const technicalFeedback = formatFeedback(
    summary.solution || 
    summary.technical || 
    summary.thinking ||
    evaluation?.technical_feedback ||
    evaluation?.solution_feedback ||
    ''
  );

  // Extract diagramming feedback
  const diagrammingFeedback = formatFeedback(
    summary.thinking || 
    summary.diagramming || 
    summary.solution ||
    evaluation?.diagramming_feedback ||
    evaluation?.thinking_feedback ||
    ''
  );

  // Extract communication feedback
  const communicationFeedback = formatFeedback(
    summary.communication || 
    summary.linguistic || 
    summary.transcript ||
    evaluation?.communication_feedback ||
    evaluation?.transcript_feedback ||
    ''
  );

  // Get completion time and date
  const completionTimeMinutes = evaluation?.completionTimeMinutes || 32;
  const completionDate = evaluation?.timestamp ? new Date(evaluation.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const timeLimit = 45; // Default time limit

  // Render category section
  const renderCategorySection = (categoryName, score, criteria, gradeLetter) => {
    const isOpen = openSection === categoryName;
    
    const handleToggle = () => {
      // If clicking the same section, close it. Otherwise, open the clicked section.
      setOpenSection(isOpen ? null : categoryName);
    };

    return (
      <div className = "bg-white w-full">
        {/* Category Header */}
        <button
          onClick={handleToggle}
          className="border-gray-300 border-b border-solid flex gap-[12px] items-center px-[12px] py-[16px] w-full hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex flex-row items-center w-fit self-stretch">
            <div className="aspect-square  text-white  bg-[#414141] flex flex-col h-full items-center justify-center overflow-clip rounded-lg ">
              <p className="font-serif w-12 leading-normal not-italic text-[24px] ">
                {gradeLetter}
              </p>
            </div>
          </div>
          <div className="bg-gray-100 flex items-center justify-center px-[16px] py-[12px] rounded-lg shrink-0">
            <p className="font-serif leading-normal not-italic text-[20px] text-black">
              {categoryName}
            </p>
          </div>
          <div className="flex flex-[1_0_0] flex-col items-end justify-center min-h-px min-w-px">
            <div className="flex items-start">
              <div className="bg-gray-100 flex items-center justify-center px-[12px] py-[4px] rounded-lg shrink-0">
                {isOpen ? (
                  <ChevronUp size={16} strokeWidth={1.3} className="text-black" />
                ) : (
                  <ChevronDown size={16} strokeWidth={1.3} className="text-black" />
                )}
              </div>
            </div>
          </div>
                  </button>

        {/* Criteria Table */}
        {isOpen && (
        <div className="flex flex-col items-start w-full">
          {/* Table Header */}
          <div className=" border-gray-300 border-b border-solid flex gap-[20px] items-center pl-[36px] pr-[12px] w-full">
            <div className="border-gray-300 border-r border-solid flex flex-[1_0_0] items-center min-h-px min-w-px py-[12px]">
              <p className="font-sans leading-normal not-italic text-black text-sm">
                Subfactors
              </p>
            </div>
            <p className="flex-[1_0_0] font-sans leading-normal min-h-px min-w-px not-italic text-black text-sm whitespace-pre-wrap">
              Feedback
            </p>
          </div>

          {/* Table Rows */}
          {criteria.length > 0 ? (
            criteria.map((criterion, index) => (
              <div key={index} className="border-gray-300 border-b border-solid flex gap-[20px] items-center pl-[36px] pr-[12px] w-full">
                <div className="border-gray-300 border-r border-solid flex flex-[1_0_0] items-center min-h-px min-w-px py-[16px]">
                  <div className="flex flex-col gap-[12px] items-start justify-center shrink-0">
                    <div className="flex gap-[8px] items-start shrink-0">
                      <div className="bg-gray-100 flex items-center justify-center px-[16px] py-[12px] rounded-lg shrink-0">
                        <p className="font-sans leading-normal not-italic text-sm text-black">
                          {getGradeLetter(criterion.score || score)}
                        </p>
</div>
                      <div className="bg-gray-100 flex items-center justify-center px-[16px] py-[12px] rounded-lg shrink-0">
                        <p className="font-sans leading-normal not-italic text-sm text-black">
                          {criterion.name || 'Criterion'}
                        </p>
            </div>
                    </div>
                    <p className="font-sans leading-normal not-italic text-black text-sm">
                      {criterion.description || criterion.feedback || getScoreLevel(criterion.score || score)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-[1_0_0] items-center min-h-px min-w-px">
                  <p className="flex-[1_0_0] font-sans leading-normal min-h-px min-w-px not-italic text-black text-[14px] whitespace-pre-wrap">
                    {criterion.feedback || 
                     criterion.comment || 
                     criterion.reasoning ||
                     criterion.explanation ||
                     criterion.details ||
                     criterion.note ||
                     'No specific feedback provided for this criterion.'}
                  </p>
                    </div>
            </div>
            ))
          ) : (
            // Fallback: Show expected criteria structure even if no data
            <div className="border-gray-300 border-b border-solid flex gap-[20px] items-center pl-[36px] pr-[12px] w-full">
              <div className="border-gray-300 border-r border-solid flex flex-[1_0_0] items-center min-h-px min-w-px py-[16px]">
                <div className="flex flex-col gap-[12px] items-start justify-center shrink-0">
                  <p className="font-sans leading-normal not-italic text-black text-sm">
                    No criteria data available
                  </p>
                    </div>
            </div>
              <div className="flex flex-[1_0_0] items-center min-h-px min-w-px">
                <p className="flex-[1_0_0] font-sans leading-normal min-h-px min-w-px not-italic text-black text-[14px] whitespace-pre-wrap">
                  Waiting for evaluation data...
                </p>
                    </div>
            </div>
          )}
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-dvh flex text-sm">
      <div className="flex-1 flex flex-col items-start w-full">
        {/* Header with Navigation Icons */}
        <div className="border-gray-300 border-b border-solid flex gap-[10px] items-start overflow-clip p-[24px] w-full">
          <Link href="/" className="relative shrink-0 size-[24px]">
            <House size={24} strokeWidth={1.3} className="text-black" />
          </Link>
          <button className="relative shrink-0 size-[24px]">
            <Redo2 size={24} strokeWidth={1.3} className="text-black" />
          </button>
          <button className="relative shrink-0 size-[24px]">
            <Eye size={24} strokeWidth={1.3} className="text-black" />
          </button>
        </div>
        
        {/* Task Parameters and Metadata */}
        <div className="border-gray-300 border-b border-solid flex items-center justify-between p-[12px] w-full">
          <div className="flex gap-[10px] items-center shrink-0">
            {/* Design Pill */}
            <div className="bg-gray-100 flex gap-[10px] items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
              <div className="bg-[#ffe1e1] flex items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
                <p className="font-sans leading-normal not-italic text-sm text-black">
                  Design
                </p>
            </div>
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                {design || 'a landing page'}
              </p>
            </div>

            {/* For Pill */}
            <div className="bg-gray-100 flex gap-[10px] items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
              <div className="bg-[#dbeaff] flex items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
                <p className="font-sans leading-normal not-italic text-sm text-black">
                  For
                </p>
           </div>
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                {target || 'a hospital recipient page'}
              </p>
          </div>

            {/* To Help Pill */}
            <div className="bg-gray-100 flex gap-[10px] items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
              <div className="bg-[#fde7f4] flex items-center justify-center px-[12px] py-[8px] rounded-lg shrink-0">
                <p className="font-sans leading-normal not-italic text-sm text-black">
                  To Help
                </p>
           </div>
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                {tohelp || 'neurodivergent people'}
              </p>
           </div>
          </div>

          {/* Metadata Pills */}
          <div className="flex gap-[10px] items-start shrink-0">
            <div className="bg-gray-100 flex items-center justify-center px-[12px] py-[4px] rounded-lg shrink-0">
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                Duration | {timeLimit}m
              </p>
            </div>
            <div className="bg-gray-100 flex items-center justify-center px-[12px] py-[4px] rounded-lg shrink-0">
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                Time Spent | {completionTimeMinutes}m
              </p>
            </div>
            <div className="bg-gray-100 flex items-center justify-center px-[12px] py-[4px] rounded-lg shrink-0">
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                Difficulty | Easy
              </p>
            </div>
            <div className="bg-gray-100 flex items-center justify-center px-[12px] py-[4px] rounded-lg shrink-0">
              <p className="font-['Helvetica_Neue',sans-serif] leading-normal not-italic text-sm text-black">
                Date | {completionDate}
              </p>
            </div>
            </div>
        </div>

        {/* Raw Response Display (for testing) */}
        {evaluation?.rawResponse && (
          <div className="w-full mb-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h3 className="text-lg font-serif mb-2">Raw AI Response (Testing Mode)</h3>
            {evaluation.message && (
              <p className="text-sm text-black mb-2 italic">{evaluation.message}</p>
            )}
            {evaluation.parseError && (
              <p className="text-sm text-red-600 mb-2">Parse Error: {evaluation.parseError}</p>
            )}
            <div className="bg-white p-4 rounded border border-gray-300">
              <pre className="text-sm font-mono text-black whitespace-pre-wrap wrap-break-word overflow-auto max-h-96">
                {evaluation.rawResponse}
              </pre>
            </div>
      </div>
        )}


        {/* Only show category sections if not raw response */}
        {!isRawResponse && (
          <>
            {/* Technical Category */}
            {renderCategorySection('Technical', technicalScore, technicalCriteria, getGradeLetter(technicalScore))}

            {/* Diagramming Category */}
            {renderCategorySection('Diagramming', diagrammingScore, diagrammingCriteria, getGradeLetter(diagrammingScore))}

            {/* Communication Category */}
            {renderCategorySection('Communication', communicationScore, communicationCriteria, getGradeLetter(communicationScore))}
          </>
        )}

        {/* Divider */}
        <div className="h-px shrink-0 w-full" />
      </div>
    </div>
  );
};

export default Grade;
