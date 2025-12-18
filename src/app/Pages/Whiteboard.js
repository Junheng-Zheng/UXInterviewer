const Whiteboard = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-pencil" />
        <p className="font-medium uppercase">Whiteboard</p>
      </div>
      <div className="flex text-xs items-end gap-2">
        <button className="flex px-3 py-2 rounded-full border border-gray-200 items-center gap-2">
          <i className="fa-solid fa-refresh" />
          Refresh Challenge
        </button>
        <button className="flex px-3 py-2 rounded-full border border-gray-200 items-center gap-2">
          <i className="fa-solid fa-refresh" />
          Add Job Description
        </button>
        <div className="flex flex-col gap-2">
          <p>CATEGORY</p>
          <div className="flex px-3 py-2 rounded-full gap-9 border border-gray-200 items-center">
            All
            <i className="fa-solid fa-chevron-down" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p>DIFFICULTY</p>
          <div className="flex px-3 py-2 rounded-full gap-9 border border-gray-200 items-center">
            EASY
            <i className="fa-solid fa-chevron-down" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <p>[CATEGORY] Hard</p>
        <p>[DIFFICULTY] Hard</p>
        <p>[REFERENCE] https://www.google.com</p>
      </div>
      <div className="text-[36px] shoulder flex flex-col gap-1 font-bold leading-[36px] tracking-[-0.8px] ">
        <p className="pb-3 border-b-[0.5px] w-full border-gray-200">
          DESIGN a FAQ page
        </p>
        <p className="pb-3 border-b-[0.5px] w-full border-gray-200">
          FOR a finance tracking app
        </p>
        <p className="pb-3 border-b-[0.5px] w-full border-gray-200">
          TO HELP accountants
        </p>
      </div>
      <p className="text-xs">[EXPECTED TIME NEEDED] 10 Minutes</p>
    </div>
  );
};

export default Whiteboard;
