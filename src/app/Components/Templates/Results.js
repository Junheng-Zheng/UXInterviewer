import Profilenavbar from "../Organisms/Profilenavbar";
import Dynamiccontainer from "../Atoms/Dynamiccontainer";
import Button from "../Atoms/Button";
import Percentagechart from "../Atoms/Percentagechart";
import Listitem from "../Atoms/Listitem";
import useStore from "../../../store/module";
const Results = () => {
  const { design, target, tohelp } = useStore();

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
              {/* <div className="gap-4 flex">
                <Button variant="secondary" icon="fa-solid fa-eye">
                  View Submission
                </Button>
                <Button variant="primary" icon="fa-solid fa-refresh">
                  Try Again
                </Button>
              </div> */}
            </div>
          </div>
          <div className="w-ful h-px bg-border"></div>
          <div className="flex  gap-6 items-stretch">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-end">
                <Percentagechart percentage={95} title="Technical" selected />
                <Percentagechart percentage={75} title="Diagramming" />
                <Percentagechart percentage={50} title="Linguistics" />
              </div>
              <div>
                <Listitem className="flex justify-between">
                  <p>Information Architecture </p>
                  <p>95%</p>
                </Listitem>
                <Listitem className="flex justify-between">
                  <p>Hierarchy & Layout </p>
                  <p>75%</p>
                </Listitem>
                <Listitem className="flex justify-between">
                  <p>Labeling & Clarity </p>
                  <p>50%</p>
                </Listitem>
                <Listitem className="flex justify-between">
                  <p>Consistency & Naming </p>
                  <p>50%</p>
                </Listitem>
                <Listitem className="flex justify-between">
                  <p>Creativity & Visual Appeal </p>
                  <p>50%</p>
                </Listitem>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full flex-1 gap-6 flex items-center p-6 border border-border rounded-[12px]"></div>
      </Dynamiccontainer>
    </div>
  );
};

export default Results;
