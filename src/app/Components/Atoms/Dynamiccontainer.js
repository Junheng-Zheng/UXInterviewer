const Dynamiccontainer = ({ children, className }) => {
  return (
    <div
      className={`px-[32px] md:px-[64px] lg:px-[128px] xl:px-[156px] ${className}`}
    >
      {children}
    </div>
  );
};

export default Dynamiccontainer;
