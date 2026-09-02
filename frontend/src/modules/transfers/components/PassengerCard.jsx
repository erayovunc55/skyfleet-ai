import { Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";

const TEXT = {
  tr: { title: "Yolcu", subtitle: "Yolcu bilgileri", name: "Ad Soyad", phone: "Telefon", email: "E-posta", adult: "Yetişkin", child: "Çocuk", baby: "Bebek", luggage: "Bagaj", missing: "Belirtilmedi" },
  en: { title: "Passenger", subtitle: "Passenger information", name: "Full Name", phone: "Phone", email: "Email", adult: "Adults", child: "Children", baby: "Infants", luggage: "Luggage", missing: "Not provided" },
  ar: { title: "الراكب", subtitle: "معلومات الراكب", name: "الاسم الكامل", phone: "الهاتف", email: "البريد الإلكتروني", adult: "البالغون", child: "الأطفال", baby: "الرضع", luggage: "الأمتعة", missing: "غير محدد" },
  es: { title: "Pasajero", subtitle: "Información del pasajero", name: "Nombre completo", phone: "Teléfono", email: "Correo", adult: "Adultos", child: "Niños", baby: "Bebés", luggage: "Equipaje", missing: "No indicado" },
};

export default function PassengerCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;
  const { selectedTransfer } = useTransfer();
  if (!selectedTransfer) return null;
  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <Row label={text.name} value={selectedTransfer.passenger_name || text.missing} />
      <Row label={text.phone} value={selectedTransfer.passenger_phone || text.missing} />
      <Row label={text.email} value={selectedTransfer.passenger_email || text.missing} />
      <Row label={text.adult} value={Number(selectedTransfer.adult || 0)} />
      <Row label={text.child} value={Number(selectedTransfer.child || 0)} />
      <Row label={text.baby} value={Number(selectedTransfer.baby || 0)} />
      <Row label={text.luggage} value={Number(selectedTransfer.luggage_count || 0)} />
    </Card>
  );
}

function Row({ label, value }) { return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>; }
