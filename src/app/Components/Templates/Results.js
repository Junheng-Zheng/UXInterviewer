import Profilenavbar from "../Organisms/Profilenavbar";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Button from "../Atoms/Button";
import Percentagechart from "../Atoms/Percentagechart";
import Listitem from "../Atoms/Listitem";
import useStore from "../../../store/module";
const Results = () => {
  const design = useStore((state) => state.design);
  const target = useStore((state) => state.target);
  const tohelp = useStore((state) => state.tohelp);
  const evaluation = useStore((state) => state.evaluation);

  // Default values if evaluation is not loaded yet
  const overallScore = evaluation?.overall_score ?? 0;
  const confidenceLevel = evaluation?.confidence_level ?? "low";
  const criteria = evaluation?.criteria ?? [];
  const summary = evaluation?.summary ?? {
    strengths: [],
    improvements: [],
    overall_assessment: "Evaluation loading...",
  };

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
      <Dynamiccontainer className="flex  gap-8">
        <div className="flex flex-col gap-8">
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
        <div className="w-full flex-1 gap-6 flex items-center p-6 border border-border rounded-[12px]"></div>
      </Dynamiccontainer>
    </div>
  );
};

export default Results;
