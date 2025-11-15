"use client";
const Animatedlink = ({ children, className }) => {
  return (
    <div
      className={`relative cursor-pointer h-fit w-fit overflow-hidden ${className} group`}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-all duration-300 border-b border-border"></div>
      {children}
    </div>
  );
};

export default Animatedlink;
