import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const TransferContext = createContext(null);

export function TransferProvider({
  children,
  initialTransfer = null,
}) {
  const [selectedTransfer, setSelectedTransfer] =
    useState(initialTransfer);

  const selectTransfer = useCallback((transfer) => {
    setSelectedTransfer(transfer || null);
  }, []);

  const clearSelectedTransfer = useCallback(() => {
    setSelectedTransfer(null);
  }, []);

  const updateSelectedTransfer = useCallback(
    (updates) => {
      setSelectedTransfer((currentTransfer) => {
        if (!currentTransfer) {
          return currentTransfer;
        }

        const resolvedUpdates =
          typeof updates === "function"
            ? updates(currentTransfer)
            : updates;

        return {
          ...currentTransfer,
          ...resolvedUpdates,
        };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      selectedTransfer,
      hasSelectedTransfer: Boolean(selectedTransfer),
      setSelectedTransfer,
      selectTransfer,
      clearSelectedTransfer,
      updateSelectedTransfer,
    }),
    [
      selectedTransfer,
      selectTransfer,
      clearSelectedTransfer,
      updateSelectedTransfer,
    ],
  );

  return (
    <TransferContext.Provider value={value}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransferContext() {
  const context = useContext(TransferContext);

  if (!context) {
    throw new Error(
      "useTransferContext, TransferProvider içinde kullanılmalıdır.",
    );
  }

  return context;
}
