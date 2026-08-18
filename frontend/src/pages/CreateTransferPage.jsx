import { useEffect, useState } from "react";
import transferService from "../modules/transfers/services/transferService";

const INITIAL_FORM = {
  supplier: "Skytrip Transfer",
  booking_reference: "",
  passenger_name: "",
  passenger_phone: "",
  passenger_email: "",
  flight_number: "",
  pickup: "",
  dropoff: "",
  pickup_time: "",
  vehicle_type: "",
  driver_id: "",
  adult: "1",
  child: "0",
  baby: "0",
  luggage_count: "0",
  price: "",
  currency: "EUR",
  passenger_note: "",
};

export default function CreateTransferPage({
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDrivers() {
      try {
        const items = await transferService.getDrivers();
        setDrivers(items.filter((driver) => driver.is_active));
      } catch (requestError) {
        setError(getErrorMessage(
          requestError,
          "Sürücüler yüklenemedi.",
        ));
      } finally {
        setLoadingDrivers(false);
      }
    }

    loadDrivers();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response =
        await transferService.createDispatcherTransfer({
          supplier: form.supplier.trim(),
          booking_reference:
            emptyToNull(form.booking_reference),
          passenger_name: form.passenger_name.trim(),
          passenger_phone:
            emptyToNull(form.passenger_phone),
          passenger_email:
            emptyToNull(form.passenger_email),
          flight_number:
            emptyToNull(form.flight_number),
          pickup: form.pickup.trim(),
          dropoff: form.dropoff.trim(),
          pickup_time:
            new Date(form.pickup_time).toISOString(),
          vehicle_type:
            emptyToNull(form.vehicle_type),
          driver_id: form.driver_id
            ? Number(form.driver_id)
            : null,
          adult: numberOrZero(form.adult),
          child: numberOrZero(form.child),
          baby: numberOrZero(form.baby),
          luggage_count:
            numberOrZero(form.luggage_count),
          price: form.price === ""
            ? null
            : Number(form.price),
          currency: form.currency || "EUR",
          passenger_note:
            emptyToNull(form.passenger_note),
        });

      window.alert(
        response?.message ||
          "Transfer başarıyla oluşturuldu.",
      );

      onCreated?.(response?.data);
    } catch (requestError) {
      setError(getErrorMessage(
        requestError,
        "Transfer oluşturulamadı.",
      ));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={styles.page}>
      <div style={styles.heading}>
        <div>
          <span style={styles.eyebrow}>OPERASYON</span>
          <h1 style={styles.title}>Yeni Transfer</h1>
          <p style={styles.description}>
            Rezervasyonu kaydedin ve isterseniz doğrudan sürücüye atayın.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          disabled={saving}
          onClick={onCancel}
        >
          Vazgeç
        </button>
      </div>

      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.grid}>
          <Field label="Tedarikçi *">
            <input required name="supplier" value={form.supplier} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Rezervasyon No">
            <input name="booking_reference" value={form.booking_reference} onChange={updateField} placeholder="Boşsa otomatik oluşturulur" style={styles.input} />
          </Field>

          <Field label="Yolcu Adı *">
            <input required name="passenger_name" value={form.passenger_name} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Yolcu Telefonu">
            <input name="passenger_phone" value={form.passenger_phone} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Yolcu E-postası">
            <input type="email" name="passenger_email" value={form.passenger_email} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Uçuş Numarası">
            <input name="flight_number" value={form.flight_number} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Alış Adresi *" wide>
            <input required name="pickup" value={form.pickup} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Varış Adresi *" wide>
            <input required name="dropoff" value={form.dropoff} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Alış Tarihi ve Saati *">
            <input required type="datetime-local" name="pickup_time" value={form.pickup_time} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Araç Tipi">
            <input name="vehicle_type" value={form.vehicle_type} onChange={updateField} placeholder="Örn. Mercedes Vito" style={styles.input} />
          </Field>

          <Field label="Sürücü">
            <select name="driver_id" value={form.driver_id} onChange={updateField} disabled={loadingDrivers} style={styles.input}>
              <option value="">Atama yapmadan oluştur</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}{driver.vehicle_plate ? ` · ${driver.vehicle_plate}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Para Birimi">
            <select name="currency" value={form.currency} onChange={updateField} style={styles.input}>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </Field>

          <Field label="Yetişkin">
            <input min="0" type="number" name="adult" value={form.adult} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Çocuk">
            <input min="0" type="number" name="child" value={form.child} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Bebek">
            <input min="0" type="number" name="baby" value={form.baby} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Bagaj">
            <input min="0" type="number" name="luggage_count" value={form.luggage_count} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Fiyat">
            <input min="0" step="0.01" type="number" name="price" value={form.price} onChange={updateField} style={styles.input} />
          </Field>

          <Field label="Yolcu Notu" wide>
            <textarea name="passenger_note" value={form.passenger_note} onChange={updateField} rows="4" style={{ ...styles.input, resize: "vertical" }} />
          </Field>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button type="button" style={styles.secondaryButton} disabled={saving} onClick={onCancel}>
            Vazgeç
          </button>
          <button type="submit" style={styles.primaryButton} disabled={saving || loadingDrivers}>
            {saving ? "Kaydediliyor..." : "Transferi Oluştur"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, wide = false, children }) {
  return (
    <label style={wide ? styles.wideField : styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function emptyToNull(value) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getErrorMessage(error, fallback) {
  const errors = error?.response?.data?.errors;
  const validationMessage = errors
    ? Object.values(errors).flat().find(Boolean)
    : null;

  return validationMessage ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;
}

const styles = {
  page: { padding: "4px 0 40px", color: "#f8fafc" },
  heading: { display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 22 },
  eyebrow: { color: "#38bdf8", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em" },
  title: { margin: "8px 0", fontSize: 30 },
  description: { margin: 0, color: "#94a3b8" },
  card: { padding: 24, border: "1px solid #1e293b", borderRadius: 18, background: "#0f172a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  wideField: { display: "flex", flexDirection: "column", gap: 8, gridColumn: "1 / -1" },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", minHeight: 44, padding: "10px 12px", color: "#f8fafc", background: "#08111f", border: "1px solid #26354d", borderRadius: 10, font: "inherit" },
  error: { marginTop: 20, padding: 12, color: "#fecaca", background: "#3f1721", border: "1px solid #7f1d1d", borderRadius: 10 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 },
  primaryButton: { minHeight: 44, padding: "0 20px", color: "white", background: "#2563eb", border: 0, borderRadius: 10, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { minHeight: 44, padding: "0 18px", color: "#cbd5e1", background: "#111c2f", border: "1px solid #334155", borderRadius: 10, fontWeight: 700, cursor: "pointer" },
};
