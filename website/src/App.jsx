import { useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import "./mobile-menu.css";
import "./form-status.css";

const SUPPLIER_PORTAL_URL = "/supplier/";

const content = {
  en: {
    nav: { home: "Home", transfer: "Book a Transfer", suppliers: "Become a Supplier", login: "Supplier Login" },
    heroEyebrow: "GLOBAL GROUND TRANSPORTATION NETWORK",
    heroTitle: "Airport transfers, operated with confidence.",
    heroText: "Book reliable airport transportation or join our growing supplier network. SkyTripTransfer connects passengers, professional drivers and local operators through one operational platform.",
    book: "Book a Transfer",
    join: "Start Earning With Us",
    trust: ["Live vehicle tracking", "Verified local suppliers", "24/7 operational support"],
    numbers: [["24/7", "Operations"], ["Global", "Supplier network"], ["Live", "Trip visibility"]],
    passengerTitle: "A smoother journey from pickup to drop-off",
    passengerText: "Every trip is supported by live operational visibility, clear passenger communication and professional local teams.",
    passengerCards: [
      ["01", "Easy booking", "Send your route and travel details in minutes."],
      ["02", "Verified operation", "Your transfer is matched with an approved local supplier."],
      ["03", "Live tracking", "Follow the assigned vehicle through a secure link—no app required."],
    ],
    supplierTitle: "Turn local capacity into global opportunity.",
    supplierText: "Join SkyTripTransfer, receive suitable transfer opportunities, manage drivers and vehicles, and track your earnings from one supplier portal.",
    supplierPoints: ["Access transfer opportunities", "Manage drivers and vehicles", "Transparent earnings and invoices", "Dedicated operational support"],
    ctaTitle: "Ready to move with SkyTripTransfer?",
    ctaText: "Choose your path and get started today.",
  },
  tr: {
    nav: { home: "Ana Sayfa", transfer: "Transfer Rezervasyonu", suppliers: "Tedarikçi Ol", login: "Tedarikçi Girişi" },
    heroEyebrow: "GLOBAL KARAYOLU ULAŞIM AĞI",
    heroTitle: "Havalimanı transferlerinde güvenilir operasyon.",
    heroText: "Güvenilir bir transfer rezervasyonu yapın veya büyüyen tedarikçi ağımıza katılın. SkyTripTransfer; yolcuları, profesyonel sürücüleri ve yerel operasyon şirketlerini tek platformda buluşturur.",
    book: "Transfer Rezervasyonu Yap",
    join: "Bizimle Kazanmaya Başla",
    trust: ["Canlı araç takibi", "Doğrulanmış yerel tedarikçiler", "7/24 operasyon desteği"],
    numbers: [["7/24", "Operasyon"], ["Global", "Tedarikçi ağı"], ["Canlı", "Transfer görünürlüğü"]],
    passengerTitle: "Alış noktasından varışa kadar daha rahat bir yolculuk",
    passengerText: "Her transfer; canlı operasyon görünürlüğü, açık yolcu iletişimi ve profesyonel yerel ekiplerle desteklenir.",
    passengerCards: [
      ["01", "Kolay rezervasyon", "Rota ve seyahat bilgilerinizi dakikalar içinde gönderin."],
      ["02", "Doğrulanmış operasyon", "Transferiniz onaylı bir yerel tedarikçiyle eşleştirilir."],
      ["03", "Canlı takip", "Uygulama yüklemeden güvenli bağlantı üzerinden aracınızı takip edin."],
    ],
    supplierTitle: "Yerel kapasitenizi global fırsata dönüştürün.",
    supplierText: "SkyTripTransfer'a katılın; uygun transfer fırsatlarını alın, sürücü ve araçlarınızı yönetin, kazançlarınızı tek panelden takip edin.",
    supplierPoints: ["Transfer fırsatlarına erişim", "Sürücü ve araç yönetimi", "Şeffaf hakediş ve faturalar", "Özel operasyon desteği"],
    ctaTitle: "SkyTripTransfer ile yola çıkmaya hazır mısınız?",
    ctaText: "Size uygun yolu seçin ve bugün başlayın.",
  },
};

export default function App() {
  const [language, setLanguage] = useState(() => {
    const storedLanguage = window.localStorage.getItem("skytriptransfer-language");
    return storedLanguage === "tr" ? "tr" : "en";
  });
  const page = useMemo(() => getPage(window.location.pathname), []);
  const t = content[language];

  function changeLanguage(nextLanguage) {
    window.localStorage.setItem("skytriptransfer-language", nextLanguage);
    setLanguage(nextLanguage);
  }

  return (
    <div className="site-shell">
      <Header language={language} setLanguage={changeLanguage} t={t} page={page} />
      {page === "transfer" ? <TransferPage language={language} /> : page === "supplier" ? <SupplierJoinPage language={language} /> : <HomePage t={t} />}
      <Footer language={language} />
    </div>
  );
}

function Header({ language, setLanguage, t, page }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="SkyTripTransfer home">
        <span className="brand-mark"><i />ST</span>
        <span><strong>SKYTRIP</strong><em>TRANSFER</em><small>Global Mobility Network</small></span>
      </a>
      <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
        <a className={page === "home" ? "active" : ""} href="/">{t.nav.home}</a>
        <a className={page === "transfer" ? "active" : ""} href="/transfer">{t.nav.transfer}</a>
        <a className={page === "supplier" ? "active" : ""} href="/supplier/join">{t.nav.suppliers}</a>
      </nav>
      <div className="header-actions">
        <button className="language" type="button" onClick={() => setLanguage(language === "en" ? "tr" : "en")}>{language === "en" ? "TR" : "EN"}</button>
        <a className="portal-link" href={SUPPLIER_PORTAL_URL}>{t.nav.login}</a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={language === "tr" ? "Menüyü aç" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

function HomePage({ t }) {
  return <main>
    <section className="hero section-pad">
      <div className="hero-copy">
        <span className="eyebrow">{t.heroEyebrow}</span>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroText}</p>
        <div className="hero-actions"><a className="button primary" href="/transfer">{t.book}<span>↗</span></a><a className="button ghost" href="/supplier/join">{t.join}<span>→</span></a></div>
        <div className="trust-row">{t.trust.map((item) => <span key={item}><b>✓</b>{item}</span>)}</div>
      </div>
      <RouteVisual />
    </section>
    <section className="number-strip section-pad">{t.numbers.map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section className="passenger section-pad">
      <div className="section-heading"><span className="eyebrow">PASSENGER EXPERIENCE</span><h2>{t.passengerTitle}</h2><p>{t.passengerText}</p></div>
      <div className="feature-grid">{t.passengerCards.map(([n,title,text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="supplier-section section-pad">
      <div className="supplier-panel">
        <div><span className="eyebrow">SUPPLIER NETWORK</span><h2>{t.supplierTitle}</h2><p>{t.supplierText}</p><a className="button light" href="/supplier/join">{t.join}<span>↗</span></a></div>
        <ul>{t.supplierPoints.map((point) => <li key={point}><b>✓</b>{point}</li>)}</ul>
      </div>
    </section>
    <section className="final-cta section-pad"><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p><div><a className="button primary" href="/transfer">{t.book}</a><a className="button ghost" href="/supplier/join">{t.join}</a></div></section>
  </main>;
}

function RouteVisual() {
  return <div className="route-card" aria-label="Live transfer illustration">
    <div className="route-top"><span>LIVE TRANSFER</span><b>● ON ROUTE</b></div>
    <div className="mini-map"><div className="road one"/><div className="road two"/><div className="route-line"/><span className="pin airport">✈</span><span className="pin vehicle">◆</span><span className="pin hotel">●</span></div>
    <div className="route-details"><div><small>PICKUP</small><strong>International Airport</strong></div><span>→</span><div><small>DROP-OFF</small><strong>City Destination</strong></div></div>
    <div className="driver-card"><span className="avatar">ST</span><div><small>PROFESSIONAL DRIVER</small><strong>Vehicle assigned</strong></div><b>TRACKING ACTIVE</b></div>
  </div>;
}

function TransferPage({ language }) {
  const tr = language === "tr";

  const [submission, setSubmission] = useState({
    status: "idle",
    message: "",
  });

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedLocations, setSelectedLocations] = useState({
    pickup: null,
    dropoff: null,
  });

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  const [pickupOpen, setPickupOpen] = useState(false);
  const [dropoffOpen, setDropoffOpen] = useState(false);

  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropoffLoading, setDropoffLoading] = useState(false);
  const [activeSuggestionIndexes, setActiveSuggestionIndexes] = useState({
    pickup: -1,
    dropoff: -1,
  });

  const locationTimers = useRef({
    pickup: null,
    dropoff: null,
  });

  const locationRequestIds = useRef({
    pickup: 0,
    dropoff: 0,
  });

  const earliestDate = new Date().toISOString().slice(0, 10);

  function clearLocationTimer(type) {
    if (locationTimers.current[type]) {
      clearTimeout(locationTimers.current[type]);
      locationTimers.current[type] = null;
    }
  }

  function resetLocationResults(type) {
    setActiveSuggestionIndexes((current) => ({
      ...current,
      [type]: -1,
    }));

    if (type === "pickup") {
      setPickupSuggestions([]);
      setPickupOpen(false);
      setPickupLoading(false);
    } else {
      setDropoffSuggestions([]);
      setDropoffOpen(false);
      setDropoffLoading(false);
    }
  }

  function updateLocationValue(type, value) {
    if (type === "pickup") {
      setPickup(value);
    } else {
      setDropoff(value);
    }

    setSelectedLocations((current) => ({
      ...current,
      [type]: null,
    }));
    setActiveSuggestionIndexes((current) => ({
      ...current,
      [type]: -1,
    }));

    clearLocationTimer(type);

    const query = value.trim();

    if (query.length < 2) {
      locationRequestIds.current[type] += 1;
      resetLocationResults(type);
      return;
    }

    if (type === "pickup") {
      setPickupOpen(true);
      setPickupLoading(true);
    } else {
      setDropoffOpen(true);
      setDropoffLoading(true);
    }

    locationTimers.current[type] = setTimeout(
      async () => {
        const requestId =
          locationRequestIds.current[type] + 1;

        locationRequestIds.current[type] = requestId;

        try {
          const response = await axios.get(
            "/api/public/address-search",
            {
              params: {
                q: query,
              },
            },
          );

          if (
            locationRequestIds.current[type] !== requestId
          ) {
            return;
          }

          const results = Array.isArray(response.data?.data)
            ? response.data.data
            : [];

          if (type === "pickup") {
            setPickupSuggestions(results);
            setPickupOpen(true);
          } else {
            setDropoffSuggestions(results);
            setDropoffOpen(true);
          }

          setActiveSuggestionIndexes((current) => ({
            ...current,
            [type]: -1,
          }));
        } catch {
          if (
            locationRequestIds.current[type] !== requestId
          ) {
            return;
          }

          if (type === "pickup") {
            setPickupSuggestions([]);
          } else {
            setDropoffSuggestions([]);
          }
        } finally {
          if (
            locationRequestIds.current[type] === requestId
          ) {
            if (type === "pickup") {
              setPickupLoading(false);
            } else {
              setDropoffLoading(false);
            }
          }
        }
      },
      300,
    );
  }

  function selectLocation(type, suggestion) {
    const value =
      suggestion.formatted_address ||
      suggestion.label ||
      suggestion.name ||
      "";

    clearLocationTimer(type);

    locationRequestIds.current[type] += 1;

    setSelectedLocations((current) => ({
      ...current,
      [type]: suggestion,
    }));
    setActiveSuggestionIndexes((current) => ({
      ...current,
      [type]: -1,
    }));

    if (type === "pickup") {
      setPickup(value);
      setPickupSuggestions([]);
      setPickupOpen(false);
      setPickupLoading(false);
    } else {
      setDropoff(value);
      setDropoffSuggestions([]);
      setDropoffOpen(false);
      setDropoffLoading(false);
    }
  }

  function closeLocationDropdown(type) {
    window.setTimeout(
      () => {
        setActiveSuggestionIndexes((current) => ({
          ...current,
          [type]: -1,
        }));

        if (type === "pickup") {
          setPickupOpen(false);
        } else {
          setDropoffOpen(false);
        }
      },
      150,
    );
  }

  function handleLocationKeyDown(
    type,
    event,
    suggestions,
    open,
  ) {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();

        if (type === "pickup") {
          setPickupOpen(false);
        } else {
          setDropoffOpen(false);
        }

        setActiveSuggestionIndexes((current) => ({
          ...current,
          [type]: -1,
        }));
      }

      return;
    }

    if (event.key === "Enter") {
      const activeIndex = activeSuggestionIndexes[type];
      const suggestion = suggestions[activeIndex];

      if (open && suggestion) {
        event.preventDefault();
        selectLocation(type, suggestion);
      }

      return;
    }

    if (
      !["ArrowDown", "ArrowUp"].includes(event.key) ||
      suggestions.length === 0
    ) {
      return;
    }

    event.preventDefault();

    if (type === "pickup") {
      setPickupOpen(true);
    } else {
      setDropoffOpen(true);
    }

    setActiveSuggestionIndexes((current) => {
      const currentIndex = current[type];
      const lastIndex = suggestions.length - 1;
      let nextIndex;

      if (event.key === "ArrowDown") {
        nextIndex =
          currentIndex < lastIndex
            ? currentIndex + 1
            : 0;
      } else {
        nextIndex =
          currentIndex > 0
            ? currentIndex - 1
            : lastIndex;
      }

      return {
        ...current,
        [type]: nextIndex,
      };
    });
  }

  async function submit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      pickup: formData.get("pickup"),
      pickup_place_id:
        selectedLocations.pickup?.place_id || null,
      pickup_lat:
        selectedLocations.pickup?.latitude ?? null,
      pickup_lng:
        selectedLocations.pickup?.longitude ?? null,
      dropoff: formData.get("dropoff"),
      dropoff_place_id:
        selectedLocations.dropoff?.place_id || null,
      dropoff_lat:
        selectedLocations.dropoff?.latitude ?? null,
      dropoff_lng:
        selectedLocations.dropoff?.longitude ?? null,
      pickup_date: formData.get("pickup_date"),
      pickup_time: formData.get("pickup_time"),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      flight_number:
        formData.get("flight_number") || null,
      passengers:
        Number(formData.get("passengers")),
      luggage_count:
        Number(formData.get("luggage_count") || 0),
      vehicle_type:
        formData.get("vehicle_type") || null,
      passenger_name:
        formData.get("passenger_name"),
      passenger_phone:
        formData.get("passenger_phone"),
      passenger_email:
        formData.get("passenger_email"),
      note:
        formData.get("note") || null,
      locale: language,
      terms_accepted:
        formData.get("terms_accepted") === "1",
    };

    setSubmission({
      status: "submitting",
      message: tr
        ? "Transfer talebiniz güvenli şekilde gönderiliyor..."
        : "Submitting your transfer request securely...",
    });

    try {
      const response = await axios.post(
        "/api/public/transfer-requests",
        payload,
      );

      const reference =
        response.data?.data?.request_reference;

      setSubmission({
        status: "success",
        message: tr
          ? `Talebiniz alındı. Talep numaranız: ${reference}`
          : `Your request has been received. Request reference: ${reference}`,
      });

      form.reset();

      setPickup("");
      setDropoff("");
      setSelectedLocations({
        pickup: null,
        dropoff: null,
      });
      setPickupSuggestions([]);
      setDropoffSuggestions([]);
      setPickupOpen(false);
      setDropoffOpen(false);
      setActiveSuggestionIndexes({
        pickup: -1,
        dropoff: -1,
      });
    } catch (error) {
      const validationErrors =
        error.response?.data?.errors;

      const firstValidationMessage =
        validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null;

      setSubmission({
        status: "error",
        message:
          firstValidationMessage ||
          error.response?.data?.message ||
          (tr
            ? "Talebiniz gönderilemedi. Bilgileri kontrol edip tekrar deneyin."
            : "Your request could not be submitted. Check the details and try again."),
      });
    }
  }

  function renderLocationSuggestions(
    type,
    suggestions,
    loading,
    open,
    value,
  ) {
    if (!open || value.trim().length < 2) {
      return null;
    }

    return (
      <div
        id={`${type}-address-suggestions`}
        className="transfer-address-dropdown"
        role="listbox"
        aria-label={
          type === "pickup"
            ? tr
              ? "Alış noktası önerileri"
              : "Pickup location suggestions"
            : tr
              ? "Bırakış noktası önerileri"
              : "Drop-off location suggestions"
        }
      >
        {loading && (
          <div className="transfer-address-status" role="status">
            <span className="transfer-address-spinner" />

            {tr
              ? "Adresler aranıyor..."
              : "Searching locations..."}
          </div>
        )}

        {!loading && suggestions.length === 0 && (
          <div className="transfer-address-status" role="status">
            {tr
              ? "Adres bulunamadı. Yazmaya devam edin."
              : "No location found. Try a more specific search."}
          </div>
        )}

        {!loading &&
          suggestions.map((suggestion, index) => (
            <button
              key={
                suggestion.place_id ||
                `${suggestion.latitude}-${suggestion.longitude}-${index}`
              }
              id={`${type}-address-option-${index}`}
              type="button"
              className={`transfer-address-option${
                activeSuggestionIndexes[type] === index
                  ? " is-active"
                  : ""
              }`}
              role="option"
              aria-selected={
                activeSuggestionIndexes[type] === index
              }
              tabIndex={-1}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onMouseEnter={() =>
                setActiveSuggestionIndexes((current) => ({
                  ...current,
                  [type]: index,
                }))
              }
              onClick={() =>
                selectLocation(type, suggestion)
              }
            >
              <span className="transfer-address-marker">
                {suggestion.name
                  ?.toLowerCase()
                  .includes("airport") ||
                suggestion.name
                  ?.toLowerCase()
                  .includes("havaliman")
                  ? "✈"
                  : "●"}
              </span>

              <span className="transfer-address-copy">
                <strong>
                  {suggestion.name ||
                    suggestion.formatted_address ||
                    suggestion.label}
                </strong>

                <small>
                  {suggestion.formatted_address ||
                    suggestion.label}
                </small>
              </span>

              <span className="transfer-address-arrow">
                →
              </span>
            </button>
          ))}

        <div className="transfer-address-provider">
          <span>⌖</span>
          {tr
            ? "Gerçek zamanlı konum araması"
            : "Real-time location search"}
        </div>
      </div>
    );
  }

  return (
    <main className="transfer-page">

      <section className="transfer-hero section-pad">

        <div className="transfer-hero-copy">

          <span className="eyebrow">
            {tr
              ? "ÖZEL TRANSFER REZERVASYONU"
              : "PRIVATE TRANSFER BOOKING"}
          </span>

          <h1>
            {tr
              ? "Yolculuğunuz, profesyonelce yönetilsin."
              : "Your journey, professionally managed."}
          </h1>

          <p>
            {tr
              ? "Havalimanı, otel ve özel transfer taleplerinizi gönderin. Skyfleet operasyon ekibi müsaitlik ve fiyat bilgisini sizinle paylaşsın."
              : "Request airport, hotel and private transfers. Our operations team will confirm availability and pricing for your journey."}
          </p>

          <div className="transfer-trust-row">

            <span>
              <b>✓</b>
              {tr
                ? "Canlı yolculuk takibi"
                : "Live journey tracking"}
            </span>

            <span>
              <b>✓</b>
              {tr
                ? "Operasyon desteği"
                : "Operations support"}
            </span>

            <span>
              <b>✓</b>
              {tr
                ? "Profesyonel ulaşım ağı"
                : "Professional transport network"}
            </span>

          </div>

        </div>

        <div className="transfer-hero-status">

          <div className="transfer-status-top">
            <span>
              SKYFLEET JOURNEY
            </span>

            <b>
              ● {tr ? "TAKİP AKTİF" : "TRACKING READY"}
            </b>
          </div>

          <div className="transfer-status-route">

            <div className="transfer-location-point">
              <span className="transfer-point-icon">
                ✈
              </span>

              <div>
                <small>
                  {tr ? "ALIŞ" : "PICKUP"}
                </small>

                <strong>
                  {tr
                    ? "Havalimanı veya adres"
                    : "Airport or address"}
                </strong>
              </div>
            </div>

            <div className="transfer-route-line">
              <span />
              <i>→</i>
              <span />
            </div>

            <div className="transfer-location-point">
              <span className="transfer-point-icon">
                ◆
              </span>

              <div>
                <small>
                  {tr ? "VARIŞ" : "DROP-OFF"}
                </small>

                <strong>
                  {tr
                    ? "Otel veya destinasyon"
                    : "Hotel or destination"}
                </strong>
              </div>
            </div>

          </div>

          <div className="transfer-status-footer">

            <div>
              <small>
                {tr
                  ? "YOLCULUK DESTEĞİ"
                  : "JOURNEY SUPPORT"}
              </small>

              <strong>
                {tr
                  ? "Operasyon ekibi yolculuğunuzu takip eder"
                  : "Operations team supporting your journey"}
              </strong>
            </div>

            <span>24/7</span>

          </div>

        </div>

      </section>

      <section className="transfer-booking-section section-pad">

        <div className="transfer-booking-layout">

          <form
            className="transfer-booking-form"
            onSubmit={submit}
          >

            <div className="transfer-form-header">

              <div>
                <span>
                  {tr
                    ? "TRANSFER TALEBİ"
                    : "TRANSFER REQUEST"}
                </span>

                <h2>
                  {tr
                    ? "Yolculuk detaylarınızı girin."
                    : "Tell us about your journey."}
                </h2>
              </div>

              <div className="transfer-secure-badge">
                <span>✓</span>

                <div>
                  <strong>
                    {tr
                      ? "Güvenli Talep"
                      : "Secure Request"}
                  </strong>

                  <small>
                    {tr
                      ? "Bilgileriniz operasyon amacıyla kullanılır."
                      : "Your details are used for your transfer request."}
                  </small>
                </div>
              </div>

            </div>

            <section className="transfer-form-section">

              <div className="transfer-section-heading">
                <span>01</span>

                <div>
                  <h3>
                    {tr
                      ? "Rota ve Zaman"
                      : "Route & Schedule"}
                  </h3>

                  <p>
                    {tr
                      ? "Nereden alınacağınızı ve nereye gideceğinizi belirtin."
                      : "Tell us where your journey starts and ends."}
                  </p>
                </div>
              </div>

              <div className="transfer-form-grid">

                <label className="transfer-field transfer-field-wide transfer-address-field">
                  <span>
                    {tr
                      ? "Alış noktası"
                      : "Pickup location"}
                    <b>*</b>
                  </span>

                  <div className="transfer-input-wrap">
                    <i>●</i>

                    <input
                      id="pickup-address"
                      name="pickup"
                      value={pickup}
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-haspopup="listbox"
                      aria-expanded={
                        pickupOpen && pickup.trim().length >= 2
                      }
                      aria-controls="pickup-address-suggestions"
                      aria-activedescendant={
                        pickupOpen &&
                        activeSuggestionIndexes.pickup >= 0
                          ? `pickup-address-option-${activeSuggestionIndexes.pickup}`
                          : undefined
                      }
                      placeholder={
                        tr
                          ? "Havalimanı, otel veya adres"
                          : "Airport, hotel or address"
                      }
                      onChange={(event) =>
                        updateLocationValue(
                          "pickup",
                          event.target.value,
                        )
                      }
                      onFocus={() => {
                        if (pickup.trim().length >= 2) {
                          setPickupOpen(true);
                        }
                      }}
                      onBlur={() =>
                        closeLocationDropdown("pickup")
                      }
                      onKeyDown={(event) =>
                        handleLocationKeyDown(
                          "pickup",
                          event,
                          pickupSuggestions,
                          pickupOpen,
                        )
                      }
                      required
                    />

                    {pickupLoading && (
                      <span className="transfer-input-loader">
                        ●
                      </span>
                    )}
                  </div>

                  {renderLocationSuggestions(
                    "pickup",
                    pickupSuggestions,
                    pickupLoading,
                    pickupOpen,
                    pickup,
                  )}
                </label>

                <label className="transfer-field transfer-field-wide transfer-address-field">
                  <span>
                    {tr
                      ? "Bırakış noktası"
                      : "Drop-off location"}
                    <b>*</b>
                  </span>

                  <div className="transfer-input-wrap">
                    <i>◆</i>

                    <input
                      id="dropoff-address"
                      name="dropoff"
                      value={dropoff}
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-haspopup="listbox"
                      aria-expanded={
                        dropoffOpen && dropoff.trim().length >= 2
                      }
                      aria-controls="dropoff-address-suggestions"
                      aria-activedescendant={
                        dropoffOpen &&
                        activeSuggestionIndexes.dropoff >= 0
                          ? `dropoff-address-option-${activeSuggestionIndexes.dropoff}`
                          : undefined
                      }
                      placeholder={
                        tr
                          ? "Otel, havalimanı veya adres"
                          : "Hotel, airport or address"
                      }
                      onChange={(event) =>
                        updateLocationValue(
                          "dropoff",
                          event.target.value,
                        )
                      }
                      onFocus={() => {
                        if (dropoff.trim().length >= 2) {
                          setDropoffOpen(true);
                        }
                      }}
                      onBlur={() =>
                        closeLocationDropdown("dropoff")
                      }
                      onKeyDown={(event) =>
                        handleLocationKeyDown(
                          "dropoff",
                          event,
                          dropoffSuggestions,
                          dropoffOpen,
                        )
                      }
                      required
                    />

                    {dropoffLoading && (
                      <span className="transfer-input-loader">
                        ●
                      </span>
                    )}
                  </div>

                  {renderLocationSuggestions(
                    "dropoff",
                    dropoffSuggestions,
                    dropoffLoading,
                    dropoffOpen,
                    dropoff,
                  )}
                </label>

                <label className="transfer-field">
                  <span>
                    {tr ? "Tarih" : "Date"}
                    <b>*</b>
                  </span>

                  <input
                    name="pickup_date"
                    type="date"
                    min={earliestDate}
                    required
                  />
                </label>

                <label className="transfer-field">
                  <span>
                    {tr ? "Saat" : "Time"}
                    <b>*</b>
                  </span>

                  <input
                    name="pickup_time"
                    type="time"
                    required
                  />
                </label>

                <label className="transfer-field transfer-field-wide">
                  <span>
                    {tr
                      ? "Uçuş numarası"
                      : "Flight number"}
                  </span>

                  <input
                    name="flight_number"
                    placeholder={
                      tr
                        ? "Örn. TK1985"
                        : "Example: TK1985"
                    }
                  />

                  <small>
                    {tr
                      ? "Havalimanı transferlerinde uçuş takibi için önerilir."
                      : "Recommended for airport transfers so our team can follow your flight."}
                  </small>
                </label>

              </div>

            </section>

            <section className="transfer-form-section">

              <div className="transfer-section-heading">

                <span>02</span>

                <div>
                  <h3>
                    {tr
                      ? "Yolcu ve Araç"
                      : "Passengers & Vehicle"}
                  </h3>

                  <p>
                    {tr
                      ? "Grubunuza uygun araç planlamamıza yardımcı olun."
                      : "Help us plan the right vehicle for your group."}
                  </p>
                </div>

              </div>

              <div className="transfer-form-grid">

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Yolcu sayısı"
                      : "Passengers"}
                    <b>*</b>
                  </span>

                  <input
                    name="passengers"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </label>

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Bagaj sayısı"
                      : "Luggage"}
                  </span>

                  <input
                    name="luggage_count"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </label>

              </div>

              <div className="transfer-vehicle-area">

                <span className="transfer-vehicle-label">
                  {tr
                    ? "Araç tercihi"
                    : "Vehicle preference"}
                </span>

                <div className="transfer-vehicle-grid">

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="Sedan"
                    />

                    <span className="vehicle-card">

                      <strong>SEDAN</strong>

                      <small>
                        {tr
                          ? "1–3 yolcu"
                          : "1–3 passengers"}
                      </small>

                      <em>
                        {tr
                          ? "Konforlu özel transfer"
                          : "Private comfort"}
                      </em>

                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="Minivan"
                    />

                    <span className="vehicle-card">

                      <strong>MINIVAN</strong>

                      <small>
                        {tr
                          ? "4–7 yolcu"
                          : "4–7 passengers"}
                      </small>

                      <em>
                        {tr
                          ? "Aile ve küçük gruplar"
                          : "Families & groups"}
                      </em>

                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="Minibus"
                    />

                    <span className="vehicle-card">

                      <strong>MINIBUS</strong>

                      <small>
                        {tr
                          ? "8+ yolcu"
                          : "8+ passengers"}
                      </small>

                      <em>
                        {tr
                          ? "Büyük gruplar"
                          : "Larger groups"}
                      </em>

                    </span>
                  </label>

                </div>

              </div>

            </section>

            <section className="transfer-form-section">

              <div className="transfer-section-heading">

                <span>03</span>

                <div>
                  <h3>
                    {tr
                      ? "İletişim Bilgileri"
                      : "Contact Details"}
                  </h3>

                  <p>
                    {tr
                      ? "Operasyon ekibimizin size ulaşabilmesi için bilgilerinizi girin."
                      : "Provide the details our operations team can use to contact you."}
                  </p>
                </div>

              </div>

              <div className="transfer-form-grid">

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Ad soyad"
                      : "Full name"}
                    <b>*</b>
                  </span>

                  <input
                    name="passenger_name"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Telefon / WhatsApp"
                      : "Phone / WhatsApp"}
                    <b>*</b>
                  </span>

                  <input
                    name="passenger_phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+90..."
                    required
                  />
                </label>

                <label className="transfer-field transfer-field-wide">
                  <span>
                    {tr
                      ? "E-posta"
                      : "Email"}
                    <b>*</b>
                  </span>

                  <input
                    name="passenger_email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="transfer-field transfer-field-wide">

                  <span>
                    {tr
                      ? "Özel not veya talep"
                      : "Special request"}
                  </span>

                  <textarea
                    name="note"
                    rows="4"
                    placeholder={
                      tr
                        ? "Çocuk koltuğu, ekstra bagaj, karşılama notu veya diğer talepler..."
                        : "Child seat, extra luggage, meet & greet notes or other requests..."
                    }
                  />

                </label>

              </div>

            </section>

            <label className="transfer-consent">

              <input
                type="checkbox"
                name="terms_accepted"
                value="1"
                required
              />

              <span>
                {tr
                  ? "Bilgilerin doğru olduğunu ve Skyfleet operasyon ekibinin bu transfer talebi hakkında benimle iletişime geçebileceğini kabul ediyorum."
                  : "I confirm that the information is accurate and Skyfleet operations may contact me regarding this transfer request."}
              </span>

            </label>

            <div className="transfer-submit-area">

              <button
                className="button primary transfer-submit-button"
                type="submit"
                disabled={
                  submission.status === "submitting"
                }
              >

                {submission.status === "submitting"
                  ? (
                    tr
                      ? "Talebiniz gönderiliyor..."
                      : "Submitting request..."
                  )
                  : (
                    tr
                      ? "Transfer Talebi Oluştur"
                      : "Request Your Transfer"
                  )}

                <span>→</span>

              </button>

              <div className="transfer-submit-note">

                <strong>
                  {tr
                    ? "Bu aşamada ödeme gerekmez."
                    : "No payment required at this stage."}
                </strong>

                <small>
                  {tr
                    ? "Operasyon ekibimiz müsaitlik ve fiyat bilgisini sizinle paylaşacaktır."
                    : "Our operations team will confirm availability and pricing."}
                </small>

              </div>

            </div>

            {submission.status !== "idle" && (

              <p
                className={`form-notice transfer-notice ${submission.status}`}
                role="status"
              >
                {submission.message}
              </p>

            )}

          </form>

          <aside className="transfer-assurance-panel">

            <span className="eyebrow">
              SKYFLEET JOURNEY
            </span>

            <h2>
              {tr
                ? "Rezervasyondan varışa kadar kontrol altında."
                : "Managed from booking to arrival."}
            </h2>

            <p>
              {tr
                ? "Skyfleet yalnızca bir araç ayarlamaz. Yolculuğun operasyonel akışını takip eder."
                : "Skyfleet goes beyond arranging a vehicle. We support the operational journey from start to finish."}
            </p>

            <div className="transfer-assurance-list">

              <div>
                <span>01</span>

                <div>
                  <strong>
                    {tr
                      ? "Profesyonel planlama"
                      : "Professional planning"}
                  </strong>

                  <small>
                    {tr
                      ? "Talebiniz operasyon ekibi tarafından kontrol edilir."
                      : "Your request is reviewed by our operations team."}
                  </small>
                </div>
              </div>

              <div>
                <span>02</span>

                <div>
                  <strong>
                    {tr
                      ? "Canlı yolculuk takibi"
                      : "Live journey tracking"}
                  </strong>

                  <small>
                    {tr
                      ? "Uygulama indirmeden aracınızı takip edin."
                      : "Follow your vehicle without downloading an app."}
                  </small>
                </div>
              </div>

              <div>
                <span>03</span>

                <div>
                  <strong>
                    {tr
                      ? "Yolculuk desteği"
                      : "Journey support"}
                  </strong>

                  <small>
                    {tr
                      ? "Transfer sırasında ihtiyaç halinde operasyon ekibine ulaşın."
                      : "Reach operations support when you need help during your journey."}
                  </small>
                </div>
              </div>

            </div>

            <div className="transfer-assurance-bottom">

              <span>●</span>

              <div>
                <small>
                  OPERATIONS NETWORK
                </small>

                <strong>
                  Connected journey management
                </strong>
              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

function SupplierJoinPage({ language }) {
  const tr = language === "tr";
  const formRef = useRef(null);

  const steps = [
    tr ? "Şirket" : "Company",
    tr ? "Yetkili" : "Contact",
    tr ? "Operasyon" : "Coverage",
    tr ? "Belgeler" : "Documents",
    tr ? "Portal" : "Portal",
    tr ? "Kontrol" : "Review",
  ];

  const [step, setStep] = useState(0);
  const [submission, setSubmission] = useState({
    status: "idle",
    message: "",
  });

  const [values, setValues] = useState({
    company_name: "",
    legal_name: "",
    founded_year: "",
    website: "",
    tax_number: "",
    registration_number: "",

    country_name: "",
    country_code: "",
    city: "",
    state_region: "",
    address: "",
    postal_code: "",

    contact_name: "",
    contact_title: "",
    company_email: "",
    company_phone: "",
    whatsapp: "",
    preferred_language: language === "tr" ? "tr" : "en",

    service_regions: "",
    service_airports: "",
    fleet_size: "",
    driver_count: "",
    monthly_transfer_capacity: "",
    vehicle_types: "",
    support_24_7: false,

    default_currency: "EUR",

    portal_password: "",
    portal_password_confirmation: "",

    terms_accepted: false,
  });

  const [files, setFiles] = useState({
    company_registration_file: null,
    tax_document_file: null,
    insurance_file: null,
    transport_license_file: null,
  });

  function updateValue(event) {
    const { name, value, type, checked } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function updateFile(event) {
    const { name, files: selectedFiles } = event.target;

    setFiles((current) => ({
      ...current,
      [name]: selectedFiles?.[0] || null,
    }));
  }

  function nextStep() {
    const panel = formRef.current?.querySelector(
      `[data-step="${step}"]`
    );

    if (panel) {
      const requiredFields = [
        ...panel.querySelectorAll(
          "input[required], select[required], textarea[required]"
        ),
      ];

      for (const field of requiredFields) {
        if (!field.checkValidity()) {
          field.reportValidity();
          return;
        }
      }
    }

    setStep((current) =>
      Math.min(current + 1, steps.length - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    setStep((current) =>
      Math.max(current - 1, 0)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submit(event) {
    event.preventDefault();

    if (!values.terms_accepted) {
      setSubmission({
        status: "error",
        message: tr
          ? "Devam etmek için beyan ve şartları kabul etmelisiniz."
          : "You must accept the declaration and terms before submitting.",
      });

      return;
    }

    if (
      values.portal_password !==
      values.portal_password_confirmation
    ) {
      setSubmission({
        status: "error",
        message: tr
          ? "Portal şifreleri eşleşmiyor."
          : "Portal passwords do not match.",
      });

      setStep(4);
      return;
    }

    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "support_24_7") {
        if (value) {
          formData.append(key, "1");
        }
        return;
      }

      if (key === "terms_accepted") {
        if (value) {
          formData.append(key, "1");
        }
        return;
      }

      if (value !== "" && value !== null) {
        formData.append(key, String(value));
      }
    });

    formData.append(
      "timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file);
      }
    });

    setSubmission({
      status: "submitting",
      message: tr
        ? "Başvurunuz güvenli şekilde gönderiliyor..."
        : "Submitting your application securely...",
    });

    try {
      const response = await axios.post(
        "/api/public/supplier-applications",
        formData
      );

      const applicationId =
        response.data?.data?.application_id;

      setSubmission({
        status: "success",
        message: tr
          ? `Başvurunuz başarıyla alındı. Başvuru numaranız: ${applicationId}`
          : `Your application has been received successfully. Application ID: ${applicationId}`,
      });
    } catch (error) {
      const validationErrors =
        error.response?.data?.errors;

      const firstValidationMessage =
        validationErrors
          ? Object.values(validationErrors).flat()[0]
          : null;

      setSubmission({
        status: "error",
        message:
          firstValidationMessage ||
          error.response?.data?.message ||
          (tr
            ? "Başvuru gönderilemedi. Bilgilerinizi kontrol edip tekrar deneyin."
            : "The application could not be submitted. Please check your information and try again."),
      });
    }
  }

  const reviewRows = [
    [
      tr ? "Şirket" : "Company",
      values.company_name,
    ],
    [
      tr ? "Yasal unvan" : "Legal name",
      values.legal_name || "—",
    ],
    [
      tr ? "Merkez" : "Headquarters",
      [values.city, values.country_name]
        .filter(Boolean)
        .join(", "),
    ],
    [
      tr ? "Yetkili" : "Contact",
      values.contact_name,
    ],
    [
      tr ? "E-posta" : "Email",
      values.company_email,
    ],
    [
      tr ? "Telefon" : "Phone",
      values.company_phone,
    ],
    [
      tr ? "Hizmet bölgeleri" : "Service regions",
      values.service_regions,
    ],
    [
      tr ? "Havalimanları" : "Airports",
      values.service_airports || "—",
    ],
    [
      tr ? "Araç sayısı" : "Fleet size",
      values.fleet_size || "—",
    ],
    [
      tr ? "Sürücü sayısı" : "Drivers",
      values.driver_count || "—",
    ],
    [
      tr ? "Aylık kapasite" : "Monthly capacity",
      values.monthly_transfer_capacity || "—",
    ],
    [
      tr ? "Araç sınıfları" : "Vehicle classes",
      values.vehicle_types,
    ],
    [
      tr ? "7/24 destek" : "24/7 support",
      values.support_24_7
        ? (tr ? "Evet" : "Yes")
        : (tr ? "Hayır" : "No"),
    ],
    [
      tr ? "Hakediş para birimi" : "Payout currency",
      values.default_currency,
    ],
  ];

  if (submission.status === "success") {
    return (
      <main className="inner-page supplier-join section-pad">
        <div className="supplier-success-card">
          <span className="success-icon">✓</span>

          <span className="eyebrow">
            {tr
              ? "BAŞVURU ALINDI"
              : "APPLICATION RECEIVED"}
          </span>

          <h1>
            {tr
              ? "Tedarikçi başvurunuz incelemeye alındı."
              : "Your supplier application is under review."}
          </h1>

          <p>{submission.message}</p>

          <div className="success-security">
            <strong>
              {tr
                ? "Şimdi ne olacak?"
                : "What happens next?"}
            </strong>

            <p>
              {tr
                ? "SkyTripTransfer operasyon ekibi şirket ve belgelerinizi inceleyecek. Onay tamamlanmadan portal hesabınız operasyonlara erişemez."
                : "The SkyTripTransfer operations team will review your company and documents. Your portal account cannot access operations until approval is completed."}
            </p>
          </div>

          <a className="button primary" href="/">
            {tr ? "Ana Sayfaya Dön" : "Return Home"}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="inner-page supplier-join section-pad">
      <div className="page-intro supplier-intro">
        <span className="eyebrow">
          SKYTRIPTRANSFER SUPPLIER NETWORK
        </span>

        <h1>
          {tr
            ? "Global transfer ağımıza katılın."
            : "Join our global transfer network."}
        </h1>

        <p>
          {tr
            ? "Şirketinizi, operasyon kapasitenizi ve uyumluluk belgelerinizi gönderin. Başvurunuz doğrulandıktan sonra SkyTripTransfer tedarikçi portalına erişebilirsiniz."
            : "Submit your company, operational capacity and compliance information. Once verified, your company can access the SkyTripTransfer supplier portal."}
        </p>
      </div>

      <div className="supplier-application-shell">
        <aside className="supplier-stepper">
          <div className="stepper-head">
            <small>
              {tr
                ? "TEDARİKÇİ ONBOARDING"
                : "SUPPLIER ONBOARDING"}
            </small>

            <strong>
              {tr
                ? `Adım ${step + 1} / ${steps.length}`
                : `Step ${step + 1} of ${steps.length}`}
            </strong>
          </div>

          <div className="supplier-step-list">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                className={
                  index === step
                    ? "active"
                    : index < step
                    ? "complete"
                    : ""
                }
                onClick={() => {
                  if (index < step) {
                    setStep(index);
                  }
                }}
              >
                <span>
                  {index < step ? "✓" : index + 1}
                </span>

                <div>
                  <small>
                    {String(index + 1).padStart(2, "0")}
                  </small>
                  <strong>{label}</strong>
                </div>
              </button>
            ))}
          </div>

          <div className="supplier-trust-note">
            <span>✓</span>
            <div>
              <strong>
                {tr
                  ? "Doğrulanmış ağ"
                  : "Verified network"}
              </strong>
              <p>
                {tr
                  ? "Her şirket operasyona erişmeden önce manuel olarak incelenir."
                  : "Every company is reviewed before gaining operational access."}
              </p>
            </div>
          </div>
        </aside>

        <form
          ref={formRef}
          className="public-form supplier-wizard"
          onSubmit={submit}
        >
          <div className="wizard-progress">
            <div
              style={{
                width: `${
                  ((step + 1) / steps.length) * 100
                }%`,
              }}
            />
          </div>

          {step === 0 && (
            <section
              className="supplier-step-panel"
              data-step="0"
            >
              <StepHeader
                number="01"
                eyebrow={
                  tr
                    ? "ŞİRKET PROFİLİ"
                    : "COMPANY PROFILE"
                }
                title={
                  tr
                    ? "Şirketinizi tanıyalım."
                    : "Tell us about your company."
                }
                text={
                  tr
                    ? "Yasal şirket ve merkez bilgilerinizi girin."
                    : "Provide your legal company and headquarters information."
                }
              />

              <div className="form-grid">
                <Field
                  label={
                    tr
                      ? "Ticari marka / şirket adı *"
                      : "Trading / company name *"
                  }
                  name="company_name"
                  value={values.company_name}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Yasal şirket unvanı"
                      : "Legal company name"
                  }
                  name="legal_name"
                  value={values.legal_name}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Kuruluş yılı"
                      : "Year founded"
                  }
                  name="founded_year"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={values.founded_year}
                  onChange={updateValue}
                />

                <Field
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://"
                  value={values.website}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Vergi numarası"
                      : "Tax number"
                  }
                  name="tax_number"
                  value={values.tax_number}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Şirket kayıt numarası"
                      : "Company registration number"
                  }
                  name="registration_number"
                  value={values.registration_number}
                  onChange={updateValue}
                />
              </div>

              <div className="form-subheading">
                <strong>
                  {tr
                    ? "Şirket merkezi"
                    : "Registered headquarters"}
                </strong>
                <span>
                  {tr
                    ? "Şirketinizin kayıtlı merkez adresi."
                    : "The registered headquarters of your company."}
                </span>
              </div>

              <div className="form-grid">
                <Field
                  label={tr ? "Ülke *" : "Country *"}
                  name="country_name"
                  value={values.country_name}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "ISO ülke kodu *"
                      : "ISO country code *"
                  }
                  name="country_code"
                  placeholder="TR, ES, AE"
                  minLength="2"
                  maxLength="2"
                  value={values.country_code}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={tr ? "Şehir *" : "City *"}
                  name="city"
                  value={values.city}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Eyalet / Bölge"
                      : "State / Region"
                  }
                  name="state_region"
                  value={values.state_region}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Posta kodu"
                      : "Postal code"
                  }
                  name="postal_code"
                  value={values.postal_code}
                  onChange={updateValue}
                />

                <label className="field">
                  <span>
                    {tr
                      ? "Kayıtlı adres"
                      : "Registered address"}
                  </span>

                  <textarea
                    name="address"
                    rows="3"
                    value={values.address}
                    onChange={updateValue}
                  />
                </label>
              </div>
            </section>
          )}

          {step === 1 && (
            <section
              className="supplier-step-panel"
              data-step="1"
            >
              <StepHeader
                number="02"
                eyebrow={
                  tr
                    ? "YETKİLİ KİŞİ"
                    : "AUTHORIZED CONTACT"
                }
                title={
                  tr
                    ? "Kiminle iletişim kuracağız?"
                    : "Who should we contact?"
                }
                text={
                  tr
                    ? "Başvurudan ve tedarikçi hesabından sorumlu yetkiliyi belirtin."
                    : "Provide the person responsible for this application and supplier account."
                }
              />

              <div className="form-grid">
                <Field
                  label={
                    tr ? "Ad soyad *" : "Full name *"
                  }
                  name="contact_name"
                  autoComplete="name"
                  value={values.contact_name}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Görev / Unvan"
                      : "Job title"
                  }
                  name="contact_title"
                  placeholder={
                    tr
                      ? "Genel Müdür, Operasyon Müdürü..."
                      : "CEO, Operations Manager..."
                  }
                  value={values.contact_title}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Kurumsal e-posta *"
                      : "Company email *"
                  }
                  name="company_email"
                  type="email"
                  autoComplete="email"
                  value={values.company_email}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Telefon *"
                      : "Phone *"
                  }
                  name="company_phone"
                  type="tel"
                  autoComplete="tel"
                  value={values.company_phone}
                  onChange={updateValue}
                  required
                />

                <Field
                  label="WhatsApp"
                  name="whatsapp"
                  type="tel"
                  value={values.whatsapp}
                  onChange={updateValue}
                />

                <label className="field">
                  <span>
                    {tr
                      ? "Tercih edilen iletişim dili"
                      : "Preferred communication language"}
                  </span>

                  <select
                    name="preferred_language"
                    value={values.preferred_language}
                    onChange={updateValue}
                  >
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {step === 2 && (
            <section
              className="supplier-step-panel"
              data-step="2"
            >
              <StepHeader
                number="03"
                eyebrow={
                  tr
                    ? "OPERASYON KAPASİTESİ"
                    : "OPERATIONAL COVERAGE"
                }
                title={
                  tr
                    ? "Nerelerde ve hangi kapasitede çalışıyorsunuz?"
                    : "Where and at what scale do you operate?"
                }
                text={
                  tr
                    ? "Doğru transferlerin şirketinizle eşleştirilebilmesi için operasyon kapsamınızı belirtin."
                    : "Define your operational footprint so suitable transfer opportunities can be matched with your company."
                }
              />

              <div className="form-grid">
                <label className="field wide">
                  <span>
                    {tr
                      ? "Hizmet verilen ülke / şehirler *"
                      : "Countries / cities served *"}
                  </span>

                  <textarea
                    name="service_regions"
                    rows="4"
                    placeholder={
                      tr
                        ? "Örn: Türkiye - İstanbul, Antalya; İspanya - Madrid, Barcelona"
                        : "Example: Türkiye - Istanbul, Antalya; Spain - Madrid, Barcelona"
                    }
                    value={values.service_regions}
                    onChange={updateValue}
                    required
                  />
                </label>

                <label className="field wide">
                  <span>
                    {tr
                      ? "Hizmet verilen havalimanları"
                      : "Airports served"}
                  </span>

                  <textarea
                    name="service_airports"
                    rows="3"
                    placeholder="IST, SAW, AYT, MAD, BCN..."
                    value={values.service_airports}
                    onChange={updateValue}
                  />
                </label>

                <Field
                  label={
                    tr
                      ? "Aktif araç sayısı *"
                      : "Active fleet size *"
                  }
                  name="fleet_size"
                  type="number"
                  min="1"
                  value={values.fleet_size}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Aktif sürücü sayısı"
                      : "Active drivers"
                  }
                  name="driver_count"
                  type="number"
                  min="0"
                  value={values.driver_count}
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Aylık transfer kapasitesi"
                      : "Monthly transfer capacity"
                  }
                  name="monthly_transfer_capacity"
                  type="number"
                  min="0"
                  value={
                    values.monthly_transfer_capacity
                  }
                  onChange={updateValue}
                />

                <Field
                  label={
                    tr
                      ? "Hakediş para birimi *"
                      : "Payout currency *"
                  }
                  name="default_currency"
                  minLength="3"
                  maxLength="3"
                  value={values.default_currency}
                  onChange={updateValue}
                  required
                />

                <label className="field wide">
                  <span>
                    {tr
                      ? "Araç sınıfları *"
                      : "Vehicle classes *"}
                  </span>

                  <textarea
                    name="vehicle_types"
                    rows="3"
                    placeholder={
                      tr
                        ? "Sedan, Business Sedan, Minivan, Minibüs..."
                        : "Sedan, Business Sedan, Minivan, Minibus..."
                    }
                    value={values.vehicle_types}
                    onChange={updateValue}
                    required
                  />
                </label>
              </div>

              <label className="supplier-switch">
                <input
                  type="checkbox"
                  name="support_24_7"
                  checked={values.support_24_7}
                  onChange={updateValue}
                />

                <span className="switch-ui" />

                <div>
                  <strong>
                    {tr
                      ? "7/24 operasyon desteğimiz var"
                      : "We provide 24/7 operational support"}
                  </strong>
                  <small>
                    {tr
                      ? "Gece, hafta sonu ve acil transferler için ulaşılabilir operasyon ekibi."
                      : "An operations team available for nights, weekends and urgent transfers."}
                  </small>
                </div>
              </label>
            </section>
          )}

          {step === 3 && (
            <section
              className="supplier-step-panel"
              data-step="3"
            >
              <StepHeader
                number="04"
                eyebrow={
                  tr
                    ? "UYUMLULUK"
                    : "COMPLIANCE"
                }
                title={
                  tr
                    ? "Şirket belgelerinizi doğrulayalım."
                    : "Let's verify your company."
                }
                text={
                  tr
                    ? "PDF veya görsel formatında, belge başına en fazla 10 MB yükleyebilirsiniz."
                    : "Upload PDF or image files up to 10 MB per document."
                }
              />

              <div className="document-grid">
                <SupplierDocumentUpload
                  label={
                    tr
                      ? "Şirket kayıt belgesi"
                      : "Company registration"
                  }
                  description={
                    tr
                      ? "Ticaret sicili veya resmi şirket kayıt belgesi."
                      : "Official commercial/company registration document."
                  }
                  name="company_registration_file"
                  file={
                    files.company_registration_file
                  }
                  onChange={updateFile}
                  required
                />

                <SupplierDocumentUpload
                  label={
                    tr
                      ? "Vergi belgesi"
                      : "Tax document"
                  }
                  description={
                    tr
                      ? "Geçerli vergi kaydı veya vergi sertifikası."
                      : "Valid tax registration or tax certificate."
                  }
                  name="tax_document_file"
                  file={files.tax_document_file}
                  onChange={updateFile}
                  required
                />

                <SupplierDocumentUpload
                  label={
                    tr
                      ? "Sigorta belgesi"
                      : "Insurance certificate"
                  }
                  description={
                    tr
                      ? "Şirket veya operasyon sorumluluk sigortası."
                      : "Company or operational liability insurance."
                  }
                  name="insurance_file"
                  file={files.insurance_file}
                  onChange={updateFile}
                  required
                />

                <SupplierDocumentUpload
                  label={
                    tr
                      ? "Taşıma / turizm lisansı"
                      : "Transport / tourism licence"
                  }
                  description={
                    tr
                      ? "Bulunduğunuz ülkede uygulanıyorsa yükleyin."
                      : "Upload when applicable in your operating country."
                  }
                  name="transport_license_file"
                  file={
                    files.transport_license_file
                  }
                  onChange={updateFile}
                />
              </div>

              <div className="document-security-note">
                <span>🔒</span>
                <p>
                  {tr
                    ? "Belgeler yalnızca şirket doğrulama ve tedarikçi uyumluluk incelemesi için kullanılır."
                    : "Documents are used solely for company verification and supplier compliance review."}
                </p>
              </div>
            </section>
          )}

          {step === 4 && (
            <section
              className="supplier-step-panel"
              data-step="4"
            >
              <StepHeader
                number="05"
                eyebrow={
                  tr
                    ? "TEDARİKÇİ PORTALI"
                    : "SUPPLIER PORTAL"
                }
                title={
                  tr
                    ? "Güvenli portal hesabınızı oluşturun."
                    : "Create your secure portal access."
                }
                text={
                  tr
                    ? "Hesabınız şimdi oluşturulur ancak başvurunuz onaylanana kadar aktif olmaz."
                    : "Your account will be created now but remains inactive until your application is approved."
                }
              />

              <div className="portal-explainer">
                <div>
                  <span>01</span>
                  <strong>
                    {tr ? "Başvur" : "Apply"}
                  </strong>
                  <small>
                    {tr
                      ? "Bilgilerinizi gönderin"
                      : "Submit company details"}
                  </small>
                </div>

                <div>
                  <span>02</span>
                  <strong>
                    {tr ? "Doğrulama" : "Verification"}
                  </strong>
                  <small>
                    {tr
                      ? "Ekibimiz belgeleri inceler"
                      : "Our team reviews documents"}
                  </small>
                </div>

                <div>
                  <span>03</span>
                  <strong>
                    {tr ? "Aktivasyon" : "Activation"}
                  </strong>
                  <small>
                    {tr
                      ? "Portal erişimi açılır"
                      : "Portal access is enabled"}
                  </small>
                </div>
              </div>

              <div className="form-grid">
                <Field
                  label={
                    tr
                      ? "Portal şifresi *"
                      : "Portal password *"
                  }
                  name="portal_password"
                  type="password"
                  autoComplete="new-password"
                  minLength="8"
                  value={values.portal_password}
                  onChange={updateValue}
                  required
                />

                <Field
                  label={
                    tr
                      ? "Şifre tekrarı *"
                      : "Confirm password *"
                  }
                  name="portal_password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength="8"
                  value={
                    values.portal_password_confirmation
                  }
                  onChange={updateValue}
                  required
                />
              </div>

              <p className="password-hint">
                {tr
                  ? "En az 8 karakter, en az bir harf ve bir rakam kullanın."
                  : "Use at least 8 characters including at least one letter and one number."}
              </p>
            </section>
          )}

          {step === 5 && (
            <section
              className="supplier-step-panel"
              data-step="5"
            >
              <StepHeader
                number="06"
                eyebrow={
                  tr
                    ? "SON KONTROL"
                    : "FINAL REVIEW"
                }
                title={
                  tr
                    ? "Başvurunuzu göndermeye hazırsınız."
                    : "Your application is ready."
                }
                text={
                  tr
                    ? "Göndermeden önce temel şirket ve operasyon bilgilerinizi kontrol edin."
                    : "Review your key company and operational information before submitting."
                }
              />

              <div className="supplier-review-grid">
                {reviewRows.map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value || "—"}</strong>
                  </div>
                ))}
              </div>

              <div className="review-documents">
                <h3>
                  {tr
                    ? "Yüklenen belgeler"
                    : "Uploaded documents"}
                </h3>

                {Object.entries(files).map(
                  ([key, file]) => (
                    <div key={key}>
                      <span>
                        {file ? "✓" : "—"}
                      </span>
                      <strong>
                        {key ===
                        "company_registration_file"
                          ? tr
                            ? "Şirket kayıt belgesi"
                            : "Company registration"
                          : key === "tax_document_file"
                          ? tr
                            ? "Vergi belgesi"
                            : "Tax document"
                          : key === "insurance_file"
                          ? tr
                            ? "Sigorta belgesi"
                            : "Insurance certificate"
                          : tr
                          ? "Taşıma / turizm lisansı"
                          : "Transport / tourism licence"}
                      </strong>
                      <small>
                        {file?.name ||
                          (tr
                            ? "Yüklenmedi"
                            : "Not uploaded")}
                      </small>
                    </div>
                  )
                )}
              </div>

              <label className="consent review-consent">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={values.terms_accepted}
                  onChange={updateValue}
                />

                <span>
                  {tr
                    ? "Verdiğim bilgilerin doğru olduğunu, SkyTripTransfer'ın şirket ve belgeleri doğrulama amacıyla inceleyebileceğini ve başvuru onaylanmadan tedarikçi hesabının operasyonlara erişemeyeceğini kabul ediyorum."
                    : "I confirm that the information provided is accurate, that SkyTripTransfer may review the company and documents for verification, and that the supplier account cannot access operations before approval."}
                </span>
              </label>
            </section>
          )}

          {submission.status !== "idle" && (
            <p
              className={`form-notice ${submission.status}`}
              role="status"
            >
              {submission.message}
            </p>
          )}

          <div className="wizard-actions">
            <button
              className="button ghost"
              type="button"
              onClick={previousStep}
              disabled={step === 0}
            >
              ← {tr ? "Geri" : "Back"}
            </button>

            <span className="step-counter">
              {String(step + 1).padStart(2, "0")} /{" "}
              {String(steps.length).padStart(2, "0")}
            </span>

            {step < steps.length - 1 ? (
              <button
                className="button primary"
                type="button"
                onClick={nextStep}
              >
                {tr ? "Devam Et" : "Continue"}
                <span>→</span>
              </button>
            ) : (
              <button
                className="button primary"
                type="submit"
                disabled={
                  submission.status === "submitting"
                }
              >
                {submission.status === "submitting"
                  ? tr
                    ? "Gönderiliyor..."
                    : "Submitting..."
                  : tr
                  ? "Başvuruyu Gönder"
                  : "Submit Application"}

                <span>→</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function StepHeader({
  number,
  eyebrow,
  title,
  text,
}) {
  return (
    <div className="supplier-step-header">
      <span className="step-number">{number}</span>

      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function SupplierDocumentUpload({
  label,
  description,
  file,
  required = false,
  ...props
}) {
  return (
    <label
      className={`supplier-document-card ${
        file ? "has-file" : ""
      }`}
    >
      <span className="document-icon">
        {file ? "✓" : "↑"}
      </span>

      <div>
        <strong>
          {label}
          {required ? " *" : ""}
        </strong>

        <p>{description}</p>

        <small>
          {file
            ? file.name
            : "PDF, JPG, PNG, WEBP · MAX 10 MB"}
        </small>
      </div>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        required={required}
        {...props}
      />
    </label>
  );
}
function FormSection({ number, title, children }) { return <fieldset><legend><span>{number}</span>{title}</legend><div className="form-grid">{children}</div></fieldset>; }
function Field({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props} /></label>; }
function FileField({ label, ...props }) { return <label className="field file-field"><span>{label}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" {...props} /></label>; }

function Footer({ language }) {
  const tr = language === "tr";
  return <footer className="site-footer section-pad"><a className="brand footer-brand" href="/"><span className="brand-mark"><i />ST</span><span><strong>SKYTRIP</strong><em>TRANSFER</em><small>Global Mobility Network</small></span></a><p>{tr ? "Global havalimanı transfer operasyonları ve tedarikçi ağı." : "Global airport transfer operations and supplier network."}</p><div><a href="/transfer">{tr ? "Transfer" : "Book a transfer"}</a><a href="/supplier/join">{tr ? "Tedarikçi ol" : "Become a supplier"}</a><a href="/supplier/">{tr ? "Giriş" : "Login"}</a></div><small>© 2026 SkyTripTransfer. All rights reserved.</small></footer>;
}

function getPage(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/transfer") return "transfer";
  if (normalized === "/supplier/join") return "supplier";
  return "home";
}
