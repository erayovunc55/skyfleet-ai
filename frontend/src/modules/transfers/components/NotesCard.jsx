import { Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: {
    title: "Operasyon Notları",
    subtitle: "Dispatcher ve Yolcu Notları",
    dispatcherNote: "Dispatcher Notu",
    noDispatcherNote: "Dispatcher notu bulunmuyor.",
    passengerNote: "Yolcu Notu",
    noPassengerNote: "Yolcu notu bulunmuyor.",
  },
  en: {
    title: "Operation Notes",
    subtitle: "Dispatcher and Passenger Notes",
    dispatcherNote: "Dispatcher Note",
    noDispatcherNote: "No dispatcher note available.",
    passengerNote: "Passenger Note",
    noPassengerNote: "No passenger note available.",
  },
  ar: {
    title: "ملاحظات العملية",
    subtitle: "ملاحظات المرسل والراكب",
    dispatcherNote: "ملاحظة المرسل",
    noDispatcherNote: "لا توجد ملاحظة من المرسل.",
    passengerNote: "ملاحظة الراكب",
    noPassengerNote: "لا توجد ملاحظة من الراكب.",
  },
  es: {
    title: "Notas de operación",
    subtitle: "Notas del despachador y del pasajero",
    dispatcherNote: "Nota del despachador",
    noDispatcherNote: "No hay nota del despachador.",
    passengerNote: "Nota del pasajero",
    noPassengerNote: "No hay nota del pasajero.",
  },
};

export default function NotesCard() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  if (!selectedTransfer) {
    return null;
  }

  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <div className="notes-box">
        <strong>{text.dispatcherNote}</strong>
        <p>{selectedTransfer.driver_note || text.noDispatcherNote}</p>
      </div>

      <div className="notes-box">
        <strong>{text.passengerNote}</strong>
        <p>{selectedTransfer.passenger_note || text.noPassengerNote}</p>
      </div>
    </Card>
  );
}
