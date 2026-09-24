import { createContext, useContext } from 'react';

export type PreviewViewport = 'mobile' | 'desktop';

const PreviewViewportContext = createContext<PreviewViewport | null>(null);

export function PreviewViewportProvider({
  value,
  children,
}: {
  value: PreviewViewport;
  children: React.ReactNode;
}) {
  return (
    <PreviewViewportContext.Provider value={value}>
      {children}
    </PreviewViewportContext.Provider>
  );
}

export function usePreviewViewport(): PreviewViewport | null {
  return useContext(PreviewViewportContext);
}

/** True inside the admin phone-frame preview (375px), not the browser viewport. */
export function useIsCompactPreview(): boolean {
  return usePreviewViewport() === 'mobile';
}
