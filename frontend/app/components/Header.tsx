import React from "react";

interface HeaderProps {
  children?: React.ReactNode; // Allows variable components inside Header
  items?: React.ReactNode[]; // Supports passing an array of elements
}

const Header: React.FC<HeaderProps> = ({ children, items = [] }) => {
  return (
    <header className="flex justify-between items-center bg-blue-300 to-gray-200 p-2 shadow-lg">
        {children}
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
    </header>
  );
};

export default Header;
