import {
  useEffect,
  useState,
} from "react";

import transferService from "../services/transferService";

export default function TransferExcelImportModal({
  open,
  onClose,
  onImported,
}) {
  const [file, setFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError("");
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleFileChange(event) {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setError("");
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      extension !== "xls" &&
      extension !== "xlsx"
    ) {
      setFile(null);
      setError(
        "Yalnızca XLS veya XLSX dosyası yükleyebilirsiniz.",
      );

      event.target.value = "";
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setFile(null);
      setError(
        "Excel dosyası en fazla 10 MB olabilir.",
      );

      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError(
        "Lütfen HeyTrip Excel dosyasını seçin.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response =
        await transferService
          .importDispatcherTransfers(
            file,
          );

      setResult({
        message:
          response?.message ||
          "Excel aktarımı tamamlandı.",

        total:
          response?.data?.total ??
          0,

        imported:
          response?.data
            ?.imported ?? 0,

        skipped:
          response?.data
            ?.skipped ?? 0,

        failed:
          response?.data
            ?.failed ?? 0,

        errors: Array.isArray(
          response?.data?.errors,
        )
          ? response.data.errors
          : [],
      });

      await onImported?.();
    } catch (requestError) {
      const validationErrors =
        requestError?.response
          ?.data?.errors;

      const firstValidationError =
        validationErrors
          ? Object.values(
              validationErrors,
            )
              .flat()
              .find(Boolean)
          : null;

      setError(
        firstValidationError ||
        requestError?.response
          ?.data?.message ||
        requestError?.message ||
        "Excel dosyası aktarılamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="transfer-import-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <section
        className="transfer-import-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-import-title"
      >
        <header className="transfer-import-header">
          <div>
            <span>TOPLU AKTARIM</span>

            <h2 id="transfer-import-title">
              HeyTrip Excel Yükle
            </h2>

            <p>
              İleri tarihli rezervasyonları
              XLS veya XLSX dosyasından
              aktarın.
            </p>
          </div>

          <button
            className="transfer-import-close"
            type="button"
            onClick={onClose}
            aria-label="Pencereyi kapat"
          >
            ×
          </button>
        </header>

        <form
          className="transfer-import-form"
          onSubmit={handleSubmit}
        >
          <label
            className="transfer-import-file"
          >
            <span>Excel dosyası</span>

            <input
              type="file"
              accept=".xls,.xlsx"
              disabled={loading}
              onChange={
                handleFileChange
              }
            />

            <small>
              {file
                ? file.name
                : "En fazla 10 MB · XLS veya XLSX"}
            </small>
          </label>

          <div className="transfer-import-note">
            <strong>
              Aktarım kuralları
            </strong>

            <ul>
              <li>
                Her transfer için yeni bir
                SF rezervasyon numarası
                oluşturulur.
              </li>

              <li>
                HeyTrip sipariş numarası
                gizli olarak saklanır.
              </li>

              <li>
                Transferler sürücüsüz ve
                Bekliyor durumunda
                oluşturulur.
              </li>

              <li>
                Aynı HeyTrip siparişi
                yeniden yüklenmez.
              </li>
            </ul>
          </div>

          {error && (
            <div className="transfer-import-message error">
              {error}
            </div>
          )}

          {result && (
            <div className="transfer-import-result">
              <strong>
                {result.message}
              </strong>

              <div className="transfer-import-result-grid">
                <ResultItem
                  label="Toplam"
                  value={result.total}
                />

                <ResultItem
                  label="Aktarılan"
                  value={
                    result.imported
                  }
                />

                <ResultItem
                  label="Atlanan"
                  value={
                    result.skipped
                  }
                />

                <ResultItem
                  label="Hatalı"
                  value={result.failed}
                />
              </div>

              {result.errors.length >
                0 && (
                <div className="transfer-import-errors">
                  {result.errors.map(
                    (
                      item,
                      index,
                    ) => (
                      <p
                        key={`${item.row}-${index}`}
                      >
                        Satır{" "}
                        {item.row}:{" "}
                        {item.message}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          <footer className="transfer-import-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {result
                ? "Kapat"
                : "Vazgeç"}
            </button>

            {!result && (
              <button
                className="primary"
                type="submit"
                disabled={
                  loading ||
                  !file
                }
              >
                {loading
                  ? "Aktarılıyor..."
                  : "Rezervasyonları Aktar"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}

function ResultItem({
  label,
  value,
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}