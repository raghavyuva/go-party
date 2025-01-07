import React from "react";
import use_actions from "./use_actions";

export const ActionsContext = React.createContext<ReturnType<typeof use_actions> | null>(null);

export function ActionsProvider({ children }: { children: React.ReactNode }) {
    const actions = use_actions();
    return (
        <ActionsContext.Provider value={actions}>
            {children}
        </ActionsContext.Provider>
    );
}

export function useActions() {
    const context = React.useContext(ActionsContext);
    if (context === null) {
        throw new Error('useActions must be used within ActionsProvider');
    }
    return context;
}