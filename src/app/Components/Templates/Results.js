import Profilenavbar from "../Organisms/Profilenavbar";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Button from "../Atoms/Button";
import Percentagechart from "../Atoms/Percentagechart";
import Listitem from "../Atoms/Listitem";
import useStore from "../../../store/module";
import { useState } from "react";

const Results = () => {
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const evaluation = useStore((state) => state.evaluation);
  const screenshot = useStore((state) => state.screenshot);
  const [showJson, setShowJson] = useState(false);

  // Default values if evaluation is not loaded yet
  const overallScore = evaluation?.overall_score ?? 0;
  const confidenceLevel = evaluation?.confidence_level ?? "low";
  const criteria = evaluation?.criteria ?? [];
  const summary = evaluation?.summary ?? {
    strengths: [],
    improvements: [],
    overall_assessment: "Evaluation loading...",
  };
  //test
  // Map criteria to display format
  const criteriaList = criteria.length > 0 
    ? criteria 
    : [
        { name: "Information Architecture", score: 0, feedback: "" },
        { name: "Hierarchy & Layout", score: 0, feedback: "" },
        { name: "Labeling & Clarity", score: 0, feedback: "" },
        { name: "Consistency & Naming", score: 0, feedback: "" },
        { name: "Creativity & Visual Appeal", score: 0, feedback: "" },
      ];

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
                <p>Just Now</p>
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
              {/* Diagramming Score Display */}
              <div className="flex gap-4 items-end">
                <Percentagechart 
                  percentage={overallScore} 
                  title="Diagramming" 
                  selected 
                />
                <Percentagechart percentage={95} title="Technical"/>
                <Percentagechart percentage={50} title="Linguistics" />
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
                  <Listitem key={index} className="flex justify-between">
                    <div className="flex flex-col gap-1">
                      <p>{criterion.name}</p>
                      {criterion.feedback && (
                        <p className="text-xs text-tertiary">{criterion.feedback}</p>
                      )}
                    </div>
                    <p className="font-semibold">
                      {Math.round(criterion.score)} / {criterion.weight !== undefined ? Math.round(criterion.weight) : '—'}
                    </p>
                  </Listitem>
                ))}
              </div>

              {/* Summary Section */}
              {summary && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Overall Assessment</h3>
                  <p className="text-sm text-gray-700 mb-3">{summary.overall_assessment}</p>
                  
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
          ) : (
            <div className="text-tertiary text-center flex items-center justify-center h-full w-full">
              <p>No submission screenshot available</p>
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
