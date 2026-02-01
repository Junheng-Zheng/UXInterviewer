"use client";
const Imagery = ({ children, className }) => {
  return (
    <div
      className={`w-full p-4 z-1 relative bg-orange-500 rounded-lg ${className}`}
    >
      <div className="absolute top-0 left-0 w-full flex justify-between h-full">
        {Array.from({ length: 128 }).map((_, index) => (
          <div key={index} className="w-px h-full bg-white/15"></div>
        ))}
      </div>
      <div className="w-full overflow-hidden relative shadow-md shadow-black/10 border border-gray-200  bg-white rounded-sm">
        {children}
      </div>
    </div>
  );
};

export default Imagery;
