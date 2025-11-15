const Listitem = ({ children, className }) => {
  return (
    <button
      className={`  hover:scale-98 transition-all duration-300 hover:rounded-[8px] flex gap-2 items-center w-full text-left hover:bg-hover px-[16px] py-[12px] cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

export default Listitem;
