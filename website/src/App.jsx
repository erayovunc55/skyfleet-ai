import AgencyJoinPage from "./components/AgencyJoinPage";
import HomeExperience from "./components/HomeExperience";
import AboutExperience from "./components/AboutExperience";
import transferHeroImage from "./assets/premium/hero-experience-v1.png";
import executiveVehicleImage from "./assets/premium/service-eclass.jpg";
import vanVehicleImage from "./assets/premium/service-vito.jpg";
import luxuryVehicleImage from "./assets/premium/service-sclass.jpg";
import bosphorusTourImage from "./assets/tours/bosphorus.jpg";
import islandsTourImage from "./assets/tours/islands.jpg";
import princeIslandsPoster from "./assets/tours/prince-islands.jpeg";
import ancientIstanbulPoster from "./assets/tours/ancient-istanbul.jpeg";
import bosphorusPanoramaPoster from "./assets/tours/bosphorus-panorama.jpeg";
import historyConstantinoplePoster from "./assets/tours/history-constantinople.jpeg";
import nightBosphorusPoster from "./assets/tours/night-bosphorus.jpeg";
import yalovaThermalPoster from "./assets/tours/yalova-thermal.jpeg";
import floryaAquariumPoster from "./assets/tours/florya-aquarium.jpeg";
import vialandPoster from "./assets/tours/vialand.jpeg";
import twoContinentsPoster from "./assets/tours/two-continents.jpeg";
import livingHistoryPoster from "./assets/tours/living-history.jpeg";
import byzantineHeritagePoster from "./assets/tours/byzantine-heritage.jpeg";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import "./mobile-menu.css";
import "./form-status.css";
import "./transfer-premium.css";
import "./styles/experience.css";
import "./styles/tour-packages.css";
import "./styles/tour-booking.css";
import "./styles/mobile-polish.css";
const SUPPLIER_PORTAL_URL = "/supplier/";
const AGENCY_PORTAL_URL = "/agency/";
const PUBLIC_API_BASE = "/api/index.php/public";

let googlePlacesLibraryPromise = null;

function loadGooglePlacesLibrary() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY is not configured."),
    );
  }

  if (window.google?.maps?.Geocoder) {
    return Promise.resolve(window.google.maps);
  }

  if (googlePlacesLibraryPromise) {
    return googlePlacesLibraryPromise;
  }

  googlePlacesLibraryPromise = new Promise((resolve, reject) => {
    const finishLoading = () => {
      try {
        if (!window.google?.maps?.Geocoder) {
          throw new Error("Google Maps JavaScript API did not initialize Geocoder.");
        }
        resolve(window.google.maps);
      } catch (error) {
        googlePlacesLibraryPromise = null;
        reject(error);
      }
    };

    const existingScript = document.querySelector(
      'script[data-skyfleet-google-maps="1"]',
    );

    if (existingScript) {
      if (window.google?.maps?.Geocoder) {
        finishLoading();
      } else {
        existingScript.addEventListener("load", finishLoading, { once: true });
        existingScript.addEventListener(
          "error",
          () => {
            googlePlacesLibraryPromise = null;
            reject(new Error("Google Maps JavaScript API could not be loaded."));
          },
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.dataset.skyfleetGoogleMaps = "1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", finishLoading, { once: true });
    script.addEventListener(
      "error",
      () => {
        googlePlacesLibraryPromise = null;
        reject(new Error("Google Maps JavaScript API could not be loaded."));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return googlePlacesLibraryPromise;
}

function googleAddressComponent(components, wantedTypes) {
  const item = (components || []).find((component) =>
    (component.types || []).some((type) => wantedTypes.includes(type)),
  );

  return (
    item?.longText ||
    item?.long_name ||
    item?.shortText ||
    item?.short_name ||
    null
  );
}

async function resolveGooglePlaceSuggestion(suggestion) {
  if (!suggestion?.place_id) {
    throw new Error("Google place ID is missing.");
  }

  let googleError = null;

  try {
    const maps = await loadGooglePlacesLibrary();
    const geocoder = new maps.Geocoder();

    const geocodeResponse = await Promise.race([
      geocoder.geocode({ placeId: suggestion.place_id }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Google Geocoder timeout.")), 6000),
      ),
    ]);

    const result = geocodeResponse?.results?.[0];
    const rawLatitude =
      typeof result?.geometry?.location?.lat === "function"
        ? result.geometry.location.lat()
        : null;
    const rawLongitude =
      typeof result?.geometry?.location?.lng === "function"
        ? result.geometry.location.lng()
        : null;

    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const components = result?.address_components || [];
      const formattedAddress =
        result?.formatted_address ||
        suggestion.formatted_address ||
        suggestion.label ||
        suggestion.name ||
        "";

      return {
        ...suggestion,
        label: formattedAddress,
        name: suggestion.name || formattedAddress,
        formatted_address: formattedAddress,
        latitude,
        longitude,
        country: googleAddressComponent(components, ["country"]) || suggestion.country || null,
        city:
          googleAddressComponent(components, [
            "locality",
            "postal_town",
            "administrative_area_level_2",
            "administrative_area_level_1",
          ]) || suggestion.city || null,
        postcode: googleAddressComponent(components, ["postal_code"]) || suggestion.postcode || null,
        provider: "google_maps",
        is_airport: Boolean(suggestion.is_airport),
      };
    }

    throw new Error("Google Geocoder did not return coordinates.");
  } catch (error) {
    googleError = error;
    console.warn("Google Geocoder failed; trying backend place details.", error);
  }

  try {
    const response = await axios.get(`${PUBLIC_API_BASE}/address-search`, {
      params: {
        place_id: suggestion.place_id,
        fallback_query:
          suggestion.formatted_address ||
          suggestion.label ||
          suggestion.name,
      },
      timeout: 4500,
    });

    const resolved = response.data?.data;
    const latitude = Number(resolved?.latitude);
    const longitude = Number(resolved?.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        ...suggestion,
        ...resolved,
        latitude,
        longitude,
        provider: resolved?.provider || "google_maps",
        is_airport: Boolean(suggestion.is_airport),
      };
    }
  } catch (backendError) {
    console.error("Google coordinate resolution failed.", {
      googleError,
      backendError,
      placeId: suggestion.place_id,
    });
  }

  throw new Error("Selected location coordinates could not be resolved.");
}

function queryHasAirportIntent(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    (/^[a-z]{3,4}$/.test(normalized.trim()) && normalized.trim().length <= 4) ||
    [
      "airport",
      "havalimani",
      "havaliman",
      "havaalani",
      "hava alani",
      "aeroport",
      "aeropuerto",
      "aeroporto",
      "flughafen",
      "sabiha",
    ].some((term) => normalized.includes(term))
  );
}

const content = {
  en: {
    nav: { home: "Home", about: "About us", tours: "Tour packages", transfer: "Book a Transfer", suppliers: "Become a Supplier", login: "Supplier Login" },
    heroEyebrow: "GLOBAL GROUND TRANSPORTATION NETWORK",
    heroTitle: "Airport transfers, operated with confidence.",
    heroText: "Book reliable airport transportation or join our growing supplier network. SkyTripTransfer connects passengers, professional drivers and local operators through one operational platform.",
    book: "Book a Transfer",
    join: "Drive With Us",
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
    nav: { home: "Ana Sayfa", about: "Hakkımızda", tours: "Tur Paketleri", transfer: "Transfer Rezervasyonu", suppliers: "Tedarikçi Ol", login: "Tedarikçi Girişi" },
    heroEyebrow: "GLOBAL KARAYOLU ULAŞIM AĞI",
    heroTitle: "Havalimanı transferlerinde güvenilir operasyon.",
    heroText: "Güvenilir bir transfer rezervasyonu yapın veya büyüyen tedarikçi ağımıza katılın. SkyTripTransfer; yolcuları, profesyonel sürücüleri ve yerel operasyon şirketlerini tek platformda buluşturur.",
    book: "Transfer Rezervasyonu Yap",
    join: "Bizimle Sürün",
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

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function changeLanguage(nextLanguage) {
    window.localStorage.setItem("skytriptransfer-language", nextLanguage);
    setLanguage(nextLanguage);
  }

  return (
    <div className="site-shell">
      <Header language={language} setLanguage={changeLanguage} t={t} page={page} />
      {page === "transfer" ? (
  <TransferPage language={language} />
) : page === "tour-booking" ? (
  <TourBookingPage language={language} />
) : page === "booking-success" ? (
  <BookingSuccessPage language={language} />
) : page === "supplier" ? (
  <SupplierJoinPage language={language} />
) : page === "agency" ? (
  <AgencyJoinPage language={language} />
) : page === "about" ? (
  <AboutExperience language={language} />
) : page === "tours" ? (
  <TourPackagesPage language={language} />
) : (
  <HomeExperience language={language} booking={<HomeBookingCard language={language} />} />
)}
      <Footer language={language} />
    </div>
  );
}


function BookingSuccessPage({ language }) {
  const tr = language === "tr";
  const params = new URLSearchParams(window.location.search);
  const isTour = params.get("type") === "tour";
  const isTransferPayment = params.get("type") === "transfer" && Boolean(params.get("session_id"));

  if (isTransferPayment) {
    return (
      <TransferPaymentConfirmationPage
        language={language}
        sessionId={params.get("session_id")}
        reference={params.get("reference") || ""}
      />
    );
  }

  const reference = params.get("ref") || "";
  const tour = params.get("tour") || "";
  const guests = params.get("guests") || "";
  const pickup = params.get("pickup") || "";
  const dropoff = params.get("dropoff") || "";
  const vehicle = params.get("vehicle") || "";
  const price = params.get("price") || "";
  const currency = params.get("currency") || "";
  const date = params.get("date") || "";
  const time = params.get("time") || "";

  return (
    <main className="booking-success-page">
      <section className="booking-success-card">
        <div className="booking-success-icon">✓</div>
        <span className="booking-success-eyebrow">{tr ? "REZERVASYON TALEBİ ALINDI" : "BOOKING REQUEST RECEIVED"}</span>
        <h1>{tr ? "Teşekkür ederiz." : "Thank you."}</h1>
        <p className="booking-success-lead">
          {tr
            ? isTour
              ? "Tur rezervasyon talebiniz alındı. Ekibimiz turun müsaitliğini ve buluşma noktasını teyit ederek sizinle iletişime geçecektir."
              : "Transfer talebiniz başarıyla oluşturuldu. Operasyon ekibimiz talebinizi kontrol ederek sizinle iletişime geçecektir."
            : isTour
              ? "Your tour reservation request has been received. Our team will confirm availability and the meeting point with you."
              : "Your transfer request has been created successfully. Our operations team will review it and contact you shortly."}
        </p>

        {reference && (
          <div className="booking-success-reference">
            <span>{tr ? "Talep numaranız" : "Your reference"}</span>
            <strong>{reference}</strong>
          </div>
        )}

        <div className="booking-success-summary">
          {isTour && tour && <div><span>{tr ? "Tur" : "Tour"}</span><strong>{tour}</strong></div>}
          {isTour && guests && <div><span>{tr ? "Misafir sayısı" : "Guests"}</span><strong>{guests}</strong></div>}
          {(pickup || dropoff) && <div><span>{tr ? "Güzergâh" : "Route"}</span><strong>{pickup} {pickup && dropoff ? "→" : ""} {dropoff}</strong></div>}
          {(date || time) && <div><span>{isTour ? tr ? "Tur tarihi" : "Tour date" : tr ? "Alış zamanı" : "Pickup time"}</span><strong>{date} {time}</strong></div>}
          {vehicle && <div><span>{tr ? "Araç" : "Vehicle"}</span><strong>{vehicle}</strong></div>}
          {price && <div><span>{tr ? "Seçilen fiyat" : "Selected price"}</span><strong>{currency} {Number(price).toFixed(2)}</strong></div>}
        </div>

        <div className="booking-success-actions">
          <a className="button primary" href="/">{tr ? "Ana Sayfaya Dön" : "Back to Home"}</a>
          <a className="button secondary" href={isTour ? "/tour-packages" : "/transfer"}>{isTour ? tr ? "Turlara Dön" : "Back to Tours" : tr ? "Yeni Transfer Oluştur" : "Book Another Transfer"}</a>
        </div>
      </section>
    </main>
  );
}

function TransferPaymentConfirmationPage({ language, sessionId, reference }) {
  const tr = language === "tr";
  const [state, setState] = useState({ status: "loading", data: null, message: "" });

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      try {
        const response = await axios.get(
          `${PUBLIC_API_BASE}/transfer-payments/confirm`,
          { params: { session_id: sessionId } },
        );

        if (cancelled) return;

        const data = response.data?.data;

        if (data?.payment_status === "paid") {
          setState({ status: "paid", data, message: "" });
        } else {
          setState({
            status: "pending",
            data,
            message: tr
              ? "Ödemeniz henüz onaylanmadı. Birkaç saniye içinde tekrar kontrol edebilir ya da operasyon ekibimizle iletişime geçebilirsiniz."
              : "Your payment has not been confirmed yet. Please check again shortly or contact our operations team.",
          });
        }
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          data: null,
          message:
            error.response?.data?.message ||
            (tr
              ? "Ödeme bilgileriniz doğrulanamadı. Lütfen destek ekibimizle iletişime geçin."
              : "We could not verify your payment. Please contact our support team."),
        });
      }
    }

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [sessionId, tr]);

  const data = state.data;

  return (
    <main className="booking-success-page">
      <section className="booking-success-card">
        {state.status === "loading" && (
          <>
            <div className="booking-success-icon">…</div>
            <span className="booking-success-eyebrow">{tr ? "ÖDEME DOĞRULANIYOR" : "VERIFYING PAYMENT"}</span>
            <h1>{tr ? "Lütfen bekleyin." : "Please wait."}</h1>
            <p className="booking-success-lead">
              {tr
                ? "Ödemeniz Stripe ile doğrulanıyor, bu işlem birkaç saniye sürebilir."
                : "We are confirming your payment with Stripe. This should only take a few seconds."}
            </p>
          </>
        )}

        {state.status === "paid" && (
          <>
            <div className="booking-success-icon">✓</div>
            <span className="booking-success-eyebrow">{tr ? "ÖDEME ALINDI · REZERVASYON TAMAMLANDI" : "PAYMENT RECEIVED · BOOKING COMPLETE"}</span>
            <h1>{tr ? "Teşekkür ederiz." : "Thank you."}</h1>
            <p className="booking-success-lead">
              {tr
                ? "Ödemeniz başarıyla alındı ve transfer rezervasyonunuz tamamlandı. Operasyon ekibimiz sürücü atamasını gerçekleştirecektir."
                : "Your payment has been received and your transfer booking is complete. Our operations team will take care of the driver assignment."}
            </p>

            {data?.request_reference && (
              <div className="booking-success-reference">
                <span>{tr ? "Talep numaranız" : "Your reference"}</span>
                <strong>{data.request_reference}</strong>
              </div>
            )}

            <div className="booking-success-summary">
              {(data?.pickup || data?.dropoff) && (
                <div>
                  <span>{tr ? "Güzergâh" : "Route"}</span>
                  <strong>{data.pickup} {data.pickup && data.dropoff ? "→" : ""} {data.dropoff}</strong>
                </div>
              )}
              {(data?.pickup_date || data?.pickup_time) && (
                <div>
                  <span>{tr ? "Alış zamanı" : "Pickup time"}</span>
                  <strong>{data.pickup_date} {data.pickup_time}</strong>
                </div>
              )}
              {data?.paid_amount && (
                <div>
                  <span>{tr ? "Ödenen tutar" : "Amount paid"}</span>
                  <strong>{data.paid_currency} {Number(data.paid_amount).toFixed(2)}</strong>
                </div>
              )}
            </div>
          </>
        )}

        {(state.status === "pending" || state.status === "error") && (
          <>
            <div className="booking-success-icon">!</div>
            <span className="booking-success-eyebrow">{tr ? "ÖDEME DOĞRULANAMADI" : "PAYMENT NOT CONFIRMED"}</span>
            <h1>{tr ? "Bir sorun oluştu." : "Something needs attention."}</h1>
            <p className="booking-success-lead">{state.message}</p>

            {reference && (
              <div className="booking-success-reference">
                <span>{tr ? "Talep numaranız" : "Your reference"}</span>
                <strong>{reference}</strong>
              </div>
            )}
          </>
        )}

        <div className="booking-success-actions">
          <a className="button primary" href="/">{tr ? "Ana Sayfaya Dön" : "Back to Home"}</a>
          <a className="button secondary" href="/transfer">{tr ? "Yeni Transfer Oluştur" : "Book Another Transfer"}</a>
        </div>
      </section>
    </main>
  );
}

function Header({ language, setLanguage, t, page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [partnerMenuOpen, setPartnerMenuOpen] = useState(false);

  return (
    <header className={`site-header ${page === "home" ? "home-header" : ""}`}>
      <a className="brand" href="/" aria-label={language === "tr" ? "SKYFLEET ana sayfa" : "SKYFLEET home"}>
        <span className="brand-mark"><i />ST</span>
        <span><strong>SKYFLEET</strong><em></em><small>GLOBAL TRANSFERS</small></span>
      </a>
      <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
        <a className={page === "home" ? "active" : ""} href="/">{t.nav.home}</a>
        <a className={page === "about" ? "active" : ""} href="/about">{t.nav.about}</a>
        <a className={page === "tours" ? "active" : ""} href="/tour-packages">{t.nav.tours}</a>
        <a className={page === "transfer" ? "active" : ""} href="/transfer">{t.nav.transfer}</a>
        <a className={page === "supplier" ? "active" : ""} href="/supplier/join">{t.nav.suppliers}</a>
        <a
  className={page === "agency" ? "active" : ""}
  href="/agency/join"
>
  {language === "tr" ? "Acenta Ol" : "Become an Agency"}
</a>
      </nav>
      <div className="header-actions">
        <button className="language" type="button" onClick={() => setLanguage(language === "en" ? "tr" : "en")}>{language === "en" ? "TR" : "EN"}</button>
        <div className="partner-login-wrap">
  <button
    className="portal-link"
    type="button"
    onClick={() => setPartnerMenuOpen((current) => !current)}
  >
    {language === "tr" ? "Partner Girişi" : "Partner Login"}
  </button>

  {partnerMenuOpen && (
    <div className="partner-login-menu">
      <a href={SUPPLIER_PORTAL_URL}>
        <strong>
          {language === "tr" ? "Tedarikçi Girişi" : "Supplier Login"}
        </strong>
        <small>
          {language === "tr"
            ? "Tedarikçi operasyon paneli"
            : "Supplier operations portal"}
        </small>
      </a>

      <a href={AGENCY_PORTAL_URL}>
        <strong>
          {language === "tr" ? "Acenta Girişi" : "Agency Login"}
        </strong>
        <small>
          {language === "tr"
            ? "Acenta rezervasyon paneli"
            : "Agency booking portal"}
        </small>
      </a>
    </div>
  )}
</div>   <button
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

function TourPackagesPage({ language }) {
  const tr = language === "tr";
  const featuredTours = [
    {
      id: "B1",
      region: tr ? "İSTANBUL · PRENS ADALARI" : "ISTANBUL · PRINCES' ISLANDS",
      title: tr ? "Prens Adaları" : "Prince Islands",
      description: tr
        ? "Kınalıada ve Büyükada'yı tekne gezisi, öğle yemeği ve rehber eşliğinde keşfedin."
        : "Visit Kinaliada and Buyukada with a boat trip, lunch and a professional guide.",
      tag: "B1",
      duration: "08:30–16:00",
      image: princeIslandsPoster,
      poster: true,
      price: 35,
      currency: "USD",
    },
    {
      id: "D1",
      region: tr ? "İSTANBUL · TARİH & KÜLTÜR" : "ISTANBUL · HISTORY & CULTURE",
      title: tr ? "Tarihi İstanbul" : "Ancient Istanbul",
      description: tr
        ? "Dolmabahçe Sarayı, Süleymaniye Camii ve Binbirdirek Sarnıcı'nı rehberle gezin."
        : "Explore Dolmabahce Palace, Suleymaniye Mosque and the Basilica Cistern with a guide.",
      tag: "D1",
      duration: "08:30–15:00",
      image: ancientIstanbulPoster,
      poster: true,
      price: 90,
      currency: "USD",
    },
    {
      id: "G3",
      region: tr ? "İSTANBUL · BOĞAZ" : "ISTANBUL · THE BOSPHORUS",
      title: tr ? "Panoramik Boğaz" : "Bosphorus Panorama",
      description: tr
        ? "İki saatlik tekne gezisinde köprüleri, Kız Kulesi'ni ve Rumeli Hisarı'nı görün."
        : "See the bridges, Maiden's Tower and Rumeli Fortress on a two-hour cruise.",
      tag: "G3",
      duration: "14:30–18:00",
      image: bosphorusPanoramaPoster,
      poster: true,
      price: 25,
      currency: "USD",
    },
    {
      id: "P1",
      region: tr ? "İSTANBUL · TARİH & KÜLTÜR" : "ISTANBUL · HISTORY & CULTURE",
      title: tr ? "Tarihi Konstantinopolis" : "History of Constantinople",
      description: tr
        ? "Ayasofya, Yıldız Sarayı, Galata ve Beyoğlu'nun tarihi duraklarını keşfedin."
        : "Discover historic Istanbul, from Hagia Sophia and Yildiz Palace to Galata and Beyoglu.",
      tag: "P1",
      duration: "08:30–15:00",
      image: historyConstantinoplePoster,
      poster: true,
      price: 90,
      currency: "USD",
    },
    {
      id: "G1",
      region: tr ? "İSTANBUL · BOĞAZ" : "ISTANBUL · THE BOSPHORUS",
      title: tr ? "Boğaz'da Gece" : "Night Bosphorus",
      description: tr
        ? "Akşam yemeği, içecekler ve canlı gösteri eşliğinde üç saatlik Boğaz gezisi."
        : "Enjoy a three-hour Bosphorus cruise with dinner, drinks and a live show.",
      tag: "G1",
      duration: "19:30–00:00",
      image: nightBosphorusPoster,
      poster: true,
      price: 50,
      currency: "USD",
    },
    {
      id: "T1",
      region: tr ? "YALOVA · TERMAL" : "YALOVA · THERMAL SPRINGS",
      title: tr ? "Yalova Termal" : "Yalova Thermal Springs",
      description: tr
        ? "Termal havuzlar, Türk hamamı ve sauna ile dinlendirici bir gün geçirin."
        : "Unwind with thermal pools, a traditional Turkish bath and sauna.",
      tag: "T1",
      duration: "07:00–17:00",
      image: yalovaThermalPoster,
      poster: true,
      price: 50,
      currency: "USD",
    },
    {
      id: "A1",
      region: tr ? "İSTANBUL · FLORYA" : "ISTANBUL · FLORYA",
      title: tr ? "Florya Akvaryum" : "Florya Aquarium",
      description: tr
        ? "Akvaryum giriş bileti, ulaşım ve rehberlik dahildir."
        : "Aquarium admission, transportation and a professional guide are included.",
      tag: "A1",
      duration: "09:30–14:00",
      image: floryaAquariumPoster,
      poster: true,
      price: 35,
      currency: "USD",
    },
    {
      id: "V1",
      region: tr ? "İSTANBUL · EĞLENCE" : "ISTANBUL · THEME PARK",
      title: "Vialand",
      description: tr
        ? "Sınırsız eğlence bileti, ulaşım ve rehberlik ile dolu bir gün."
        : "Enjoy a full day with an unlimited-access park ticket, transport and a guide.",
      tag: "V1",
      duration: "10:00–15:00",
      image: vialandPoster,
      poster: true,
      price: 60,
      currency: "USD",
    },
    {
      id: "S3",
      region: tr ? "İSTANBUL · İKİ KITADA" : "ISTANBUL · TWO CONTINENTS",
      title: tr ? "İki Kıtada" : "On Two Continents",
      description: tr
        ? "Saraylar, camiler ve Boğaz gezisini öğle yemeğiyle birleştiren tam günlük tur."
        : "A full-day tour combining palaces, mosques and a Bosphorus cruise with lunch.",
      tag: "S3",
      duration: "08:30–18:00",
      image: twoContinentsPoster,
      poster: true,
      price: 120,
      currency: "USD",
    },
    {
      id: "D3",
      region: tr ? "İSTANBUL · TARİH & KÜLTÜR" : "ISTANBUL · HISTORY & CULTURE",
      title: tr ? "Yaşayan Tarih" : "Living History",
      description: tr
        ? "Dolmabahçe Sarayı, tarihi camiler ve Boğaz gezisini tek günde keşfedin."
        : "Discover Dolmabahce Palace, historic mosques and the Bosphorus in one day.",
      tag: "D3",
      duration: "08:30–18:00",
      image: livingHistoryPoster,
      poster: true,
      price: 120,
      currency: "USD",
    },
    {
      id: "P3",
      region: tr ? "İSTANBUL · BİZANS MİRASI" : "ISTANBUL · BYZANTINE HERITAGE",
      title: tr ? "Bizans Mirası" : "Byzantine Heritage",
      description: tr
        ? "Ayasofya, Balat ve Galata'yı kapsayan, Boğaz'da öğle yemekli tam gün turu."
        : "Explore Hagia Sophia, Balat and Galata on a full-day tour with lunch on the Bosphorus.",
      tag: "P3",
      duration: "08:30–18:00",
      image: byzantineHeritagePoster,
      poster: true,
      price: 120,
      currency: "USD",
    },
  ];
  const tours = featuredTours;

  function formatPrice(price, currency) {
    const amount = Number(price);
    if (price === null || price === undefined || price === "" || !Number.isFinite(amount)) {
      return "";
    }

    return new Intl.NumberFormat(tr ? "tr-TR" : "en", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <main className="tour-page">
      <section className="tour-hero">
        <div className="tour-hero-copy">
          <span className="tour-eyebrow">
            {tr ? "İSTANBUL'U KEŞFEDİN" : "DISCOVER ISTANBUL"}
          </span>
          <h1>
            {tr
              ? "Şehri kendi temponuzda keşfedin."
              : "Discover the city at your own pace."}
          </h1>
          <p>
            {tr
              ? "İstanbul'un tarihi sokaklarından Boğaz kıyılarına, size özel rotalar ve konforlu ulaşım."
              : "From storied streets to the Bosphorus shore, explore Istanbul with private routes and comfortable transport."}
          </p>
          <div className="tour-hero-actions">
            <a className="tour-primary-link" href="#featured-tours">
              {tr ? "Rotaları keşfedin" : "Explore the routes"}
              <span aria-hidden="true">↘</span>
            </a>
            <span className="tour-hero-caption">
              {tr ? "Özel yolculuklar, güzel anılar." : "Private journeys. Lasting memories."}
            </span>
          </div>
        </div>
        <div className="tour-hero-visual">
          <img
            src={bosphorusTourImage}
            alt={tr ? "İstanbul Boğazı ve kıyı manzarası" : "A view along the Bosphorus in Istanbul"}
          />
          <div className="tour-hero-note">
            <span>{tr ? "SİZE ÖZEL" : "MADE FOR YOU"}</span>
            <strong>{tr ? "İstanbul, daha yakından." : "Istanbul, a little closer."}</strong>
          </div>
          <span className="tour-hero-index">41°00' N&nbsp; 28°58' E</span>
        </div>
      </section>

      <div className="tour-highlights" aria-label={tr ? "Tur avantajları" : "Tour highlights"}>
        {(tr
          ? ["Size özel rota", "Konforlu özel ulaşım", "Planlarınıza göre esnek"]
          : ["Routes made personal", "Comfortable private transport", "Planned around your day"]
        ).map((highlight, index) => (
          <div key={highlight}>
            <span>0{index + 1}</span>
            <strong>{highlight}</strong>
          </div>
        ))}
      </div>

      <section className="tour-discover" id="featured-tours">
        <div className="tour-section-heading">
          <div>
            <span className="tour-eyebrow">
              {tr ? "ÖZENLE SEÇİLDİ" : "THOUGHTFULLY SELECTED"}
            </span>
            <h2>
              {tr ? "İstanbul turlarını keşfedin." : "Explore our Istanbul tours."}
            </h2>
          </div>
          <p>
            {tr
              ? "Tarihi duraklardan Boğaz gezilerine, İstanbul'da size uygun turu seçin."
              : "Choose your way to experience Istanbul, from historic landmarks to Bosphorus cruises."}
          </p>
        </div>

        <p className="tour-pricing-notice">
          {tr
            ? "Fiyatlar kişi başı acenta satış fiyatıdır ve USD cinsindendir; KDV dahil değildir. Liste geçerliliği: 01.10.2026–31.12.2026. 0–2,99 yaş ücretsiz, 3–9,99 yaş için $5 indirim uygulanır (Vialand, akvaryum ve Kapadokya hariç)."
            : "Prices are agency sale rates per person in USD; VAT is not included. Price list valid 01 Oct–31 Dec 2026. Ages 0–2.99 are free and ages 3–9.99 receive $5 off (excluding Vialand, the aquarium and Cappadocia)."}
        </p>

        <div className="tour-grid">
          {tours.map((item, index) => {
            const image = item.image;
            const price = formatPrice(item.price, item.currency);

            const cardContent = (
              <>
                <div className={`tour-card-image${item.poster ? " tour-card-poster" : ""}`}>
                  <img
                    src={image}
                    alt={item.title}
                    loading={index > 1 ? "lazy" : "eager"}
                  />
                  <span className="tour-card-tag">
                    {item.tag || (tr ? "ÖZEL ROTA" : "PRIVATE ROUTE")}
                  </span>
                  {item.duration && (
                    <span className="tour-card-duration">{item.duration}</span>
                  )}
                  <span className="tour-card-number">0{index + 1}</span>
                </div>
                <div className="tour-card-copy">
                  <span className="tour-card-region">
                    {item.region || (tr ? "İSTANBUL" : "ISTANBUL")}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="tour-card-footer">
                    <span className="tour-card-price">
                      {price
                        ? (
                          <>
                            {tr ? "Acenta satış · kişi başı" : "Agency sale · per person"}{" "}
                            <strong>{price}</strong>
                          </>
                        )
                        : tr ? "Size özel planlayın" : "Plan it your way"}
                    </span>
                    {item.id === "B1" ? (
                      <span className="tour-card-book-action">
                        {tr ? "Rezervasyon yap" : "Reserve this tour"}
                        <span aria-hidden="true">↗</span>
                      </span>
                    ) : (
                      <a
                        className="tour-card-book-action"
                        href="/transfer"
                        aria-label={`${tr ? "Bu rota için transfer isteyin:" : "Request a transfer for:"} ${item.title}`}
                      >
                        {tr ? "Bu rotayı planla" : "Plan this route"}
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </>
            );

            return item.id === "B1" ? (
              <a
                className="tour-card tour-card-link"
                href="/tour-booking?code=B1"
                key={item.id || item.slug || item.title}
                aria-label={`${tr ? "B1 turu için rezervasyon yap:" : "Reserve B1 tour:"} ${item.title}`}
              >
                {cardContent}
              </a>
            ) : (
              <article className="tour-card" key={item.id || item.slug || item.title}>
                {cardContent}
              </article>
            );
          })}
        </div>
      </section>

      <section className="tour-custom">
        <div>
          <span className="tour-eyebrow">
            {tr ? "SİZE ÖZEL BİR YOLCULUK" : "A JOURNEY OF YOUR OWN"}
          </span>
          <h2>
            {tr ? "Aklınızdaki rotayı birlikte çizelim." : "Have somewhere else in mind?"}
          </h2>
          <p>
            {tr
              ? "Duraklarınızı ve tercihlerinizi paylaşın; ekibimiz size özel bir yolculuk planlamanıza yardımcı olsun."
              : "Share your stops and preferences. Our team will help shape a private journey around your plans."}
          </p>
        </div>
        <a className="tour-primary-link" href="/transfer">
          {tr ? "Özel rota isteyin" : "Request a private route"}
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}

function TourBookingPage({ language }) {
  const tr = language === "tr";
  const tourCode = new URLSearchParams(window.location.search).get("code");
  const isB1 = tourCode === "B1";
  const localToday = new Date();
  localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
  const earliestDate = localToday.toISOString().slice(0, 10);
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [tourDate, setTourDate] = useState(earliestDate);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const totalGuests = guestCounts.adults + guestCounts.children + guestCounts.infants;
  const totalPrice = guestCounts.adults * 35 + guestCounts.children * 30;

  function changeGuestCount(type, value) {
    const minimum = type === "adults" ? 1 : 0;
    const requested = Number(value);
    if (!Number.isInteger(requested) || requested < minimum) return;
    setGuestCounts((current) => {
      const otherGuests = current.adults + current.children + current.infants - current[type];
      if (requested + otherGuests > 100) return current;
      return { ...current, [type]: requested };
    });
  }

  async function submitReservation(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: tr ? "Rezervasyon talebiniz gönderiliyor..." : "Submitting your reservation request..." });
    const formData = new FormData(event.currentTarget);

    try {
      const response = await axios.post(`${PUBLIC_API_BASE}/tour-reservations`, {
        tour_code: "B1",
        tour_date: tourDate,
        ...guestCounts,
        passenger_name: formData.get("passenger_name"),
        passenger_phone: formData.get("passenger_phone"),
        passenger_email: formData.get("passenger_email"),
        note: formData.get("note") || null,
        locale: language,
        terms_accepted: formData.get("terms_accepted") === "1",
      });
      const reservation = response.data?.data;
      const params = new URLSearchParams({
        type: "tour",
        ref: reservation?.request_reference || "",
        lang: language,
        tour: tr ? "Prens Adaları (B1)" : "Prince Islands (B1)",
        date: reservation?.tour_date || tourDate,
        guests: String(reservation?.passengers ?? totalGuests),
        price: String(reservation?.price ?? totalPrice),
        currency: reservation?.currency || "USD",
      });
      window.location.href = `/booking-success?${params.toString()}`;
    } catch (error) {
      const validation = error.response?.data?.errors;
      const firstValidation = validation ? Object.values(validation).flat()[0] : null;
      setStatus({
        type: "error",
        message: firstValidation || error.response?.data?.message || (tr ? "Rezervasyon talebiniz gönderilemedi. Lütfen tekrar deneyin." : "Your reservation could not be submitted. Please try again."),
      });
    }
  }

  return (
    <main className="tour-booking-page">
      {isB1 ? (
        <>
          <section className="tour-booking-hero">
            <div className="tour-booking-hero-inner">
              <div className="tour-booking-hero-copy">
                <a className="tour-booking-back" href="/tour-packages">← {tr ? "Tüm turlar" : "All tours"}</a>
                <span className="tour-booking-eyebrow"><i /> B1 · {tr ? "PRENS ADALARI" : "PRINCE ISLANDS"}</span>
                <h1>{tr ? <>Şehrin ritminden<br /><em>uzakta bir gün.</em></> : <>A day away.<br /><em>A different Istanbul.</em></>}</h1>
                <p>{tr
                  ? "Kınalıada ve Büyükada'yı tekneyle keşfedin. Öğle yemeği, içecekler, ulaşım ve rehberlik yolculuğunuza dahil."
                  : "Discover Kinaliada and Buyukada by boat, with lunch, drinks, transportation and a guide included."}</p>
                <div className="tour-booking-hero-facts">
                  <span><i>◷</i><strong>08:30–16:00</strong><small>{tr ? "Her gün" : "Every day"}</small></span>
                  <span><i>⌖</i><strong>{tr ? "2 ada" : "2 islands"}</strong><small>Kınalıada · Büyükada</small></span>
                  <span><i>↗</i><strong>{tr ? "$35'ten" : "From $35"}</strong><small>{tr ? "kişi başı" : "per person"}</small></span>
                </div>
                <a className="tour-booking-hero-cta" href="#b1-reservation">
                  {tr ? "Rezervasyon talebi oluştur" : "Plan your reservation"}<span aria-hidden="true">↓</span>
                </a>
              </div>
              <figure className="tour-booking-hero-visual">
                <img src={islandsTourImage} alt={tr ? "Prens Adaları'nın sahil ve deniz manzarası" : "Coastline and sea views of the Princes' Islands"} />
                <figcaption><span>SKYFLEET · B1</span>{tr ? "İstanbul'un adalarında, kendi ritminizde." : "The islands, at your own pace."}</figcaption>
                <span className="tour-booking-hero-stamp">{tr ? "KÜÇÜK GRUPLAR · ÖZENLİ PLANLAMA" : "SMALL GROUPS · THOUGHTFULLY ARRANGED"}</span>
              </figure>
            </div>
          </section>

          <div className="tour-booking-assurance">
            <div>
              {(tr
                ? ["Gidiş-dönüş tekne gezisi", "Gemide öğle yemeği ve içecekler", "Profesyonel rehber ve ulaşım"]
                : ["Round-trip boat trip", "Lunch and drinks on board", "Professional guide and transport"]
              ).map((item) => <span key={item}><i aria-hidden="true">✓</i>{item}</span>)}
            </div>
          </div>

          <section className="tour-booking-content" id="b1-reservation">
            <div className="tour-booking-section-heading">
              <span className="tour-booking-eyebrow"><i /> {tr ? "B1 TURU · REZERVASYON" : "B1 TOUR · RESERVATION"}</span>
              <h2>{tr ? "Gününüzü planlayın." : "Make a day of it."}</h2>
              <p>{tr ? "Bilgilerinizi paylaşın; ekibimiz yerinizi ve buluşma noktasını sizinle teyit etsin." : "Share your details and our team will confirm your place and meeting point with you."}</p>
            </div>
            <div className="tour-booking-layout">
              <form className="tour-booking-form" onSubmit={submitReservation}>
                <div className="tour-booking-form-heading">
                  <span className="tour-booking-step">01</span>
                  <div><span>{tr ? "YOLCULUK BİLGİLERİ" : "YOUR TOUR DETAILS"}</span><h3>{tr ? "Ne zaman ve kaç kişi?" : "When and who is travelling?"}</h3></div>
                  <span className="tour-booking-secure"><i aria-hidden="true">✓</i>{tr ? "Güvenli talep" : "Secure request"}</span>
                </div>

                <div className="tour-booking-form-section">
                  <label className="tour-booking-date">
                    <span>{tr ? "Tur tarihi" : "Tour date"}</span>
                    <input type="date" name="tour_date" min={earliestDate} value={tourDate} onChange={(event) => setTourDate(event.target.value)} required />
                  </label>
                  <fieldset className="tour-guest-counts">
                    <legend>{tr ? "Misafir sayısı" : "Number of guests"}</legend>
                    {[
                      ["adults", tr ? "Yetişkin" : "Adults", tr ? "10 yaş ve üzeri" : "Age 10+"],
                      ["children", tr ? "Çocuk" : "Children", tr ? "3–9,99 yaş" : "Ages 3–9.99"],
                      ["infants", tr ? "Bebek" : "Infants", tr ? "0–2,99 yaş" : "Ages 0–2.99"],
                    ].map(([type, label, age]) => (
                      <label key={type}>
                        <span>{label}<small>{age}</small></span>
                        <input type="number" min={type === "adults" ? 1 : 0} max="100" value={guestCounts[type]} onChange={(event) => changeGuestCount(type, event.target.value)} required={type === "adults"} />
                      </label>
                    ))}
                  </fieldset>
                </div>

                <div className="tour-booking-form-heading tour-booking-form-heading-contact">
                  <span className="tour-booking-step">02</span>
                  <div><span>{tr ? "İLETİŞİM BİLGİLERİ" : "YOUR CONTACT DETAILS"}</span><h3>{tr ? "Size nasıl ulaşalım?" : "How can we reach you?"}</h3></div>
                </div>

                <div className="tour-booking-contact">
                  <label><span>{tr ? "Ad soyad" : "Full name"}</span><input name="passenger_name" autoComplete="name" maxLength="255" placeholder={tr ? "Adınız ve soyadınız" : "Your full name"} required /></label>
                  <label><span>{tr ? "E-posta adresi" : "Email address"}</span><input name="passenger_email" type="email" autoComplete="email" maxLength="255" placeholder="name@example.com" required /></label>
                  <label><span>{tr ? "Telefon numarası" : "Phone number"}</span><input name="passenger_phone" type="tel" autoComplete="tel" maxLength="50" placeholder="+90" required /></label>
                  <label className="tour-booking-note"><span>{tr ? "Eklemek istediğiniz bir not var mı? (İsteğe bağlı)" : "Anything else we should know? (Optional)"}</span><textarea name="note" rows="3" maxLength="3000" placeholder={tr ? "Özel isteklerinizi buraya yazabilirsiniz." : "Add any special requests here."} /></label>
                </div>

                <label className="tour-booking-terms">
                  <input type="checkbox" name="terms_accepted" value="1" required />
                  <span>{tr ? "Rezervasyon talebimin alınmasını ve ekibin benimle iletişime geçmesini kabul ediyorum." : "I agree to submit this reservation request and be contacted by the team."}</span>
                </label>
                {status.type !== "idle" && <p className={`tour-booking-status ${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.message}</p>}
                <button className="tour-booking-submit" type="submit" disabled={status.type === "loading"}>
                  {status.type === "loading" ? tr ? "Gönderiliyor..." : "Submitting..." : tr ? "Rezervasyon talebini gönder" : "Send reservation request"}
                  <span aria-hidden="true">↗</span>
                </button>
                <p className="tour-booking-form-footnote">{tr ? "Bu bir rezervasyon talebidir. Ekibimiz müsaitliği ve buluşma noktasını teyit ettikten sonra sizinle iletişime geçecektir." : "This is a reservation request. Our team will contact you to confirm availability and the meeting point."}</p>
              </form>

              <aside className="tour-booking-summary">
                <div className="tour-booking-summary-image">
                  <img src={princeIslandsPoster} alt={tr ? "Prens Adaları B1 tur programı" : "Prince Islands B1 tour programme"} />
                  <span>B1 · {tr ? "HER GÜN" : "DAILY"}</span>
                </div>
                <div className="tour-booking-summary-copy">
                  <span className="tour-booking-summary-kicker">{tr ? "TUR ÖZETİ" : "YOUR TOUR"}</span>
                  <h3>{tr ? "Prens Adaları" : "Prince Islands"}</h3>
                  <div className="tour-booking-summary-time"><span>◷</span><div><strong>08:30–16:00</strong><small>{tr ? "Her gün · tam gün" : "Daily · full day"}</small></div></div>
                  <dl>
                    <div><dt>{tr ? "Yetişkin" : "Adult"}</dt><dd>$35 <small>/ {tr ? "kişi" : "person"}</small></dd></div>
                    <div><dt>{tr ? "Çocuk · 3–9,99" : "Child · 3–9.99"}</dt><dd>$30 <small>/ {tr ? "kişi" : "person"}</small></dd></div>
                    <div><dt>{tr ? "Bebek · 0–2,99" : "Infant · 0–2.99"}</dt><dd>{tr ? "Ücretsiz" : "Free"}</dd></div>
                  </dl>
                  <div className="tour-booking-total">
                    <span>{tr ? `Tahmini toplam · ${totalGuests} misafir` : `Estimated total · ${totalGuests} guests`}</span>
                    <strong>{new Intl.NumberFormat(tr ? "tr-TR" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalPrice)}</strong>
                  </div>
                  <p className="tour-booking-tax-note">{tr ? "USD · KDV dahil değildir. Talebiniz, ekip teyidinden sonra kesinleşir." : "USD · VAT not included. Your request is confirmed by our team."}</p>
                </div>
              </aside>
            </div>
          </section>
        </>
      ) : (
        <section className="tour-booking-unavailable">
          <h1>{tr ? "Bu tur için rezervasyon açılamıyor." : "This tour is not available for booking yet."}</h1>
          <a className="tour-primary-link" href="/tour-packages">{tr ? "Turlara dön" : "Back to tours"}</a>
        </section>
      )}
    </main>
  );
}

function HomeBookingCard({ language }) {
  const tr = language === "tr";
  const earliestDate = new Date().toISOString().slice(0, 10);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedLocations, setSelectedLocations] = useState({ pickup: null, dropoff: null });
  const [suggestions, setSuggestions] = useState({ pickup: [], dropoff: [] });
  const [open, setOpen] = useState({ pickup: false, dropoff: false });
  const [loading, setLoading] = useState({ pickup: false, dropoff: false });
  const [pickupDate, setPickupDate] = useState(earliestDate);
  const [pickupTime, setPickupTime] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [quotes, setQuotes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [manualQuote, setManualQuote] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [displayCurrency] = useState(language === "tr" ? "TRY" : "EUR");
  const timers = useRef({ pickup: null, dropoff: null });
  const requestIds = useRef({ pickup: 0, dropoff: 0 });

  const vehicleOptions = [
    { type: "executive_people_carrier", title: "Mercedes Vito", subtitle: tr ? "Premium minivan" : "Premium minivan", icon: "V" },
    { type: "executive_car", title: "Mercedes E-Class", subtitle: tr ? "Executive sedan" : "Executive sedan", icon: "E" },
    { type: "luxury_car", title: "Mercedes S-Class", subtitle: tr ? "VIP sedan" : "VIP sedan", icon: "S" },
  ];

  function resetPricing() {
    setQuotes([]);
    setSelectedVehicle(null);
    setManualQuote(false);
    setStatus({ type: "idle", message: "" });
  }

  function changeLocation(type, value) {
    resetPricing();
    if (type === "pickup") setPickup(value);
    else setDropoff(value);
    setSelectedLocations((current) => ({ ...current, [type]: null }));

    if (timers.current[type]) clearTimeout(timers.current[type]);
    const requestId = ++requestIds.current[type];
    setSuggestions((current) => ({ ...current, [type]: [] }));

    const query = value.trim();

    if (query.length < 3) {
      setSuggestions((current) => ({ ...current, [type]: [] }));
      setOpen((current) => ({ ...current, [type]: false }));
      setLoading((current) => ({ ...current, [type]: false }));
      return;
    }

    setOpen((current) => ({ ...current, [type]: true }));
    setLoading((current) => ({ ...current, [type]: true }));

    timers.current[type] = setTimeout(async () => {
      try {
        const otherLocation =
          type === "pickup"
            ? selectedLocations.dropoff
            : selectedLocations.pickup;

        const contextParts = otherLocation?.is_airport
          ? [otherLocation.city, otherLocation.country].filter(Boolean)
          : [];

        const normalized = query
          .toLocaleLowerCase("tr-TR")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        let apiQuery = query;
        let canonicalAirportCode = null;

        if (type === "pickup") {
          const wantsIst =
            normalized === "ist" ||
            normalized.startsWith("ist ") ||
            normalized.includes("istanbul hava") ||
            normalized.includes("istanbul airp");

          const wantsSaw =
            normalized === "saw" ||
            normalized.startsWith("saw ") ||
            normalized.includes("sabiha");

          if (wantsIst) {
            apiQuery = "IST";
            canonicalAirportCode = "IST";
          } else if (wantsSaw) {
            apiQuery = "SAW";
            canonicalAirportCode = "SAW";
          }
        }

        const contextualQuery =
          canonicalAirportCode
            ? apiQuery
            : contextParts.length
              ? `${apiQuery}, ${contextParts.join(", ")}`
              : apiQuery;

        const response = await axios.get(
          `${PUBLIC_API_BASE}/address-search`,
          {
            params: {
              q: contextualQuery,
              field: type,
            },
          },
        );

        if (requestIds.current[type] !== requestId) return;

        let results = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (type === "pickup" && canonicalAirportCode) {
          const canonicalAirport = results.find(
            (item) =>
              item?.provider === "skyfleet" &&
              item?.is_airport === true &&
              item?.location_id &&
              String(item?.iata || item?.code || "").toUpperCase() === canonicalAirportCode
          );

          // Keep provider results visible when the live airport catalog has no
          // canonical match. A missing pricing location must not hide addresses.
          results = canonicalAirport ? [canonicalAirport] : results;
        } else if (type === "pickup") {
          const skyfleetAirports = results.filter(
            (item) =>
              item?.provider === "skyfleet" &&
              item?.is_airport === true &&
              item?.location_id
          );

          if (skyfleetAirports.length > 0) {
            results = skyfleetAirports;
          }
        }

        if (type === "dropoff" && !queryHasAirportIntent(query)) {
          results = results.filter((item) => !item?.is_airport);
        }

        setSuggestions((current) => ({
          ...current,
          [type]: results,
        }));
      } catch (error) {
        console.error("Home address search failed.", error);

        if (requestIds.current[type] === requestId) {
          setSuggestions((current) => ({
            ...current,
            [type]: [],
          }));
        }
      } finally {
        if (requestIds.current[type] === requestId) {
          setLoading((current) => ({
            ...current,
            [type]: false,
          }));
        }
      }
    }, 450);
  }
  async function selectLocation(type, suggestion) {
    if (timers.current[type]) clearTimeout(timers.current[type]);
    const requestId = ++requestIds.current[type];
    setSuggestions((current) => ({ ...current, [type]: [] }));
    setOpen((current) => ({ ...current, [type]: false }));
    setLoading((current) => ({ ...current, [type]: true }));

    try {
      let resolved = suggestion;

      if (
        suggestion?.provider === "google_maps" &&
        suggestion?.place_id &&
        (
          suggestion.latitude === null ||
          suggestion.latitude === undefined ||
          suggestion.latitude === "" ||
          suggestion.longitude === null ||
          suggestion.longitude === undefined ||
          suggestion.longitude === "" ||
          !Number.isFinite(Number(suggestion.latitude)) ||
          !Number.isFinite(Number(suggestion.longitude))
        )
      ) {
        resolved = await resolveGooglePlaceSuggestion(suggestion);
      }

      if (requestIds.current[type] !== requestId) return;

      const value =
        resolved.formatted_address ||
        resolved.label ||
        resolved.name ||
        "";

      if (type === "pickup") setPickup(value);
      else setDropoff(value);
      setSelectedLocations((current) => ({ ...current, [type]: resolved }));
      resetPricing();
    } catch (error) {
      if (requestIds.current[type] !== requestId) return;
      console.error("Home location selection failed.", error);
      setStatus({
        type: "error",
        message: tr
          ? "Adres ayrıntıları alınamadı. Lütfen tekrar deneyin."
          : "Location details could not be loaded. Please try again.",
      });
    } finally {
      if (requestIds.current[type] === requestId) {
        setSuggestions((current) => ({ ...current, [type]: [] }));
        setOpen((current) => ({ ...current, [type]: false }));
        setLoading((current) => ({ ...current, [type]: false }));
      }
    }
  }

  function renderSuggestions(type, value) {
    if (!open[type] || value.trim().length < 3) return null;
    return (
      <div className="home-address-dropdown">
        {loading[type] && <div className="home-address-status">{tr ? "Adresler aranıyor..." : "Searching locations..."}</div>}
        {!loading[type] && suggestions[type].length === 0 && <div className="home-address-status">{tr ? "Adres bulunamadı." : "No location found."}</div>}
        {!loading[type] && suggestions[type].map((item, index) => (
          <button
            type="button"
            className="home-address-option"
            key={item.place_id || `${item.latitude}-${item.longitude}-${index}`}
            onPointerDown={(event) => {
              event.preventDefault();
              selectLocation(type, item);
            }}
          >
            <span>{item.is_airport ? "✈" : "●"}</span>
            <div><strong>{item.name || item.label || item.formatted_address}</strong><small>{item.formatted_address || item.label}</small></div>
            <b>→</b>
          </button>
        ))}
        <small className="home-address-provider">
          {suggestions[type].some((item) => item.provider === "google_maps") ? (
            <span translate="no">Google Maps</span>
          ) : (
            <>⌖ {tr ? "Gerçek zamanlı konum araması" : "Real-time location search"}</>
          )}
        </small>
      </div>
    );
  }

  async function searchVehicles(event) {
    event.preventDefault();
    resetPricing();
    setStatus({ type: "loading", message: tr ? "Uygun araçlar ve fiyatlar hesaplanıyor..." : "Calculating vehicles and prices..." });
    try {
      if (!selectedLocations.pickup || !selectedLocations.dropoff) {
        throw new Error(tr ? "Lütfen iki adresi de açılan listeden seçin." : "Please select both locations from the suggestions.");
      }
      if (!pickupDate || !pickupTime) {
        throw new Error(tr ? "Lütfen tarih ve saat seçin." : "Please select date and time.");
      }
      const pickupIsAirport = Boolean(selectedLocations.pickup?.is_airport && selectedLocations.pickup?.location_id);
      const dropoffIsAirport = Boolean(selectedLocations.dropoff?.is_airport && selectedLocations.dropoff?.location_id);
      if (pickupIsAirport === dropoffIsAirport) {
        throw new Error(tr ? "Anlık fiyat için rotanın bir ucunda havalimanı olmalıdır." : "For instant pricing, one end of the route must be an airport.");
      }
      const airportLocation = pickupIsAirport ? selectedLocations.pickup : selectedLocations.dropoff;
      const pricedLocation = pickupIsAirport ? selectedLocations.dropoff : selectedLocations.pickup;

      if (
        pricedLocation?.latitude === null ||
        pricedLocation?.latitude === undefined ||
        pricedLocation?.longitude === null ||
        pricedLocation?.longitude === undefined ||
        !Number.isFinite(Number(pricedLocation.latitude)) ||
        !Number.isFinite(Number(pricedLocation.longitude))
      ) {
        throw new Error(
          tr
            ? "Seçilen adresin koordinatları alınamadı. Adresi listeden yeniden seçin."
            : "The selected address coordinates could not be resolved. Please select it again from the list.",
        );
      }

      const direction = pickupIsAirport ? "pickup" : "dropoff";
      let manualAvailable = false;
      const results = await Promise.all(vehicleOptions.map(async (vehicle) => {
        try {
          const response = await axios.post(`${PUBLIC_API_BASE}/regional-pricing`, {
            latitude: pricedLocation.latitude,
            longitude: pricedLocation.longitude,
            direction,
            vehicle_type: vehicle.type,
            airport_location_id: airportLocation.location_id,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            passengers: Number(passengers),
            luggage_count: 0,
            display_currency: displayCurrency,
          });
          if (response.data?.manual_quote_available) manualAvailable = true;
          return response.data?.available ? { ...vehicle, quote: response.data } : null;
        } catch {
          return null;
        }
      }));
      const available = results.filter(Boolean);
      if (available.length === 0) {
        if (manualAvailable) {
          setManualQuote(true);
          setSelectedVehicle(vehicleOptions[0]);
          setStatus({ type: "ready", message: tr ? "Anlık fiyat bulunamadı. Teklif talebi gönderebilirsiniz." : "Instant price unavailable. You can send a quote request." });
          return;
        }
        throw new Error(tr ? "Bu rota için fiyat oluşturulamadı." : "No price could be generated for this route.");
      }
      setQuotes(available);
      setSelectedVehicle(available[0]);
      setStatus({ type: "ready", message: tr ? "Fiyatlar hazır. Aracınızı seçin ve rezervasyonu tamamlayın." : "Prices are ready. Choose a vehicle and complete your booking." });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || error.message || (tr ? "Fiyat hesaplanamadı." : "Unable to calculate price.") });
    }
  }

  async function submitBooking(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const chosen = selectedVehicle;
    if (!chosen) return;
    setStatus({ type: "loading", message: tr ? "Rezervasyon talebiniz gönderiliyor..." : "Submitting your booking request..." });
    try {
      const payload = {
        pickup,
        pickup_place_id: selectedLocations.pickup?.place_id || null,
        pickup_lat: selectedLocations.pickup?.latitude ?? null,
        pickup_lng: selectedLocations.pickup?.longitude ?? null,
        dropoff,
        dropoff_place_id: selectedLocations.dropoff?.place_id || null,
        dropoff_lat: selectedLocations.dropoff?.latitude ?? null,
        dropoff_lng: selectedLocations.dropoff?.longitude ?? null,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        timezone: chosen.quote?.timezone || selectedLocations.pickup?.timezone || selectedLocations.dropoff?.timezone || "UTC",
        flight_number: null,
        passengers: Number(passengers),
        luggage_count: 0,
        vehicle_type: chosen.type,
        passenger_name: formData.get("passenger_name"),
        passenger_phone: formData.get("passenger_phone"),
        passenger_email: formData.get("passenger_email"),
        note: formData.get("note") || null,
        locale: language,
        terms_accepted: formData.get("terms_accepted") === "1",
        quote_token: chosen.quote?.quote_token || null,
      };
      const response = await axios.post(`${PUBLIC_API_BASE}/transfer-requests`, payload);
      const reference = response.data?.data?.request_reference || response.data?.request_reference || "";
      const successParams = new URLSearchParams({
        ref: reference,
        lang: language,
        pickup,
        dropoff,
        vehicle: chosen.title || chosen.type || "",
        price: chosen.quote?.public_price != null ? String(chosen.quote.public_price) : "",
        currency: chosen.quote?.currency || "",
        date: pickupDate,
        time: pickupTime,
      });
      window.location.href = `/booking-success?${successParams.toString()}`;
    } catch (error) {
      const validation = error.response?.data?.errors;
      const firstValidation = validation ? Object.values(validation).flat()[0] : null;
      setStatus({ type: "error", message: firstValidation || error.response?.data?.message || (tr ? "Rezervasyon gönderilemedi." : "Booking request could not be submitted.") });
    }
  }

  return (
    <div className="home-booking-card">
      <div className="home-booking-tabs">
        <button type="button" className="active">✈ {tr ? "Havalimanı Transferi" : "Airport Transfer"}</button>
        <button type="button" onClick={() => { window.location.href = "/transfer"; }}>▰ {tr ? "Şehirlerarası" : "Intercity"}</button>
        <button type="button" onClick={() => { window.location.href = "/transfer"; }}>◷ {tr ? "Saatlik" : "Hourly"}</button>
      </div>

      <form onSubmit={searchVehicles}>
        <label className="home-location-field"><span>{tr ? "Alış Noktası" : "Pick-up Location"}</span><input value={pickup} autoComplete="off" placeholder={tr ? "Havalimanı, şehir veya adres" : "Airport, city or address"} onChange={(event) => changeLocation("pickup", event.target.value)} onFocus={() => pickup.trim().length >= 3 && setOpen((current) => ({ ...current, pickup: true }))} onBlur={() => setTimeout(() => setOpen((current) => ({ ...current, pickup: false })), 150)} required />{renderSuggestions("pickup", pickup)}</label>
        <label className="home-location-field"><span>{tr ? "Bırakış Noktası" : "Drop-off Location"}</span><input value={dropoff} autoComplete="off" placeholder={tr ? "Havalimanı, şehir veya adres" : "Airport, city or address"} onChange={(event) => changeLocation("dropoff", event.target.value)} onFocus={() => dropoff.trim().length >= 3 && setOpen((current) => ({ ...current, dropoff: true }))} onBlur={() => setTimeout(() => setOpen((current) => ({ ...current, dropoff: false })), 150)} required />{renderSuggestions("dropoff", dropoff)}</label>
        <div className="home-booking-row">
          <label><span>{tr ? "Alış Tarihi" : "Pick-up Date"}</span><input type="date" min={earliestDate} value={pickupDate} onChange={(event) => { setPickupDate(event.target.value); resetPricing(); }} required /></label>
          <label><span>{tr ? "Alış Saati" : "Pick-up Time"}</span><input type="time" value={pickupTime} onChange={(event) => { setPickupTime(event.target.value); resetPricing(); }} required /></label>
          <label><span>{tr ? "Yolcu" : "Passengers"}</span><select value={passengers} onChange={(event) => { setPassengers(Number(event.target.value)); resetPricing(); }}>{[1,2,3,4,5,6,7,8].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
        </div>
        <button className="home-search-button" type="submit" disabled={status.type === "loading"}>{status.type === "loading" ? (tr ? "Hesaplanıyor..." : "Calculating...") : (tr ? "Araçları ve Fiyatları Göster" : "Search Vehicles")} <span>→</span></button>
      </form>

      {(quotes.length > 0 || manualQuote) && (
        <div className="home-pricing-results">
          {quotes.length > 0 && <div className="home-vehicle-options">{quotes.map((vehicle) => <button type="button" key={vehicle.type} className={selectedVehicle?.type === vehicle.type ? "active" : ""} onClick={() => setSelectedVehicle(vehicle)}><span className="home-vehicle-letter">{vehicle.icon}</span><div><strong>{vehicle.title}</strong><small>{vehicle.subtitle}</small></div><b>{vehicle.quote.currency} {Number(vehicle.quote.public_price).toFixed(2)}</b></button>)}</div>}
          <form className="home-contact-step" onSubmit={submitBooking}>
            <div className="home-selected-quote">{manualQuote ? <strong>{tr ? "Teklif Talebi" : "Quote Request"}</strong> : <><span>{tr ? "Seçilen fiyat" : "Selected price"}</span><strong>{selectedVehicle?.quote?.currency} {Number(selectedVehicle?.quote?.public_price || 0).toFixed(2)}</strong></>}</div>
            <div className="home-contact-grid"><input name="passenger_name" placeholder={tr ? "Ad Soyad" : "Full name"} required /><input name="passenger_phone" type="tel" placeholder={tr ? "Telefon / WhatsApp" : "Phone / WhatsApp"} required /><input name="passenger_email" type="email" placeholder={tr ? "E-posta" : "Email"} required /><input name="note" placeholder={tr ? "Özel not (opsiyonel)" : "Special note (optional)"} /></div>
            <label className="home-booking-consent"><input type="checkbox" name="terms_accepted" value="1" required /><span>{tr ? "Bilgilerimin bu transfer talebi için kullanılmasını kabul ediyorum." : "I agree that my details may be used for this transfer request."}</span></label>
            <button className="home-confirm-button" type="submit" disabled={status.type === "loading"}>{tr ? "Rezervasyon Talebini Gönder" : "Submit Booking Request"} <span>→</span></button>
          </form>
        </div>
      )}

      {status.type !== "idle" && <p className={`home-booking-status ${status.type}`}>{status.message}</p>}
    </div>
  );
}

function TransferPage({ language }) {
  const tr = language === "tr";

  const [submission, setSubmission] = useState({
    status: "idle",
    message: "",
  });
  const [regionalPrice, setRegionalPrice] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState("TRY");

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      setSubmission({
        status: "error",
        message: tr
          ? "Ödeme tamamlanmadı. Rezervasyonunuzu tamamlamak için lütfen fiyatı yeniden hesaplayıp ödemeyi tekrar deneyin."
          : "Payment was not completed. Please recalculate the price and try the payment again to complete your booking.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    setRegionalPrice(null);
    setSubmission({ status: "idle", message: "" });

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
    const requestId = ++locationRequestIds.current[type];
    resetLocationResults(type);

    const query = value.trim();

    if (query.length < 3) {
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
        try {
          const response = await axios.get(
            `${PUBLIC_API_BASE}/address-search`,
            {
              params: {
                field: type,
                q: (() => {
                  const otherLocation = type === "pickup"
                    ? selectedLocations.dropoff
                    : selectedLocations.pickup;

                  const contextParts = otherLocation?.is_airport
                    ? [otherLocation.city, otherLocation.country].filter(Boolean)
                    : [];

                  return contextParts.length
                    ? `${query}, ${contextParts.join(", ")}`
                    : query;
                })(),
              },
            },
          );

          if (
            locationRequestIds.current[type] !== requestId
          ) {
            return;
          }

          let results = Array.isArray(response.data?.data)
            ? response.data.data
            : [];

          if (type === "dropoff" && !queryHasAirportIntent(query)) {
            results = results.filter((item) => !item?.is_airport);
          }

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
      650,
    );
  }

  async function selectLocation(type, suggestion) {
    setRegionalPrice(null);
    setSubmission({ status: "idle", message: "" });
    clearLocationTimer(type);
    const requestId = ++locationRequestIds.current[type];
    resetLocationResults(type);

    if (type === "pickup") {
      setPickupLoading(true);
    } else {
      setDropoffLoading(true);
    }

    try {
      let resolved = suggestion;

      if (
        suggestion?.provider === "google_maps" &&
        suggestion?.place_id &&
        (
          suggestion.latitude === null ||
          suggestion.latitude === undefined ||
          suggestion.latitude === "" ||
          suggestion.longitude === null ||
          suggestion.longitude === undefined ||
          suggestion.longitude === "" ||
          !Number.isFinite(Number(suggestion.latitude)) ||
          !Number.isFinite(Number(suggestion.longitude))
        )
      ) {
        resolved = await resolveGooglePlaceSuggestion(suggestion);
      }

      const value =
        resolved.formatted_address ||
        resolved.label ||
        resolved.name ||
        "";

      if (locationRequestIds.current[type] !== requestId) return;

      setSelectedLocations((current) => ({
        ...current,
        [type]: resolved,
      }));
      setActiveSuggestionIndexes((current) => ({
        ...current,
        [type]: -1,
      }));

      if (type === "pickup") {
        setPickup(value);
      } else {
        setDropoff(value);
      }
    } catch (error) {
      if (locationRequestIds.current[type] !== requestId) return;
      console.error("Transfer location selection failed.", error);
      setSubmission({
        status: "error",
        message: tr
          ? "Adres ayrıntıları alınamadı. Lütfen tekrar deneyin."
          : "Location details could not be loaded. Please try again.",
      });
    } finally {
      if (locationRequestIds.current[type] === requestId && type === "pickup") {
        setPickupSuggestions([]);
        setPickupOpen(false);
        setPickupLoading(false);
      } else if (locationRequestIds.current[type] === requestId) {
        setDropoffSuggestions([]);
        setDropoffOpen(false);
        setDropoffLoading(false);
      }
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
        regionalPrice?.timezone || selectedLocations.pickup?.timezone || selectedLocations.dropoff?.timezone || "UTC",
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
      quote_token: regionalPrice?.quote_token || null,
    };

    if (!regionalPrice) {
      setSubmission({
        status: "submitting",
        message: tr ? "Transfer fiyatınız hesaplanıyor..." : "Calculating your transfer price...",
      });

      try {
        const pickupIsAirport = Boolean(
          selectedLocations.pickup?.is_airport &&
          selectedLocations.pickup?.location_id,
        );

        const dropoffIsAirport = Boolean(
          selectedLocations.dropoff?.is_airport &&
          selectedLocations.dropoff?.location_id,
        );

        if (!selectedLocations.pickup || !selectedLocations.dropoff) {
          throw new Error(
            tr
              ? "Lütfen alış ve bırakış noktalarını listeden seçin."
              : "Please select both pickup and drop-off locations from the suggestions.",
          );
        }

        if (pickupIsAirport === dropoffIsAirport) {
          throw new Error(
            tr
              ? "Otomatik fiyat için rotanın bir ucunda havalimanı, diğer ucunda adres veya otel olmalıdır."
              : "For instant pricing, one end of the route must be an airport and the other an address or hotel.",
          );
        }

        if (!payload.vehicle_type) {
          throw new Error(
            tr
              ? "Lütfen bir araç sınıfı seçin."
              : "Please select a vehicle class.",
          );
        }

        const airportLocation = pickupIsAirport
          ? selectedLocations.pickup
          : selectedLocations.dropoff;

        const pricedLocation = pickupIsAirport
          ? selectedLocations.dropoff
          : selectedLocations.pickup;

        if (
          pricedLocation?.latitude === null ||
          pricedLocation?.latitude === undefined ||
          pricedLocation?.longitude === null ||
          pricedLocation?.longitude === undefined ||
          !Number.isFinite(Number(pricedLocation.latitude)) ||
          !Number.isFinite(Number(pricedLocation.longitude))
        ) {
          throw new Error(
            tr
              ? "Seçilen adresin koordinatları alınamadı. Adresi listeden yeniden seçin."
              : "The selected address coordinates could not be resolved. Please select it again from the list.",
          );
        }

        const direction = pickupIsAirport
          ? "pickup"
          : "dropoff";

        const priceResponse = await axios.post(
          `${PUBLIC_API_BASE}/regional-pricing`,
          {
            latitude: pricedLocation.latitude,
            longitude: pricedLocation.longitude,
            direction,
            vehicle_type: payload.vehicle_type,
            airport_location_id: airportLocation.location_id,
            pickup_date: payload.pickup_date,
            pickup_time: payload.pickup_time,
            passengers: payload.passengers,
            luggage_count: payload.luggage_count,
            display_currency: displayCurrency,
          },
        );

        if (!priceResponse.data?.available) {
          if (priceResponse.data?.manual_quote_available) {
            setRegionalPrice({ manual_quote_available: true, timezone: airportLocation.timezone || payload.timezone });
            setSubmission({
              status: "quote",
              message: tr
                ? "Bu rota için anlık fiyat hazır değil. Teklif talebinizi göndermek için tekrar tıklayın."
                : "An instant price is not available for this route. Click again to request a quote.",
            });
            return;
          }
          throw new Error(
            priceResponse.data?.message ||
            (tr
              ? "Bu rota ve araç sınıfı için fiyat bulunamadı."
              : "No price is available for this route and vehicle class."),
          );
        }

        setRegionalPrice(priceResponse.data);
        setSubmission({
          status: "quote",
          message: tr
            ? "Fiyatınız hesaplandı. Talebi göndermek için tekrar tıklayın."
            : "Your price is ready. Click again to submit the request.",
        });
      } catch (error) {
        setRegionalPrice(null);
        setSubmission({
          status: "error",
          message:
            error.response?.data?.message ||
            error.message ||
            (tr
              ? "Bu bölgede fiyat bulunamadı."
              : "No regional price is available for this route."),
        });
      }

      return;
    }

    setSubmission({
      status: "submitting",
      message: tr
        ? "Transfer talebiniz güvenli şekilde gönderiliyor..."
        : "Submitting your transfer request securely...",
    });

    try {
      const response = await axios.post(
        `${PUBLIC_API_BASE}/transfer-requests`,
        payload,
      );

      const reference =
        response.data?.data?.request_reference;
      const checkoutUrl =
        response.data?.data?.checkout_url;

      if (response.data?.data?.payment_required && checkoutUrl) {
        setSubmission({
          status: "submitting",
          message: tr
            ? "Güvenli ödeme sayfasına yönlendiriliyorsunuz..."
            : "Redirecting you to the secure payment page...",
        });

        window.location.href = checkoutUrl;
        return;
      }

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
      setRegionalPrice(null);
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
      if (validationErrors?.quote_token) setRegionalPrice(null);

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
              onPointerDown={(event) => {
                event.preventDefault();
                selectLocation(type, suggestion);
              }}
              onMouseEnter={() =>
                setActiveSuggestionIndexes((current) => ({
                  ...current,
                  [type]: index,
                }))
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
          {suggestions.some((item) => item.provider === "google_maps") ? (
            <span translate="no">Google Maps</span>
          ) : (
            <>
              <span>⌖</span>
              {tr
                ? "Gerçek zamanlı konum araması"
                : "Real-time location search"}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="transfer-page">

      <section className="transfer-hero section-pad">

        <div className="transfer-hero-photo" aria-hidden="true">
          <img src={transferHeroImage} alt="" />
        </div>

        <div className="transfer-hero-copy">

          <span className="eyebrow">
            {tr
              ? "SKYFLEET ÖZEL TRANSFER"
              : "THE SKYFLEET TRANSFER EXPERIENCE"}
          </span>

          <h1>
            {tr
              ? <>Yolculuğunuz<br />iyi ellerde.</>
              : <>A better journey.<br />From the first hello.</>}
          </h1>

          <p>
            {tr
              ? "Havalimanı karşılamalarından iş seyahatlerine kadar; konforlu araçlar, profesyonel bir karşılama ve size ayrılan özel bir yolculuk."
              : "From airport arrivals to business trips. Refined vehicles, a professional welcome and a private journey made for you."}
          </p>

          <a className="transfer-hero-cta" href="#transfer-reservation">
            {tr ? "Yolculuğunuzu planlayın" : "Plan your journey"}
            <span aria-hidden="true">↓</span>
          </a>

          <div className="transfer-trust-row">

            <span>
              <b>✓</b>
              {tr
                ? "Profesyonel karşılama"
                : "A professional welcome"}
            </span>

            <span>
              <b>✓</b>
              {tr
                ? "Özenli araç seçimi"
                : "Considered vehicle classes"}
            </span>

            <span>
              <b>✓</b>
              {tr
                ? "Size özel transfer"
                : "Your own private transfer"}
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

      <section className="transfer-assurance" aria-label={tr ? "Skyfleet transfer avantajları" : "Skyfleet transfer benefits"}>
        <div className="transfer-assurance-inner">
          {(tr
            ? ["Profesyonel karşılama", "Özenli araç seçimi", "Bağlantılı operasyon", "Size özel transfer"]
            : ["A professional welcome", "Considered vehicle classes", "Connected operations", "Your own private transfer"]
          ).map((benefit) => (
            <span key={benefit}><i aria-hidden="true">✓</i>{benefit}</span>
          ))}
        </div>
      </section>

      <section className="transfer-service-section" aria-labelledby="transfer-services-title">
        <div className="transfer-service-inner">
          <div className="transfer-service-heading">
            <div>
              <span className="transfer-editorial-eyebrow">
                {tr ? "YOLCULUĞUNUZA UYGUN" : "MADE FOR YOUR PLANS"}
              </span>
              <h2 id="transfer-services-title">
                {tr ? "Her yolculukta aynı özen." : "Thoughtful travel, wherever you are going."}
              </h2>
            </div>
            <a href="#transfer-reservation" className="transfer-service-link">
              {tr ? "Transfer planlayın" : "Arrange a transfer"}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="transfer-service-grid">
            <a href="#transfer-reservation" className="transfer-service-card">
              <div className="transfer-service-image">
                <img src={vanVehicleImage} alt={tr ? "Havalimanında yolcu karşılayan Mercedes Vito" : "Mercedes Vito welcoming passengers at the airport"} loading="lazy" />
                <span>01 / {tr ? "HAVALİMANI" : "AIRPORT ARRIVALS"}</span>
              </div>
              <div className="transfer-service-copy">
                <h3>{tr ? "Havalimanı transferleri" : "Airport transfers"} <span aria-hidden="true">↗</span></h3>
                <p>{tr ? "İlk karşılamadan son varışa kadar, yolculuğunuz bir arada planlanır." : "From the first welcome to your final destination, every detail is thoughtfully arranged."}</p>
              </div>
            </a>

            <a href="#transfer-reservation" className="transfer-service-card">
              <div className="transfer-service-image">
                <img src={executiveVehicleImage} alt={tr ? "Havalimanı önünde executive sınıf sedan" : "Executive sedan waiting at an airport"} loading="lazy" />
                <span>02 / {tr ? "İŞ SEYAHATİ" : "BUSINESS TRAVEL"}</span>
              </div>
              <div className="transfer-service-copy">
                <h3>{tr ? "İş seyahatleri" : "Business travel"} <span aria-hidden="true">↗</span></h3>
                <p>{tr ? "Toplantılar, otel transferleri ve kurumsal konuklar için özenli ulaşım." : "Considered transportation for meetings, hotel transfers and corporate guests."}</p>
              </div>
            </a>

            <a href="#transfer-reservation" className="transfer-service-card">
              <div className="transfer-service-image">
                <img src={luxuryVehicleImage} alt={tr ? "İstanbul'da özel lüks sedan transferi" : "Private luxury sedan transfer in Istanbul"} loading="lazy" />
                <span>03 / {tr ? "ÖZEL YOLCULUK" : "PRIVATE JOURNEYS"}</span>
              </div>
              <div className="transfer-service-copy">
                <h3>{tr ? "Size özel yolculuklar" : "Private journeys"} <span aria-hidden="true">↗</span></h3>
                <p>{tr ? "Şehirlerarası ve özel seyahat ihtiyaçlarınız için transfer talebinizi iletin." : "Request a transfer for intercity travel, special occasions and your own itinerary."}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="transfer-booking-section section-pad" id="transfer-reservation">

        <div className="transfer-booking-layout">

          <form
            className="transfer-booking-form"
            onSubmit={submit}
            onChange={(event) => {
              if (["pickup_date", "pickup_time", "passengers", "luggage_count", "vehicle_type"].includes(event.target.name)) {
                setRegionalPrice(null);
                setSubmission({ status: "idle", message: "" });
              }
            }}
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
                      ? "Nereden alınacağınızı ve nereye gideceğinizi belirtin. Fiyatı görmek için iletişim bilgisi gerekmez."
                      : "Tell us where your journey starts and ends. You can see the price before entering contact details."}
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
                      value="standard_car"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={executiveVehicleImage} alt="" loading="lazy" />
                      <strong>STANDARD CAR</strong>
                      <small>{tr ? "1–3 yolcu" : "1–3 passengers"}</small>
                      <em>{tr ? "Konforlu özel transfer" : "Private comfort"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="executive_car"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={executiveVehicleImage} alt="" loading="lazy" />
                      <strong>EXECUTIVE</strong>
                      <small>{tr ? "1–3 yolcu" : "1–3 passengers"}</small>
                      <em>{tr ? "Business ve premium sedan" : "Business & premium sedan"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="luxury_car"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={luxuryVehicleImage} alt="" loading="lazy" />
                      <strong>LUXURY</strong>
                      <small>{tr ? "1–2 yolcu" : "1–2 passengers"}</small>
                      <em>{tr ? "Üst segment lüks araç" : "High-end luxury vehicle"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="people_carrier"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={vanVehicleImage} alt="" loading="lazy" />
                      <strong>PEOPLE CARRIER</strong>
                      <small>{tr ? "4–6 yolcu" : "4–6 passengers"}</small>
                      <em>{tr ? "Aile ve küçük gruplar" : "Families & small groups"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="executive_people_carrier"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={vanVehicleImage} alt="" loading="lazy" />
                      <strong>EXECUTIVE PEOPLE CARRIER</strong>
                      <small>{tr ? "5–7 yolcu" : "5–7 passengers"}</small>
                      <em>{tr ? "VIP ve kurumsal hizmet" : "VIP & corporate service"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="large_people_carrier"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={vanVehicleImage} alt="" loading="lazy" />
                      <strong>LARGE PEOPLE CARRIER</strong>
                      <small>{tr ? "7–8 yolcu" : "7–8 passengers"}</small>
                      <em>{tr ? "Kalabalık aile ve gruplar" : "Larger families & groups"}</em>
                    </span>
                  </label>

                  <label className="vehicle-choice">
                    <input
                      type="radio"
                      name="vehicle_type"
                      value="minibus"
                      required
                      onChange={() => {
                        setRegionalPrice(null);
                        setSubmission({ status: "idle", message: "" });
                      }}
                    />

                    <span className="vehicle-card">
                      <img src={vanVehicleImage} alt="" loading="lazy" />
                      <strong>MINIBUS</strong>
                      <small>{tr ? "9+ yolcu" : "9+ passengers"}</small>
                      <em>{tr ? "Büyük gruplar" : "Large groups"}</em>
                    </span>
                  </label>

                </div>

                <div className="transfer-currency-area">
                  <div className="transfer-currency-heading">
                    <div>
                      <span className="transfer-currency-kicker">
                        {tr ? "TERCİH ETTİĞİNİZ PARA BİRİMİ" : "PREFERRED CURRENCY"}
                      </span>
                      <h4>{tr ? "Fiyatı hangi para biriminde görmek istersiniz?" : "Which currency would you like to see your price in?"}</h4>
                      <p>{tr ? "Bir para birimi seçin. Teklifiniz seçiminize göre hesaplanacaktır." : "Choose one currency. Your quote will be calculated using your selection."}</p>
                    </div>
                    <span className="transfer-currency-secure">✓ {tr ? "Kur teklif süresince sabit" : "Rate locked for quote"}</span>
                  </div>

                  <div className="transfer-currency-grid" role="radiogroup" aria-label={tr ? "Para birimi seçimi" : "Currency selection"}>
                    {[
                      ["TRY", "₺", "Türk Lirası", "Turkish Lira"],
                      ["EUR", "€", "Euro", "Euro"],
                      ["USD", "$", "ABD Doları", "US Dollar"],
                      ["GBP", "£", "İngiliz Sterlini", "British Pound"],
                    ].map(([code, symbol, trName, enName]) => (
                      <label
                        key={code}
                        className={`currency-choice ${displayCurrency === code ? "active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="display_currency"
                          value={code}
                          checked={displayCurrency === code}
                          onChange={() => {
                            setDisplayCurrency(code);
                            setRegionalPrice(null);
                            setSubmission({ status: "idle", message: "" });
                          }}
                        />
                        <span className="currency-symbol">{symbol}</span>
                        <span className="currency-copy">
                          <strong>{code}</strong>
                          <small>{tr ? trName : enName}</small>
                        </span>
                        <span className="currency-check" aria-hidden="true">✓</span>
                      </label>
                    ))}
                  </div>
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
                      ? "Fiyatı hesapladıktan sonra talebinizi göndermek için bu bilgileri tamamlayın."
                      : "Add your contact details after checking the price to submit your request."}
                  </p>
                </div>

              </div>

              <div className="transfer-form-grid">

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Ad soyad"
                      : "Full name"}
                    {regionalPrice && <b>*</b>}
                  </span>

                  <input
                    name="passenger_name"
                    autoComplete="name"
                    required={Boolean(regionalPrice)}
                  />
                </label>

                <label className="transfer-field">
                  <span>
                    {tr
                      ? "Telefon / WhatsApp"
                      : "Phone / WhatsApp"}
                    {regionalPrice && <b>*</b>}
                  </span>

                  <input
                    name="passenger_phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+90..."
                    required={Boolean(regionalPrice)}
                  />
                </label>

                <label className="transfer-field transfer-field-wide">
                  <span>
                    {tr
                      ? "E-posta"
                      : "Email"}
                    {regionalPrice && <b>*</b>}
                  </span>

                  <input
                    name="passenger_email"
                    type="email"
                    autoComplete="email"
                    required={Boolean(regionalPrice)}
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
                required={Boolean(regionalPrice)}
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
                      ? regionalPrice
                        ? "Ödeme sayfasına yönlendiriliyor..."
                        : "Talebiniz gönderiliyor..."
                      : regionalPrice
                        ? "Redirecting to payment..."
                        : "Submitting request..."
                  )
                  : (
                    tr
                      ? regionalPrice
                        ? "Ödemeye Geç"
                        : "Fiyatı Hesapla"
                      : regionalPrice
                        ? "Proceed to Payment"
                        : "Calculate Price"
                  )}

                <span>→</span>

              </button>

              <div className="transfer-submit-note">

                <strong>
                  {tr
                    ? regionalPrice
                      ? "Rezervasyonunuzu tamamlamak için güvenli Stripe ödeme sayfasına yönlendirileceksiniz."
                      : "Bu aşamada ödeme gerekmez."
                    : regionalPrice
                      ? "You will be redirected to our secure Stripe payment page to complete your booking."
                      : "No payment required at this stage."}
                </strong>

                <small>
                  {tr
                    ? "Saatler transferin yapıldığı yerin yerel saatidir. Talebiniz operasyon ekibimiz tarafından teyit edilir."
                    : "Times are local to your transfer location. Our operations team will confirm your request."}
                </small>

              </div>

            </div>

            {regionalPrice?.available && (
              <section className="premium-quote-card" aria-live="polite">
                <div className="premium-quote-topline">
                  <div className="premium-quote-label">
                    <span className="premium-discount-icon">%</span>
                    <div>
                      <small>{tr ? "TRANSFER TEKLİFİNİZ" : "YOUR TRANSFER QUOTE"}</small>
                      <strong>{tr ? "İndirimli transfer tahmini" : "Discounted transfer estimate"}</strong>
                    </div>
                  </div>
                  <span className="premium-quote-badge">✓ {tr ? "İndirim dahil" : "Discount included"}</span>
                </div>

                <div className="premium-quote-main">
                  <div className="premium-quote-price">
                    <span>{regionalPrice.currency}</span>
                    <strong>
                      {new Intl.NumberFormat(tr ? "tr-TR" : "en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(regionalPrice.public_price ?? 0))}
                    </strong>
                  </div>
                  <p>
                    {tr
                      ? "Fiyatınız hazır. Bilgileri kontrol edip transfer talebinizi gönderebilirsiniz."
                      : "Your price is ready. Review the details and submit your transfer request."}
                  </p>
                </div>

                <div className="premium-quote-facts">
                  <div>
                    <span className="premium-fact-icon">◆</span>
                    <p><small>{tr ? "Araç sınıfı" : "Vehicle class"}</small><strong>{tr ? "Seçtiğiniz araç" : "Your selected vehicle"}</strong></p>
                  </div>
                  <div>
                    <span className="premium-fact-icon">◉</span>
                    <p><small>{tr ? "Yolcu" : "Passengers"}</small><strong>{tr ? "Formdaki yolcu sayısı" : "As entered above"}</strong></p>
                  </div>
                  <div>
                    <span className="premium-fact-icon">▣</span>
                    <p><small>{tr ? "Kur" : "Exchange rate"}</small><strong>{regionalPrice.exchange_rate_locked ? (tr ? "Teklif süresince sabit" : "Locked for this quote") : (tr ? "Baz para birimi" : "Base currency")}</strong></p>
                  </div>
                </div>

                <div className="premium-quote-footer">
                  <span>✓ {tr ? "Güvenli rezervasyon" : "Secure booking"}</span>
                  <span>✓ {tr ? "7/24 operasyon desteği" : "24/7 operations support"}</span>
                  <span>✓ {tr ? "Canlı yolculuk takibi" : "Live journey tracking"}</span>
                </div>

                {regionalPrice.base_currency && regionalPrice.currency !== regionalPrice.base_currency && (
                  <small className="premium-quote-note">
                    {tr
                      ? `Fiyat ${regionalPrice.base_currency} bazından ${regionalPrice.currency} para birimine çevrilmiştir. Kullanılan kur bu teklif süresince sabittir.`
                      : `Converted from ${regionalPrice.base_currency} to ${regionalPrice.currency}. The exchange rate is locked for this quote.`}
                  </small>
                )}
              </section>
            )}

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
        `${PUBLIC_API_BASE}/supplier-applications`,
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
function Field({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props} /></label>; }

function Footer({ language }) {
  const tr = language === "tr";
  return <footer className="site-footer section-pad"><a className="brand footer-brand" href="/"><span className="brand-mark"><i />ST</span><span><strong>SKYFLEET</strong><em></em><small>Global Mobility Network</small></span></a><p>{tr ? "Global havalimanı transfer operasyonları ve tedarikçi ağı." : "Global airport transfer operations and supplier network."}</p><div><a href="/about">{tr ? "Hakkımızda" : "About us"}</a><a href="/tour-packages">{tr ? "Tur paketleri" : "Tour packages"}</a><a href="/transfer">{tr ? "Transfer" : "Book a transfer"}</a><a href="/supplier/join">{tr ? "Tedarikçi ol" : "Become a supplier"}</a>
  <a href="/agency/join">
  {tr ? "Acenta ol" : "Become an agency"}
</a><a href="/supplier/">{tr ? "Giriş" : "Login"}</a></div><small>© 2026 SkyTripTransfer. All rights reserved.</small></footer>;
}

function getPage(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/transfer") return "transfer";
  if (normalized === "/tour-booking") return "tour-booking";
  if (normalized === "/booking-success") return "booking-success";
  if (normalized === "/supplier/join") return "supplier";
  if (normalized === "/agency/join") return "agency";
  if (normalized === "/about") return "about";
  if (normalized === "/tour-packages") return "tours";
  return "home";
}
