import {
  useEffect,
  useRef,
  useState,
} from "react";

import transferService from "../services/transferService";

const POLL_INTERVAL_MS = 1000;

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

  const [importId, setImportId] =
    useState(null);

  const [polling, setPolling] =
    useState(false);

  const pollTimerRef =
    useRef(null);

  const finishedRef =
    useRef(false);

  useEffect(() => {
    if (!open) {
      clearPollTimer();

      setFile(null);
      setError("");
      setResult(null);
      setLoading(false);
      setImportId(null);
      setPolling(false);

      finishedRef.current =
        false;
    }

    return () => {
      clearPollTimer();
    };
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      !importId ||
      !polling
    ) {
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data =
          await transferService
            .getDispatcherTransferImport(
              importId,
            );

        if (cancelled) {
          return;
        }

        const normalized =
          normalizeImportResult(
            data,
          );

        setResult(
          normalized,
        );

        if (
          normalized.status ===
            "completed" ||
          normalized.status ===
            "failed"
        ) {
          setPolling(false);

          clearPollTimer();

          if (
            normalized.status ===
              "completed" &&
            !finishedRef.current
          ) {
            finishedRef.current =
              true;

            await onImported?.();
          }

          if (
            normalized.status ===
              "failed"
          ) {
            setError(
              normalized.failureMessage ||
                "Excel aktarımı başarısız oldu.",
            );
          }

          return;
        }

        scheduleNextPoll(
          poll,
        );
      } catch (
        requestError
      ) {
        if (cancelled) {
          return;
        }

        setPolling(false);

        clearPollTimer();

        setError(
          getRequestErrorMessage(
            requestError,
            "Aktarım durumu alınamadı.",
          ),
        );
      }
    }

    poll();

    return () => {
      cancelled = true;

      clearPollTimer();
    };
  }, [
    importId,
    polling,
    open,
    onImported,
  ]);

  if (!open) {
    return null;
  }

  function clearPollTimer() {
    if (
      pollTimerRef.current
    ) {
      clearTimeout(
        pollTimerRef.current,
      );

      pollTimerRef.current =
        null;
    }
  }

  function scheduleNextPoll(
    callback,
  ) {
    clearPollTimer();

    pollTimerRef.current =
      setTimeout(
        callback,
        POLL_INTERVAL_MS,
      );
  }

  function handleFileChange(
    event,
  ) {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setError("");
    setResult(null);
    setImportId(null);
    setPolling(false);

    finishedRef.current =
      false;

    clearPollTimer();

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

      event.target.value =
        "";

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

      event.target.value =
        "";

      return;
    }

    setFile(
      selectedFile,
    );
  }

  async function handleSubmit(
    event,
  ) {
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
    setImportId(null);
    setPolling(false);

    finishedRef.current =
      false;

    try {
      const response =
        await transferService
          .importDispatcherTransfers(
            file,
          );

      const createdImportId =
        response?.data?.id;

      if (!createdImportId) {
        throw new Error(
          "Aktarım kimliği alınamadı.",
        );
      }

      setImportId(
        createdImportId,
      );

      setResult(
        normalizeImportResult({
          ...response.data,

          message:
            response?.message ||
            "Excel aktarımı başlatıldı.",
        }),
      );

      setPolling(true);
    } catch (
      requestError
    ) {
      setError(
        getRequestErrorMessage(
          requestError,
          "Excel dosyası aktarılamadı.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const isFinished =
    result?.status ===
      "completed" ||
    result?.status ===
      "failed";

  const isProcessing =
    loading ||
    polling ||
    result?.status ===
      "queued" ||
    result?.status ===
      "processing";

  return (
    <div
      className="transfer-import-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !isProcessing
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
            <span>
              TOPLU AKTARIM
            </span>

            <h2 id="transfer-import-title">
              HeyTrip Excel Yükle
            </h2>

            <p>
              İleri tarihli
              rezervasyonları XLS
              veya XLSX dosyasından
              aktarın.
            </p>
          </div>

          <button
            className="transfer-import-close"
            type="button"
            onClick={onClose}
            aria-label="Pencereyi kapat"
            disabled={isProcessing}
          >
            ×
          </button>
        </header>

        <form
          className="transfer-import-form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="transfer-import-file">
            <span>
              Excel dosyası
            </span>

            <input
              type="file"
              accept=".xls,.xlsx"
              disabled={
                isProcessing ||
                isFinished
              }
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
                Her transfer için
                yeni bir SF
                rezervasyon
                numarası
                oluşturulur.
              </li>

              <li>
                HeyTrip sipariş
                numarası gizli
                olarak saklanır.
              </li>

              <li>
                Transferler
                sürücüsüz ve
                Bekliyor
                durumunda
                oluşturulur.
              </li>

              <li>
                Aynı HeyTrip
                siparişi yeniden
                yüklenmez.
              </li>

              <li>
                Büyük dosyalar
                arka planda
                işlenir; panel
                aktarımın
                tamamlanmasını
                beklerken
                kilitlenmez.
              </li>
            </ul>
          </div>

          {error && (
            <div className="transfer-import-message error">
              {error}
            </div>
          )}

          {result && (
            <ImportResult
              result={result}
            />
          )}

          <footer className="transfer-import-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={
                isProcessing
              }
            >
              {isFinished
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
                  ? "Dosya yükleniyor..."
                  : "Rezervasyonları Aktar"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}

function ImportResult({
  result,
}) {
  const completed =
    result.status ===
    "completed";

  const failed =
    result.status ===
    "failed";

  const progress =
    Number.isFinite(
      result.progressPercentage,
    )
      ? result.progressPercentage
      : 0;

  return (
    <div className="transfer-import-result">
      <strong>
        {result.message}
      </strong>

      {!completed &&
        !failed && (
          <div
            style={{
              marginTop: 12,
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                gap: 12,
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span>
                Aktarım
                ilerlemesi
              </span>

              <strong>
                %{progress}
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background:
                  "rgba(255,255,255,0.10)",
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  width:
                    `${progress}%`,
                  height:
                    "100%",
                  background:
                    "currentColor",
                  transition:
                    "width 250ms ease",
                }}
              />
            </div>

            <small
              style={{
                display:
                  "block",
                marginTop: 8,
                opacity: 0.8,
              }}
            >
              {result.processed} /{" "}
              {result.total ||
                "?"}{" "}
              işlendi
            </small>
          </div>
        )}

      <div className="transfer-import-result-grid">
        <ResultItem
          label="Toplam"
          value={
            result.total
          }
        />

        <ResultItem
          label="İşlenen"
          value={
            result.processed
          }
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
          value={
            result.failed
          }
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

      {failed &&
        result.failureMessage && (
          <div className="transfer-import-message error">
            {
              result.failureMessage
            }
          </div>
        )}
    </div>
  );
}

function ResultItem({
  label,
  value,
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function normalizeImportResult(
  data,
) {
  const status =
    data?.status ||
    "queued";

  const total =
    Number(
      data?.total || 0,
    );

  const processed =
    Number(
      data?.processed || 0,
    );

  const imported =
    Number(
      data?.imported || 0,
    );

  const skipped =
    Number(
      data?.skipped || 0,
    );

  const failed =
    Number(
      data?.failed || 0,
    );

  const backendProgress =
    Number(
      data?.progress_percentage,
    );

  const calculatedProgress =
    total > 0
      ? Math.round(
          Math.min(
            100,
            Math.max(
              0,
              (
                processed /
                total
              ) * 100,
            ),
          ),
        )
      : 0;

  const progressPercentage =
    Number.isFinite(
      backendProgress,
    )
      ? backendProgress
      : calculatedProgress;

  let message =
    data?.message ||
    "Excel aktarımı başlatıldı.";

  if (
    status ===
    "processing"
  ) {
    message =
      "Excel aktarımı devam ediyor...";
  }

  if (
    status ===
    "completed"
  ) {
    message =
      `${imported} rezervasyon aktarıldı, ` +
      `${skipped} yinelenen kayıt atlandı, ` +
      `${failed} satır başarısız oldu.`;
  }

  if (
    status ===
    "failed"
  ) {
    message =
      "Excel aktarımı tamamlanamadı.";
  }

  return {
    id:
      data?.id ??
      null,

    status,

    message,

    total,

    processed,

    imported,

    skipped,

    failed,

    progressPercentage,

    errors:
      Array.isArray(
        data?.errors,
      )
        ? data.errors
        : [],

    failureMessage:
      data?.failure_message ||
      null,
  };
}

function getRequestErrorMessage(
  requestError,
  fallback,
) {
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

  return (
    firstValidationError ||
    requestError?.response
      ?.data?.message ||
    requestError?.message ||
    fallback
  );
}