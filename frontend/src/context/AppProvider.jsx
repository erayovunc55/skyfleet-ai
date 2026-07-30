import { TransferProvider } from "../modules/transfers/context/TransferContext";

export default function AppProvider({
  children,
}) {
  return (
    <TransferProvider>
      {children}
    </TransferProvider>
  );
}