import Link from "next/link";

const Listitem = ({ children, className, href }) => {
  return (
    <Link href={href}
      className={`   transition-all duration-300 hover:rounded-[8px] flex gap-2 items-center w-full text-left  cursor-pointer ${className}`}
    >
      {children}
    </Link>
  );
};

export default Listitem;
