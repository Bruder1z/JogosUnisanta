import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    toggle: () => { },
    close: () => { },
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <SidebarContext.Provider value={{
            isOpen,
            toggle: () => setIsOpen(v => !v),
            close: () => setIsOpen(false),
        }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);
