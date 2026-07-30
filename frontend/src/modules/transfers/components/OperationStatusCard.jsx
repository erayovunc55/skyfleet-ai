import { useEffect, useState } from "react";

import {
  Button,
  Card,
  StatusBadge,
} from "../../../components/ui";

import apiClient from "../../../services/apiClient";
import useTransfer from "../hooks/useTransfer";

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Bekliyor",
  },
  {
    value: "accepted",
    label: "Kabul Edildi",
  },
  {
    value: "on_the_way",
    label: "Yola Çıkıldı",
  },
  {
    value: "arrived",
    label: "Alış Noktasında",
  },
  {
    value: "passenger_called",
    label: "Yolcu Arandı",
  },
  {
    value: "passenger_on_board",
    label: "Yolcu Geldi",
  },
  {
    value: "trip_started",
    label: "Yolculuk Başladı",
  },
  {
    value: "completed",
    label: "Tamamlandı",
  },
  {
    value: "no_show",
    label: "No Show",
  },
  {
    value: "cancelled",
    label: "İptal Edildi",
  },
];

export default function OperationStatusCard() {
  const {
    selectedTransfer,
    updateSelectedTransfer,
  } = useTransfer();

  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStatus(selectedTransfer?.status || "");
    setNote("");
    setError("");
    setMessage("");
  }, [selectedTransfer?.id]);

  if (!selectedTransfer) {
    return null;
  }

  const statusChanged =
    status !== selectedTransfer.status;

  async function handleSave() {
    if (!status) {
      setError("Lütfen bir operasyon durumu seçin.");
      return;
    }

    if (
      status === selectedTransfer.status &&
      !note.trim()
    ) {
      setError(
        "Durum değişmedi. Not ekleyin veya farklı bir durum seçin.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.patch(
        `/transfers/${selectedTransfer.id}/status`,
        {
          status,
          note: note.trim() || null,
        },
      );

      const updatedTransfer =
        response.data?.data || {};

      updateSelectedTransfer(
        updatedTransfer,
      );

      setMessage(
        response.data?.message ||
          "Transfer durumu güncellendi.",
      );

      setNote("");
    } catch (requestError) {
      const validationErrors =
        requestError?.response?.data?.errors;

      const firstValidationError =
        validationErrors
          ? Object.values(validationErrors)
              .flat()
              .find(Boolean)
          : null;

      setError(
        firstValidationError ||
          requestError?.response?.data?.message ||
          "Transfer durumu güncellenemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Operasyon Durumu"
      subtitle="Transfer akışını yönetin"
      actions={
        <StatusBadge
          status={selectedTransfer.status}
        />
      }
    >
      <div className="operation-status-current">
        <span>Mevcut Durum</span>

        <strong>
          {getStatusLabel(
            selectedTransfer.status,
          )}
        </strong>
      </div>

      <div className="operation-status-field">
        <label htmlFor="operation-status">
          Yeni Durum
        </label>

        <select
          id="operation-status"
          value={status}
          disabled={saving}
          onChange={(event) => {
            setStatus(event.target.value);
            setError("");
            setMessage("");
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="operation-status-field">
        <label htmlFor="operation-status-note">
          Dispatcher Notu
        </label>

        <textarea
          id="operation-status-note"
          rows="4"
          value={note}
          disabled={saving}
          placeholder="Durum değişikliğiyle ilgili açıklama ekleyin..."
          onChange={(event) => {
            setNote(event.target.value);
            setError("");
            setMessage("");
          }}
        />
      </div>

      {statusChanged && (
        <div className="operation-status-change">
          <span>
            {getStatusLabel(
              selectedTransfer.status,
            )}
          </span>

          <strong>→</strong>

          <span>
            {getStatusLabel(status)}
          </span>
        </div>
      )}

      {error && (
        <div className="assignment-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="assignment-message success">
          {message}
        </div>
      )}

      <Button
        variant={
          status === "cancelled" ||
          status === "no_show"
            ? "danger"
            : status === "completed"
              ? "success"
              : "primary"
        }
        loading={saving}
        onClick={handleSave}
      >
        Durumu Güncelle
      </Button>
    </Card>
  );
}

function getStatusLabel(status) {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label ||
    status ||
    "Bilinmiyor"
  );
}