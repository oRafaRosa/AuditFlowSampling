import React, { useState, useEffect } from 'react';
import logo from '../assets/AuditFlowLogoLight.png';



const HamburgerIcon = () => (
    <svg className="h-6 w-6 text-gray-600 hover:text-[#0033C6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6 text-white hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const menuLinks = [
    { name: 'Sistema de Auditoria Interna', href: 'https://viavarejo.sharepoint.com/sites/SISTEMADEAUDITORIAINTERNA/SitePages/TrainingHome.aspx?xsdata=MDV8MDJ8fDYxOTYzYWJiYTU0NzRhZjE1NjE0MDhkY2NiOTJkNDRhfDVhODZiM2ZiNDIxMzQ5Y2RiNGQ2YmU5MTQ4MmFkM2MwfDB8MHw2Mzg2MDkwNzg2NjcwNzMwNDR8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKV0lqb2lNQzR3TGpBd01EQWlMQ0pRSWpvaVYybHVNeklpTENKQlRpSTZJazkwYUdWeUlpd2lWMVFpT2pFeGZRPT18MXxMMk5vWVhSekx6RTVPalUyWVdNeVlXUTRMVEJtWm1ZdE5EUTRZaTA0WkRReUxUTTJORFpsTmpJMk5qTTVZVjlpWVRnNFl6YzNOUzB4WW1FeExUUmhObUV0T0RJMU1DMHdZak00TUdJMU1qaGpNV1JBZFc1eExtZGliQzV6Y0dGalpYTXZiV1Z6YzJGblpYTXZNVGN5TlRNeE1UQTJOVGd5TUE9PXwwNjgwYjg3MDNmOGY0ODY0NTYxNDA4ZGNjYjkyZDQ0YXxiYjc1MzM4NGJiODM0MzE4YjQ4OGM4ODY3MDJhZGQ2Mw%3D%3D&sdata=TWlqS2IyeXF0VnRuTHJEcTBTTlBuYkw2cld0ZmRMWDJHbVBnYm00dEo2VT0%3D&ovuser=5a86b3fb-4213-49cd-b4d6-be91482ad3c0%2Crafael.rosa%40viavarejo.com.br&OR=Teams-HL&CT=1725311082502&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiI0OS8yNDA3MTEyODgyNSIsIkhhc0ZlZGVyYXRlZFVzZXIiOmZhbHNlfQ%3D%3D' },
    { name: 'Paineis PowerBI', href: 'https://app.powerbi.com/groups/d536ee2a-48f3-4ef5-8509-eb14eb2b4474/list?ctid=5a86b3fb-4213-49cd-b4d6-be91482ad3c0&experience=power-bi' },
    { name: 'Metodologia', href: 'https://viavarejo.sharepoint.com/sites/AuditoriaInternaVIA/Documentos%20Compartilhados/Forms/AllItems.aspx?id=%2Fsites%2FAuditoriaInternaVIA%2FDocumentos%20Compartilhados%2FGeneral%2F04%2E%20Metodologia%20de%20auditoria%20e%20pol%C3%ADticas&p=true&ga=1' },
    { name: 'Trabalhos', href: 'https://viavarejo.sharepoint.com/sites/SISTEMADEAUDITORIAINTERNA/Lists/TRABALHOS/AllItems.aspx' },
    { name: 'Apontamentos', href: 'https://viavarejo.sharepoint.com/sites/SISTEMADEAUDITORIAINTERNA/Lists/11/AllItems.aspx' },
    { name: 'Planos de Ação', href: 'https://viavarejo.sharepoint.com/sites/SISTEMADEAUDITORIAINTERNA/Lists/CadastraPlano_Auditor/AllItems.aspx' },
];

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);


    return (
        <>
            <header className="w-full p-0 fixed top-0 left-0 right-0 z-20">
                <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-20 relative">
                    {/* Left: Hamburger Menu Button */}
                    <div className="pl-4">
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0033C6]"
                            aria-label="Abrir menu"
                        >
                            <HamburgerIcon />
                        </button>
                    </div>

                    {/* Center: Logo */}
                    <div className="absolute left-20 top-1/2 transform -translate-y-1/2">
                         <img className="h-20" src={logo} alt="Logo AuditFlow" />
                    </div>

                    {/* Right: Department Name */}
                    <div className="pr-4 hidden md:block">
                        <span className="text-gray-800 font-semibold text-sm md:text-base">Auditoria Interna do Grupo Casas Bahia</span>
                    </div>
                </div>
            </header>

            {/* Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 z-20 transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar Menu */}
            <div
                className={`fixed top-0 left-0 h-full bg-[#002349] text-white w-72 p-6 z-30 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="menu-heading"
            >
                <div className="flex justify-between items-center mb-10">
                    <h2 id="menu-heading" className="text-xl font-bold text-white">Menu</h2>
                    <button 
                        onClick={() => setIsMenuOpen(false)} 
                        className="p-1 rounded-full hover:bg-white/20"
                        aria-label="Fechar menu"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <nav>
                    <ul className="space-y-4">
                        {menuLinks.map((link) => (
                            <li key={link.name}>
                                <a 
                                    href={link.href} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-md text-lg hover:bg-white/10 transition-colors duration-200"
                                >
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default Header;
