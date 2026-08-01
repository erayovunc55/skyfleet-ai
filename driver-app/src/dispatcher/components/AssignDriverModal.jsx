import { useEffect, useState } from "react";
import "./assign-driver-modal.css";

export default function AssignDriverModal({
  open,
  transfer,
  drivers,
  isLoadingDrivers,
  driversError,
  onClose,
  onAssign,
}) {
  const [driverId, setDriverId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;

    setDriverId(transfer?.driverId ? String(transfer.driverId) : "");
    setSubmitError("");
    setIsSubmitting(false);
  }, [open, transfer]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (!driverId) {
      setSubmitError("Please select a driver.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onAssign(Number(driverId));
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Driver assignment failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="assign-driver-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className="assign-driver-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-driver-title"
      >
        <header className="assign-driver-header">
          <div>
            <p>Transfer Assignment</p>
            <h2 id="assign-driver-title">Assign Driver</h2>
          </div>

          <button
            type="button"
            className="assign-driver-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="assign-driver-transfer">
          <strong>{transfer?.passenger || "Transfer"}</strong>
          <span>{transfer?.voucher || "-"}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="assign-driver-field">
            <span>Driver</span>

            <select
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
              disabled={isLoadingDrivers || isSubmitting}
              required
            >
              <option value="">
                {isLoadingDrivers ? "Loading drivers..." : "Select a driver"}
              </option>

              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                  {driver.vehicle?.plate ? ` — ${driver.vehicle.plate}` : ""}
                </option>
              ))}
            </select>
          </label>

          {driversError && (
            <div className="assign-driver-error">{driversError}</div>
          )}

          {submitError && (
            <div className="assign-driver-error">{submitError}</div>
          )}

          {!isLoadingDrivers && !driversError && drivers.length === 0 && (
            <div className="assign-driver-empty">
              No active drivers are available.
            </div>
          )}

          <footer className="assign-driver-actions">
            <button
              type="button"
              className="assign-driver-button assign-driver-button-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="assign-driver-button assign-driver-button-primary"
              disabled={
                isSubmitting ||
                isLoadingDrivers ||
                Boolean(driversError) ||
                drivers.length === 0
              }
            >
              {isSubmitting ? "Assigning..." : "Assign Driver"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}