import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PortalSplitPresetContextValue {
  navigationRoot: HTMLDivElement | null;
  detailRoot: HTMLDivElement | null;
  setNavigationRoot: (node: HTMLDivElement | null) => void;
  setDetailRoot: (node: HTMLDivElement | null) => void;
  detailContentCount: number;
  registerDetailContent: () => () => void;
}

const PortalSplitPresetContext =
  createContext<PortalSplitPresetContextValue | null>(null);

export function PortalSplitPresetContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [navigationRoot, setNavigationRoot] = useState<HTMLDivElement | null>(null);
  const [detailRoot, setDetailRoot] = useState<HTMLDivElement | null>(null);
  const [detailContentCount, setDetailContentCount] = useState(0);

  const registerDetailContent = useCallback(() => {
    setDetailContentCount((count) => count + 1);

    return () => {
      setDetailContentCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const value = useMemo(
    () => ({
      navigationRoot,
      detailRoot,
      setNavigationRoot,
      setDetailRoot,
      detailContentCount,
      registerDetailContent,
    }),
    [
      navigationRoot,
      detailRoot,
      detailContentCount,
      registerDetailContent,
    ],
  );

  return (
    <PortalSplitPresetContext.Provider value={value}>
      {children}
    </PortalSplitPresetContext.Provider>
  );
}

export function usePortalSplitPresetContext() {
  return useContext(PortalSplitPresetContext);
}