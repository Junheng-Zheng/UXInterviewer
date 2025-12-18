import Decryptedtext from "../UIComponents/Decryptedtext";
const Counter = ({ children, className, text, onMinus, onPlus }) => {
  return (
    <div className="flex text-xs relative  flex-col gap-2">
      <p className=" uppercase ">{text}</p>
      <div
        className={`${className} flex justify-between  w-[128px] items-center border border-gray-200 rounded-full px-[16px] py-[12px]`}
      >
        <button
          onClick={onMinus}
          className="cursor-pointer hover:scale-90 transition-all duration-300 active:scale-80"
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        {/* <Decryptedtext
          text={`${children}`}
          animateOn="view"
          revealDirection="center"
          speed={100}
        /> */}
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
