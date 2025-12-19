import { useState, useEffect } from "react";
import Profilenavbar from "../Organisms/Profilenavbar";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Button from "../Atoms/Button";
import Percentagechart from "../Atoms/Percentagechart";
import Listitem from "../Atoms/Listitem";
import useStore from "../../../store/module";

const Results = ({ submissionData }) => {
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const evaluation = useStore((state) => state.evaluation);
  const screenshot = useStore((state) => state.screenshot);
  const [showJson, setShowJson] = useState(false);
  const [selectedSection, setSelectedSection] = useState('diagramming'); // 'diagramming', 'technical', or 'linguistic'
  const [excalidrawData, setExcalidrawData] = useState(null);
  const [generatedScreenshot, setGeneratedScreenshot] = useState(null);
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);

  // Load excalidraw data and generate screenshot if viewing a submission
  useEffect(() => {
    const generateScreenshot = async () => {
      if (!submissionData?.excalidrawData) {
        return;
      }

      try {
        setIsGeneratingScreenshot(true);
        
        // Parse the excalidraw data (it's stored as a JSON string)
        const parsed = typeof submissionData.excalidrawData === 'string' 
          ? JSON.parse(submissionData.excalidrawData)
          : submissionData.excalidrawData;
        
        setExcalidrawData(parsed);

        // Import exportToBlob dynamically
        const excalidrawModule = await import("@excalidraw/excalidraw");
        const { exportToBlob } = excalidrawModule;

        if (!exportToBlob) {
          console.error("exportToBlob not available");
          return;
        }

        // Clean up appState to ensure it's compatible
        const appState = parsed.appState || {};
        const cleanedAppState = { ...appState };
        
        // Ensure collaborators is an array if it exists
        if (cleanedAppState.collaborators !== undefined) {
          cleanedAppState.collaborators = Array.isArray(cleanedAppState.collaborators)
            ? cleanedAppState.collaborators
            : [];
        }
        
        // Remove problematic properties
        delete cleanedAppState.collaboratorsMap;

        // Generate screenshot from Excalidraw data
        const blob = await exportToBlob({
          elements: parsed.elements || [],
          appState: {
            ...cleanedAppState,
            exportBackground: true,
            exportWithDarkMode: false,
          },
          mimeType: "image/png",
        });

        // Convert blob to base64
        const base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(",")[1]; // Remove data:image/png;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        setGeneratedScreenshot(base64String);
      } catch (e) {
        console.error("Error generating screenshot from excalidraw data:", e);
      } finally {
        setIsGeneratingScreenshot(false);
      }
    };

    generateScreenshot();
  }, [submissionData]);

  // Debug: Log evaluation structure when it changes
  useEffect(() => {
    if (evaluation) {
      console.log("Evaluation object:", evaluation);
      console.log("Evaluation summary:", evaluation.summary);
      console.log("Overall assessment:", evaluation.summary?.overall_assessment);
    }
  }, [evaluation]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just Now";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just Now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return "Just Now";
    }
  };

  // Default values if evaluation is not loaded yet
  const overallScore = evaluation?.overall_score ?? 0;
  const diagramScore = evaluation?.diagram_overall_score ?? evaluation?.overall_score ?? 0;
  const technicalScore = evaluation?.technical_overall_score ?? 0;
  const transcriptScore = evaluation?.transcript_overall_score ?? 0;
  const confidenceLevel = evaluation?.confidence_level ?? "low";
  
  // Handle new nested criteria structure
  const criteriaObj = evaluation?.criteria;
  let diagrammingCriteria = [];
  let technicalCriteria = [];
  let linguisticCriteria = [];
  
  if (criteriaObj && typeof criteriaObj === 'object' && !Array.isArray(criteriaObj)) {
    // New format: criteria is an object with diagramming, technical, linguistic arrays
    diagrammingCriteria = criteriaObj.diagramming || [];
    technicalCriteria = criteriaObj.technical || [];
    linguisticCriteria = criteriaObj.linguistic || [];
  } else if (Array.isArray(criteriaObj)) {
    // Legacy format: criteria is a flat array - assign to diagramming as default
    diagrammingCriteria = criteriaObj;
  }
  
  // Default fallback if no criteria found
  if (diagrammingCriteria.length === 0 && technicalCriteria.length === 0 && linguisticCriteria.length === 0) {
    diagrammingCriteria = [
      { name: "Information Architecture", score: 0, feedback: "", weight: 25 },
      { name: "Hierarchy & Layout", score: 0, feedback: "", weight: 20 },
      { name: "Labeling & Clarity", score: 0, feedback: "", weight: 15 },
      { name: "Consistency & Naming", score: 0, feedback: "", weight: 15 },
      { name: "Creativity & Visual Appeal", score: 0, feedback: "", weight: 10 },
    ];
  }
  
  // Get criteria list based on selected section
  const getCriteriaForSection = (section) => {
    switch (section) {
      case 'diagramming':
        return diagrammingCriteria;
      case 'technical':
        return technicalCriteria;
      case 'linguistic':
        return linguisticCriteria;
      default:
        return diagrammingCriteria;
    }
  };
  
  const criteriaList = getCriteriaForSection(selectedSection);
  
  // Ensure summary always has valid structure with fallbacks
  const summary = evaluation?.summary 
    ? {
        strengths: evaluation.summary.strengths || [],
        improvements: evaluation.summary.improvements || [],
        overall_assessment: evaluation.summary.overall_assessment || "No overall assessment provided.",
      }
    : {
        strengths: [],
        improvements: [],
        overall_assessment: evaluation ? "No overall assessment provided." : "Evaluation loading...",
      };

  return (
    <div>
      <Profilenavbar />
      <Dynamiccontainer className="flex  gap-25">
        <div className="flex flex-col gap-8" style={{ width: 'calc(50% - 1rem)' }}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-4">
              <div className="text-[36px] shoulder  flex flex-col gap-1 font-bold leading-[36px] tracking-[-0.8px] ">
                <p>DESIGN {design}</p>
                <p>FOR {target}</p>
                <p>TO HELP {tohelp}</p>
              </div>
              <div className="flex text-tertiary gap-4">
                <p>{submissionData?.timestamp ? formatTimestamp(submissionData.timestamp) : "Just Now"}</p>
                <p>Productivity</p>
                <p>Easy</p>
                <p>15 minutes</p>
              </div>
              <div className="gap-4 flex">
                <Button variant="secondary" icon="fa-solid fa-eye">
                  View Submission
                </Button>
                <Button variant="primary" icon="fa-solid fa-refresh">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
          <div className="w-ful h-px bg-border"></div>
          <div className="flex  gap-6 items-stretch">
            <div className="flex flex-col gap-4">
              {/* Score Display */}
              <div className="flex gap-4 items-end">
                <button
                  onClick={() => setSelectedSection('diagramming')}
                  className="cursor-pointer focus:outline-none"
                  type="button"
                >
                  <Percentagechart 
                    percentage={Math.round(diagramScore)} 
                    title="Diagramming" 
                    selected={selectedSection === 'diagramming'}
                  />
                </button>
                <button
                  onClick={() => setSelectedSection('technical')}
                  className="cursor-pointer focus:outline-none"
                  type="button"
                >
                  <Percentagechart 
                    percentage={Math.round(technicalScore)} 
                    title="Technical"
                    selected={selectedSection === 'technical'}
                  />
                </button>
                <button
                  onClick={() => setSelectedSection('linguistic')}
                  className="cursor-pointer focus:outline-none"
                  type="button"
                >
                  <Percentagechart 
                    percentage={Math.round(transcriptScore)} 
                    title="Linguistics"
                    selected={selectedSection === 'linguistic'}
                  />
                </button>
                {confidenceLevel && (
                  <div className="px-3 py-2 bg-gray-100 rounded-full">
                    <p className="text-sm text-gray-600">
                      Confidence: <span className="font-semibold capitalize">{confidenceLevel}</span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Criteria Breakdown */}
              <div>
                {criteriaList.map((criterion, index) => (
                  <Listitem key={index} className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="break-words">{criterion.name}</p>
                      {criterion.feedback && (
                        <p className="text-xs text-tertiary break-words">{criterion.feedback}</p>
                      )}
                    </div>
                    <p className="font-semibold whitespace-nowrap flex-shrink-0 ml-2">
                      {Math.round(criterion.score)} / {criterion.weight !== undefined ? Math.round(criterion.weight) : '—'}
                    </p>
                  </Listitem>
                ))}
              </div>

              {/* Summary Section */}
              {evaluation && summary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Overall Assessment</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    {summary.overall_assessment || "No overall assessment provided."}
                  </p>
                  
                  {summary.strengths && summary.strengths.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths:</h4>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {summary.strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summary.improvements && summary.improvements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Improvements:</h4>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {summary.improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="gap-6 flex items-center p-6 border border-border rounded-[12px]" style={{ width: 'calc(50% - 1rem)' }}>
          {screenshot ? (
            <div className="w-full h-full flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Submission Screenshot</h3>
              <div className="flex-1 w-full min-h-[400px] overflow-auto rounded-lg bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={`data:image/png;base64,${screenshot}`}
                  alt="Excalidraw submission screenshot"
                  className="max-w-full max-h-full object-contain shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </div>
          ) : generatedScreenshot ? (
            <div className="w-full h-full flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Submission Diagram</h3>
              <div className="flex-1 w-full min-h-[400px] overflow-auto rounded-lg bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={`data:image/png;base64,${generatedScreenshot}`}
                  alt="Excalidraw submission diagram"
                  className="max-w-full max-h-full object-contain shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </div>
          ) : isGeneratingScreenshot ? (
            <div className="w-full h-full flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Submission Diagram</h3>
              <div className="flex-1 w-full min-h-[400px] overflow-auto rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating diagram...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-tertiary text-center flex items-center justify-center h-full w-full">
              <p>No submission data available</p>
            </div>
          )}
        </div>
      </Dynamiccontainer>
      
      {/* Raw JSON Response Section */}
      {evaluation && (
        <Dynamiccontainer className="mt-8">
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowJson(!showJson)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-border"
            >
              <h3 className="text-lg font-semibold">Raw ChatGPT JSON Response</h3>
              <i className={`fa-solid fa-chevron-${showJson ? 'up' : 'down'} text-gray-600`}></i>
            </button>
            {showJson && (
              <div className="p-6 bg-gray-900 overflow-auto max-h-[600px]">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(evaluation, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Dynamiccontainer>
      )}
    </div>
  );
};

export default Results;
