import React, { createContext, useContext, useEffect, useState } from 'react';


// Firebase imports removed


const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // Auth is now handled by Store.jsx and localStorage
    // This context remains to avoid breaking imports in App.jsx but is largely a pass-through
    // or can be used for global UI loading states if needed.

    // For now, immediately render children.
    return (
        <AuthContext.Provider value={{ currentUser: null, loading: false }}>
            {children}
        </AuthContext.Provider>
    );
}
