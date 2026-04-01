import { createContext, useContext as useReactContext } from "react";

export function createReactContext<T>(name: string) {
  const context = createContext<T | undefined>(undefined);
  context.displayName = `${name}Context`;

  function useContextValue() {
    const contextValue = useReactContext(context);
    if (contextValue === undefined) {
      throw new Error(`use${name} must be used within ${name}Provider`);
    }
    return contextValue;
  }

  return [useContextValue, context.Provider, context] as const;
}
