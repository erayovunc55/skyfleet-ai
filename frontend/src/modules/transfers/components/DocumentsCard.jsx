import { Card } from "../../../components/ui";
import { useLanguage } from "../../../i18n";

const TEXT = {
  tr: { title: "Belgeler", subtitle: "Kanıt Merkezi" },
  en: { title: "Documents", subtitle: "Evidence Center" },
  ar: { title: "المستندات", subtitle: "مركز الأدلة" },
  es: { title: "Documentos", subtitle: "Centro de evidencias" },
};

export default function DocumentsCard() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  return (
    <Card title={text.title} subtitle={text.subtitle}>
      <div className="document-placeholder">📸 Meet & Greet</div>
      <div className="document-placeholder">📞 Call Log</div>
      <div className="document-placeholder">📍 GPS Track</div>
      <div className="document-placeholder">🧾 Voucher</div>
    </Card>
  );
}
