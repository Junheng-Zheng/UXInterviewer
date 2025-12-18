"use client";
const Button = ({
  children,
  className,
  variant = "secondary",
  icon,
  onClick,
}) => {
  const variantClasses = {
    primary: "bg-orange-500 text-white",
    secondary: " border border-gray-200",
  };

  return (
    <button
      className={`${className} gap-2 h-fit w-fit active:scale-90 hover:scale-98 transition-all hover:opacity-90 duration-300 flex  text-xs items-center justify-center cursor-pointer px-4 py-3 rounded-full ${variantClasses[variant]}`}
      onClick={onClick}
    >
      {icon && <i className={`${icon} fa-solid`}></i>}
      {children}
    </button>
  );
};

export default Button;
