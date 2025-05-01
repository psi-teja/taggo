import React from "react";

interface HeaderProps {
  children?: React.ReactNode; // Allows variable components inside Header
  items?: React.ReactNode[]; // Supports passing an array of elements
}

const Header: React.FC<HeaderProps> = ({ children, items = [] }) => {
  return (
    <header className="flex justify-between items-center p-2 shadow-md bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
      {children}
      {items.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
    </header>
  );
};

export default Header;
