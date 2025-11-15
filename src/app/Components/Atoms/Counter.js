const Counter = ({ children, className, text, onMinus, onPlus }) => {
  return (
    <div className="flex relative flex-col gap-2">
      <p className="text-[12px] text-tertiary ">{text}</p>
      <div
        className={`${className} flex gap-6  w-fit items-center border border-border rounded-full justify-center px-[16px] py-[12px]`}
      >
        <button
          onClick={onMinus}
          className="cursor-pointer hover:scale-90 transition-all duration-300 active:scale-80"
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        {children}
        <button
          onClick={onPlus}
          className="cursor-pointer hover:scale-90 transition-all duration-300 active:scale-80"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  );
};

export default Counter;
