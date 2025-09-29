import React from "react";

interface HeaderProps {
  children?: React.ReactNode;
  items?: React.ReactNode[];
}

const Header: React.FC<HeaderProps> = ({ children, items = [] }) => {
  return (
    <header className="relative flex items-center justify-between h-14 px-4 md:px-6 theme-panel theme-border shadow-sm">
      {children}
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      <div className="pointer-events-none absolute inset-0 rounded-none bg-gradient-to-b from-white/20 via-transparent to-transparent" />
    </header>
  );
};

export default Header;
