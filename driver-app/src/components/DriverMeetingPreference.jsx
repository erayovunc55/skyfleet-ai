import { useEffect, useState } from "react";
import transferService from "../services/transferService";
import { useLanguage } from "../i18n";

export default function DriverMeetingPreference() {
  const { t } = useLanguage();
  const [value, setValue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    transferService.getMeetingPreference().then((data) => {
      if (active) setValue(data.opted_in);
    }).catch((failure) => {
      if (active) setError(failure.response?.data?.message || t("WhatsApp tercihi yüklenemedi."));
    });
    return () => { active = false; };
  }, [t]);
  return <section style={{ padding: "16px", marginTop: "16px", border: "1px solid #bba56d", borderRadius: "12px" }}>
    <strong>{t("WhatsApp buluşma bildirimleri")}</strong>
    <p>{t("Yolcunun onayladığı buluşma notlarını kayıtlı telefonuma WhatsApp üzerinden almayı kabul ediyorum. İznimi buradan kaldırabilirim. Meta onayı tamamlanmadan mesaj gönderilmez.")}</p>
    <label><input type="checkbox" checked={value === true} disabled={busy || value === null} onChange={async (event) => {
      setBusy(true);
      setError("");
      try {
        const data = await transferService.setMeetingPreference(event.target.checked);
        setValue(data.opted_in);
      } catch (failure) {
        setError(failure.response?.data?.message || t("WhatsApp tercihi kaydedilemedi."));
      } finally { setBusy(false); }
    }} /> {t("WhatsApp bildirimlerine izin ver")}</label>
    {error && <p role="alert">{error}</p>}
  </section>;
}
