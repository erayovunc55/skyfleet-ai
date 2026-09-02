import {
  useEffect,
  useState,
} from "react";

import transferService from "../services/transferService";

export function EditTransferModal({
  transfer,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(
    createFormState(transfer),
  );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setForm(
      createFormState(transfer),
    );

    setError("");
  }, [transfer]);

  if (!transfer) {
    return null;
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

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
      const payload = {
        supplier:
          form.supplier.trim(),

        passenger_name:
          form.passenger_name.trim(),

        passenger_phone:
          nullableText(
            form.passenger_phone,
          ),

        passenger_email:
          nullableText(
            form.passenger_email,
          ),

        flight_number:
          nullableText(
            form.flight_number,
          ),

        airline:
          nullableText(
            form.airline,
          ),

        terminal:
          nullableText(
            form.terminal,
          ),

        pickup:
          form.pickup.trim(),

        dropoff:
          form.dropoff.trim(),

        pickup_time:
          toIsoDate(
            form.pickup_time,
          ),

        meet_point:
          nullableText(
            form.meet_point,
          ),

        passenger_note:
          nullableText(
            form.passenger_note,
          ),

        driver_note:
          nullableText(
            form.driver_note,
          ),

        adult:
          toInteger(
            form.adult,
          ),

        child:
          toInteger(
            form.child,
          ),

        baby:
          toInteger(
            form.baby,
          ),

        luggage_count:
          toInteger(
            form.luggage_count,
          ),

        vehicle_type:
          nullableText(
            form.vehicle_type,
          ),

        price:
          toNumber(
            form.price,
          ),

        currency:
          form.currency,
      };

      const updatedTransfer =
        await transferService
          .updateDispatcherTransfer(
            transfer.id,
            payload,
          );

      onSaved?.(
        updatedTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer güncellenemedi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="transfer-management-modal-backdrop"
      role="presentation"
    >
      <section
        className="transfer-management-modal transfer-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transfer-title"
      >
        <header className="transfer-management-modal-header">
          <div>
            <span>TRANSFER YÖNETİMİ</span>

            <h2 id="edit-transfer-title">
              Transferi Düzenle
            </h2>

            <p>
              {transfer.booking_reference}
            </p>
          </div>

          <button
            type="button"
            aria-label="Pencereyi kapat"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </header>

        <form
          className="transfer-edit-form"
          onSubmit={handleSubmit}
        >
          <div className="transfer-edit-form-body">
            <fieldset>
              <legend>
                Rezervasyon
              </legend>

              <div className="transfer-edit-grid">
                <FormField
                  label="Tedarikçi"
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Alış Tarihi ve Saati"
                  name="pickup_time"
                  type="datetime-local"
                  value={form.pickup_time}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Uçuş Numarası"
                  name="flight_number"
                  value={form.flight_number}
                  onChange={handleChange}
                />

                <FormField
                  label="Havayolu"
                  name="airline"
                  value={form.airline}
                  onChange={handleChange}
                />

                <FormField
                  label="Terminal"
                  name="terminal"
                  value={form.terminal}
                  onChange={handleChange}
                />

                <FormField
                  label="Araç Türü"
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Yolcu Bilgileri
              </legend>

              <div className="transfer-edit-grid">
                <FormField
                  label="Ad Soyad"
                  name="passenger_name"
                  value={form.passenger_name}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Telefon"
                  name="passenger_phone"
                  value={form.passenger_phone}
                  onChange={handleChange}
                />

                <FormField
                  label="E-posta"
                  name="passenger_email"
                  type="email"
                  value={form.passenger_email}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Güzergâh
              </legend>

              <div className="transfer-edit-grid transfer-edit-grid-single">
                <FormField
                  label="Alış Adresi"
                  name="pickup"
                  value={form.pickup}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Bırakış Adresi"
                  name="dropoff"
                  value={form.dropoff}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Buluşma Noktası"
                  name="meet_point"
                  value={form.meet_point}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Yolcu ve Bagaj Sayıları
              </legend>

              <div className="transfer-edit-grid transfer-edit-count-grid">
                <FormField
                  label="Yetişkin"
                  name="adult"
                  type="number"
                  min="0"
                  value={form.adult}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Çocuk"
                  name="child"
                  type="number"
                  min="0"
                  value={form.child}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Bebek"
                  name="baby"
                  type="number"
                  min="0"
                  value={form.baby}
                  onChange={handleChange}
                  required
                />

                <FormField
                  label="Bagaj"
                  name="luggage_count"
                  type="number"
                  min="0"
                  value={form.luggage_count}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Fiyat
              </legend>

              <div className="transfer-edit-grid transfer-edit-price-grid">
                <FormField
                  label="Tutar"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                />

                <label className="transfer-edit-field">
                  <span>
                    Para Birimi
                  </span>

                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                  >
                    <option value="EUR">
                      EUR
                    </option>

                    <option value="USD">
                      USD
                    </option>

                    <option value="GBP">
                      GBP
                    </option>

                    <option value="TRY">
                      TRY
                    </option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>
                Notlar
              </legend>

              <div className="transfer-edit-grid">
                <TextAreaField
                  label="Yolcu Notu"
                  name="passenger_note"
                  value={form.passenger_note}
                  onChange={handleChange}
                />

                <TextAreaField
                  label="Sürücü Notu"
                  name="driver_note"
                  value={form.driver_note}
                  onChange={handleChange}
                />
              </div>
            </fieldset>

            {error && (
              <div className="transfer-management-form-error">
                {error}
              </div>
            )}
          </div>

          <footer className="transfer-management-modal-footer">
            <button
              type="button"
              className="transfer-modal-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="transfer-modal-primary-button"
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function CancelTransferModal({
  transfer,
  onClose,
  onCancelled,
}) {
  const [reason, setReason] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  if (!transfer) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const cancelledTransfer =
        await transferService
          .cancelDispatcherTransfer(
            transfer.id,
            reason,
          );

      onCancelled?.(
        cancelledTransfer,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Transfer iptal edilemedi.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="transfer-management-modal-backdrop"
      role="presentation"
    >
      <section
        className="transfer-management-modal transfer-cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-transfer-title"
      >
        <header className="transfer-management-modal-header">
          <div>
            <span>KRİTİK İŞLEM</span>

            <h2 id="cancel-transfer-title">
              Transferi İptal Et
            </h2>

            <p>
              {transfer.booking_reference}
            </p>
          </div>

          <button
            type="button"
            aria-label="Pencereyi kapat"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="transfer-cancel-body">
            <div className="transfer-cancel-warning">
              <strong>
                Bu transfer iptal durumuna
                alınacak.
              </strong>

              <p>
                Sürücü ataması kaldırılacak ancak
                rezervasyon ve operasyon kayıtları
                sistemde korunacaktır.
              </p>
            </div>

            <TextAreaField
              label="İptal Nedeni"
              name="reason"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value,
                )
              }
              placeholder="İptal nedenini en az 10 karakterle açıklayın..."
              required
              minLength={10}
            />

            {error && (
              <div className="transfer-management-form-error">
                {error}
              </div>
            )}
          </div>

          <footer className="transfer-management-modal-footer">
            <button
              type="button"
              className="transfer-modal-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="transfer-modal-danger-button"
              disabled={
                saving ||
                reason.trim().length < 10
              }
            >
              {saving
                ? "İptal Ediliyor..."
                : "Transferi İptal Et"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function FormField({
  label,
  ...inputProps
}) {
  return (
    <label className="transfer-edit-field">
      <span>{label}</span>

      <input {...inputProps} />
    </label>
  );
}

function TextAreaField({
  label,
  ...textAreaProps
}) {
  return (
    <label className="transfer-edit-field">
      <span>{label}</span>

      <textarea
        rows="4"
        {...textAreaProps}
      />
    </label>
  );
}

function createFormState(
  transfer,
) {
  return {
    supplier:
      transfer?.supplier || "",

    passenger_name:
      transfer?.passenger_name || "",

    passenger_phone:
      transfer?.passenger_phone || "",

    passenger_email:
      transfer?.passenger_email || "",

    flight_number:
      transfer?.flight_number || "",

    airline:
      transfer?.airline || "",

    terminal:
      transfer?.terminal || "",

    pickup:
      transfer?.pickup || "",

    dropoff:
      transfer?.dropoff || "",

    pickup_time:
      toDateTimeLocal(
        transfer?.pickup_time,
      ),

    meet_point:
      transfer?.meet_point || "",

    passenger_note:
      transfer?.passenger_note || "",

    driver_note:
      transfer?.driver_note || "",

    adult:
      transfer?.adult ?? 1,

    child:
      transfer?.child ?? 0,

    baby:
      transfer?.baby ?? 0,

    luggage_count:
      transfer?.luggage_count ?? 0,

    vehicle_type:
      transfer?.vehicle_type || "",

    price:
      transfer?.price ?? 0,

    currency:
      transfer?.currency || "EUR",
  };
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function toIsoDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Geçerli bir alış tarihi ve saati seçmelisiniz.",
    );
  }

  return date.toISOString();
}

function nullableText(value) {
  const resolved =
    String(value || "").trim();

  return resolved || null;
}

function toInteger(value) {
  const resolved =
    Number.parseInt(value, 10);

  return Number.isFinite(resolved)
    ? resolved
    : 0;
}

function toNumber(value) {
  const resolved =
    Number.parseFloat(value);

  return Number.isFinite(resolved)
    ? resolved
    : 0;
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response?.data?.errors;

  if (
    validationErrors &&
    typeof validationErrors ===
      "object"
  ) {
    const firstError =
      Object.values(
        validationErrors,
      )
        .flat()
        .find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}