import { useRef, useState } from "react";
import { useLanguage } from "../i18n";

export default function SlideToConfirm({ label, icon, disabled, onConfirm }) {
  const { t } = useLanguage();
  const gesture = useRef(null);
  const submitting = useRef(false);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [keyboardReady, setKeyboardReady] = useState(false);
  const locked = disabled || busy;

  async function confirm() {
    if (disabled || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setKeyboardReady(false);
    try {
      await onConfirm();
    } finally {
      submitting.current = false;
      setBusy(false);
      setOffset(0);
    }
  }

  function reset() {
    gesture.current = null;
    setOffset(0);
  }

  function begin(event) {
    if (locked || gesture.current || !event.isPrimary || event.button !== 0) return;
    const handle = event.currentTarget;
    const distance = handle.parentElement.clientWidth - handle.offsetWidth - 8;
    if (distance <= 0) return;
    gesture.current = { id: event.pointerId, start: event.clientX, distance };
    setKeyboardReady(false);
    handle.setPointerCapture(event.pointerId);
  }

  function move(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    setOffset(Math.min(drag.distance, Math.max(0, event.clientX - drag.start)));
  }

  function finish(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const complete = event.clientX - drag.start >= drag.distance * 0.9;
    reset();
    if (complete && !locked) void confirm();
  }

  function keyboard(event) {
    if (event.key === "Escape") {
      setKeyboardReady(false);
      reset();
    }
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || locked) return;
    if (keyboardReady) void confirm();
    else setKeyboardReady(true);
  }

  return (
    <div className="driver-slide-control" dir="ltr" data-busy={locked}>
      <span className="driver-slide-label" aria-hidden="true">{locked ? t("Kaydediliyor...") : `${icon} ${t(label)}`}</span>
      <button
        type="button"
        className="driver-slide-handle"
        disabled={locked}
        aria-label={`${t(label)}. ${t("Onaylamak için sağa kaydırın veya Enter tuşuna iki kez basın.")}`}
        aria-describedby="driver-slide-help"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
        onKeyDown={keyboard}
        onBlur={() => setKeyboardReady(false)}
        onClick={event => {
          if (event.detail === 0 && !locked) {
            if (keyboardReady) void confirm();
            else setKeyboardReady(true);
          }
        }}
      >
        <span aria-hidden="true">→</span>
      </button>
      <span id="driver-slide-help" className="driver-slide-help" role="status">
        {keyboardReady ? t("Onaylamak için tekrar Enter tuşuna basın.") : t("Sağa kaydırarak onayla")}
      </span>
    </div>
  );
}
