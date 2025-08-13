import React from 'react';
import logo from './assets/AuditFlowLogoLight.png';


const Header = () => {
  return (
    <header className="w-full bg-white shadow-md p-4 fixed top-0 left-0 right-0 z-20">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-shrink-0">
            {/* The user will provide the logo file in the assets folder */}
            <img className="h-8 md:h-10" src={logo} alt="Logo" />
          </div>
          <div>
            <span className="text-gray-800 font-semibold text-sm md:text-base">Auditoria Interna do Grupo Casas Bahia</span>
          </div>
      </div>
    </header>
  );
};

export default Header;
