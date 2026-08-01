import { useMemo, useState } from "react";

const vehicleOptions = [
  "Sedan",
  "SUV",
  "Van",
  "Minibus",
];

const supplierOptions = [
  "SkyRide Logistics",
  "Prime Shuttle",
  "TravelCargo",
];

const initialFormState = {
  passengerName: "",
  passengerPhone: "",
  flightNumber: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupDate: "",
  pickupTime: "",
  supplier: "",
  driver: "",
  vehicleType: "",
  notes: "",
};

export default function NewTransferModal({
  open,
  onClose,
  onSave,
  drivers,
}) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const driverOptions = useMemo(
    () => drivers.map((driver) => driver.name),
    [drivers],
  );

  const fieldError = (field) => errors[field] || "";

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validate() {
    const nextErrors = {};
    const requiredFields = [
      "passengerName",
      "passengerPhone",
      "pickupLocation",
      "dropoffLocation",
      "pickupDate",
      "pickupTime",
      "supplier",
      "driver",
      "vehicleType",
    ];

    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (form.passengerPhone && !/^\+?[0-9\s-]{7,20}$/.test(form.passengerPhone)) {
      nextErrors.passengerPhone = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleClose() {
    if (isSaving) {
      return;
    }

    setForm(initialFormState);
    setErrors({});
    onClose();
  }

async function handleSubmit(event) {
  event.preventDefault();
  if (isSaving) {
    return;
  }

  if (!validate()) {
    return;
  }

  setIsSaving(true);

  // Map form fields to backend payload
  const payload = {
    supplier: form.supplier,
    passenger_name: form.passengerName.trim(),
    passenger_phone: form.passengerPhone.trim() || null,
    flight_number: form.flightNumber.trim() || null,
    pickup: form.pickupLocation.trim(),
    dropoff: form.dropoffLocation.trim(),
    pickup_time: form.pickupDate && form.pickupTime ? `${form.pickupDate} ${form.pickupTime}` : null,
    vehicle_type: form.vehicleType || null,
    passenger_note: form.notes.trim() || null,
  };

  // If drivers list contains an id, map driver selection to driver_id
  const matchedDriver = drivers.find((d) => d.name === form.driver);
  if (matchedDriver && matchedDriver.id) {
    payload.driver_id = matchedDriver.id;
  }

  try {
    // If parent provided onSave and it returns a promise, prefer that (allows parent to call API)
    if (typeof onSave === 'function') {
      const result = onSave(payload);
      if (result instanceof Promise) {
        await result;
      }
    } else if (window && window.apiClient) {
      await window.apiClient.post('dispatcher/transfers', payload);
    } else {
      throw new Error('No API client available');
    }

    // success: reset form and close
    setForm(initialFormState);
    setErrors({});
    onClose();
  } catch (err) {
    if (err?.response?.data?.errors) {
      const backendErrors = {};
      Object.entries(err.response.data.errors).forEach(([key, messages]) => {
        const map = {
          passenger_name: 'passengerName',
          passenger_phone: 'passengerPhone',
          pickup: 'pickupLocation',
          dropoff: 'dropoffLocation',
          pickup_time: 'pickupDate',
          supplier: 'supplier',
          driver_id: 'driver',
          vehicle_type: 'vehicleType',
        };
        const mapped = map[key] || key;
        backendErrors[mapped] = Array.isArray(messages) ? messages.join(' ') : messages;
      });
      setErrors(backendErrors);
    } else {
      setErrors({ general: 'Unable to save transfer. Please try again.' });
    }
  } finally {
    setIsSaving(false);
  }
}

if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="new-transfer-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p>New Transfer</p>
            <h2>Create a new dispatch transfer</h2>
          </div>
          <button type="button" className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-grid">
            <label className="modal-field">
              <span>Passenger Name</span>
              <input
                name="passengerName"
                value={form.passengerName}
                onChange={handleChange}
                placeholder="Enter passenger name"
              />
              {fieldError("passengerName") && (
                <small className="modal-error">{fieldError("passengerName")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Passenger Phone</span>
              <input
                name="passengerPhone"
                value={form.passengerPhone}
                onChange={handleChange}
                placeholder="+90 555 123 4567"
              />
              {fieldError("passengerPhone") && (
                <small className="modal-error">{fieldError("passengerPhone")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Flight Number</span>
              <input
                name="flightNumber"
                value={form.flightNumber}
                onChange={handleChange}
                placeholder="e.g. TK 176"
              />
            </label>

            <label className="modal-field">
              <span>Pickup Location</span>
              <input
                name="pickupLocation"
                value={form.pickupLocation}
                onChange={handleChange}
                placeholder="Enter pickup location"
              />
              {fieldError("pickupLocation") && (
                <small className="modal-error">{fieldError("pickupLocation")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Dropoff Location</span>
              <input
                name="dropoffLocation"
                value={form.dropoffLocation}
                onChange={handleChange}
                placeholder="Enter dropoff location"
              />
              {fieldError("dropoffLocation") && (
                <small className="modal-error">{fieldError("dropoffLocation")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Pickup Date</span>
              <input
                type="date"
                name="pickupDate"
                value={form.pickupDate}
                onChange={handleChange}
              />
              {fieldError("pickupDate") && (
                <small className="modal-error">{fieldError("pickupDate")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Pickup Time</span>
              <input
                type="time"
                name="pickupTime"
                value={form.pickupTime}
                onChange={handleChange}
              />
              {fieldError("pickupTime") && (
                <small className="modal-error">{fieldError("pickupTime")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Supplier</span>
              <select name="supplier" value={form.supplier} onChange={handleChange}>
                <option value="">Select supplier</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
              {fieldError("supplier") && (
                <small className="modal-error">{fieldError("supplier")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Driver</span>
              <select name="driver" value={form.driver} onChange={handleChange}>
                <option value="">Select driver</option>
                {driverOptions.map((driver) => (
                  <option key={driver} value={driver}>
                    {driver}
                  </option>
                ))}
              </select>
              {fieldError("driver") && (
                <small className="modal-error">{fieldError("driver")}</small>
              )}
            </label>

            <label className="modal-field">
              <span>Vehicle Type</span>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                <option value="">Select vehicle type</option>
                {vehicleOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {fieldError("vehicleType") && (
                <small className="modal-error">{fieldError("vehicleType")}</small>
              )}
            </label>

            <label className="modal-field modal-field-full">
              <span>Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add special instructions or pickup notes"
                rows={4}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-button modal-button-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="modal-button modal-button-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}








