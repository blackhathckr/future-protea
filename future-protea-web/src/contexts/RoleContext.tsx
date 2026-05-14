import * as React from 'react';

export type UserRole = 'admin';

interface RoleContextType {
  role: UserRole;
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ role: 'admin' as const }), []);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = React.useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
