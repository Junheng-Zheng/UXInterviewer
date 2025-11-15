"use client";
const Button = ({
  children,
  className,
  variant = "secondary",
  icon,
  onClick,
}) => {
  const variantClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-primary",
  };

  return (
    <button
      className={`${className} gap-2 h-fit w-fit active:scale-90 hover:scale-98 transition-all hover:opacity-90 duration-300 flex items-center justify-center cursor-pointer px-[28px] py-[16px] rounded-full ${variantClasses[variant]}`}
      onClick={onClick}
    >
      {children}
      {icon && <i className={`${icon} fa-solid`}></i>}
    </button>
  );
};

export default Button;
