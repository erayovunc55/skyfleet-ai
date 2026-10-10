import { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "./api";
import "./App.css";

const vehicleOptions = [
  ["standard_car", "Standard Car"],
  ["executive_car", "Executive Car"],
  ["luxury_car", "Luxury Car"],
  ["people_carrier", "People Carrier"],
  ["executive_people_carrier", "Executive People Carrier"],
  ["large_people_carrier", "Large People Carrier"],
  ["minibus", "Minibus"],
];

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  on_the_way: "On the way",
  arrived: "Arrived",
  passenger_called: "Passenger called",
  passenger_on_board: "Passenger on board",
  trip_started: "Trip started",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("agency_user") || "null");
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readStoredUser);
  const token = localStorage.getItem("agency_token");
  const resetParams = new URLSearchParams(window.location.search);

  if (resetParams.get("reset_token")) {
    return (
      <ResetPasswordPage
        token={resetParams.get("reset_token")}
        email={resetParams.get("email") || ""}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLogin={setUser} />
          )
        }
      />

      <Route
        path="/*"
        element={
          token ? (
            <PortalShell user={user} setUser={setUser} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/agency/login", {
        login,
        password,
      });

      localStorage.setItem("agency_token", response.data.token);
      localStorage.setItem("agency_user", JSON.stringify(response.data.user));
      onLogin(response.data.user);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">SF</div>
        <span className="eyebrow">SKYFLEET AGENCY NETWORK</span>
        <h1>Agency Portal</h1>
        <p>Manage bookings, passengers and transfer operations from one place.</p>

        <form onSubmit={submit} className="login-form">
          <label>
            <span>Email or phone</span>
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Agency Portal"}
          </button>

          <button
            type="button"
            className="link-button"
            onClick={() => setForgotOpen((open) => !open)}
          >
            Forgot password? / Şifremi unuttum
          </button>
        </form>

        {forgotOpen && <ForgotPasswordForm initialEmail={login} />}

        <div className="login-footnote">
          <span>Secure B2B access</span>
          <span>24/7 operations support</span>
        </div>
      </section>
    </main>
  );
}

function ForgotPasswordForm({ initialEmail }) {
  const [email, setEmail] = useState(
    initialEmail.includes("@") ? initialEmail : "",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/agency-password/forgot", { email });
      setMessage(
        "If this email belongs to an agency account, a reset link has been sent. / Bu e-posta bir acenta hesabına aitse sıfırlama bağlantısı gönderildi.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "The request could not be sent. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="login-form forgot-form">
      <label>
        <span>Account email / Hesap e-postası</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </label>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <button className="primary-button" disabled={loading}>
        {loading ? "Sending..." : "Send reset link / Bağlantı gönder"}
      </button>
    </form>
  );
}

function ResetPasswordPage({ token, email }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("Passwords do not match. / Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/agency-password/reset", {
        email,
        token,
        password,
        password_confirmation: confirmation,
      });
      setMessage("Password updated. / Şifreniz güncellendi.");
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(
        (errors && Object.values(errors).flat()[0]) ||
          requestError.response?.data?.message ||
          "Password could not be reset.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">SF</div>
        <span className="eyebrow">SKYFLEET AGENCY NETWORK</span>
        <h1>Reset password</h1>
        <p>{email}</p>

        {message ? (
          <>
            <div className="alert success">{message}</div>
            <a className="primary-button" href="/agency/">
              Sign in / Giriş yap
            </a>
          </>
        ) : (
          <form onSubmit={submit} className="login-form">
            <label>
              <span>New password / Yeni şifre</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              <span>Confirm password / Şifre tekrar</span>
              <input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {error && <div className="alert error">{error}</div>}

            <button className="primary-button" disabled={loading}>
              {loading ? "Saving..." : "Save new password / Kaydet"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
function PortalShell({ user, setUser }) {
  const navigate = useNavigate();

  async function logout() {
    try {
      await api.post("/agency/logout");
    } catch {
      // local logout still continues
    }

    localStorage.removeItem("agency_token");
    localStorage.removeItem("agency_user");
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">SF</div>
          <div>
            <strong>SKYFLEET</strong>
            <small>AGENCY PORTAL</small>
          </div>
        </div>

        <nav>
          <NavLink end to="/">Overview</NavLink>
          <NavLink to="/bookings/new">New Booking</NavLink>
          <NavLink to="/bookings">My Transfers</NavLink>
          <NavLink to="/profile">Agency Profile</NavLink>
        </nav>

        <div className="sidebar-footer">
          <small>Signed in as</small>
          <strong>{user?.name || "Agency User"}</strong>
          <span>{user?.agency_company?.company_name || "Agency"}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">B2B TRANSFER MANAGEMENT</span>
            <strong>{user?.agency_company?.company_name || "Agency Portal"}</strong>
          </div>
          <div className="topbar-pill">
            <span className="online-dot" />
            Operational
          </div>
        </header>

        <div className="page-wrap">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/bookings/new" element={<NewBookingPage />} />
            <Route path="/bookings" element={<TransfersPage />} />
            <Route path="/bookings/:id" element={<TransferDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/agency/dashboard")
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Dashboard could not be loaded."),
      );
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <Loading />;

  const stats = [
    ["Total transfers", data.total_transfers],
    ["Pending", data.pending_transfers],
    ["Active", data.active_transfers],
    ["Completed", data.completed_transfers],
    ["Today", data.today_transfers],
  ];

  return (
    <>
      <PageHeading
        eyebrow="AGENCY OVERVIEW"
        title="Your transfer operations at a glance."
        text="Create bookings, follow upcoming journeys and keep your passengers connected with Skyfleet operations."
        action={<NavLink className="primary-button link-button" to="/bookings/new">Create booking</NavLink>}
      />

      <section className="stat-grid">
        {stats.map(([label, value]) => (
          <article className="stat-card" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">NEXT JOURNEYS</span>
            <h2>Upcoming transfers</h2>
          </div>
          <NavLink to="/bookings">View all</NavLink>
        </div>

        {data.upcoming_transfers?.length ? (
          <TransferTable transfers={data.upcoming_transfers} />
        ) : (
          <EmptyState
            title="No upcoming transfers yet"
            text="Create your first agency booking and it will appear here."
          />
        )}
      </section>
    </>
  );
}

function TransfersPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/agency/transfers")
      .then((response) => setPayload(response.data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Transfers could not be loaded."),
      );
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!payload) return <Loading />;

  return (
    <>
      <PageHeading
        eyebrow="MY TRANSFERS"
        title="All agency bookings"
        text="Only transfers created under your agency account are shown here."
        action={<NavLink className="primary-button link-button" to="/bookings/new">New booking</NavLink>}
      />

      <section className="panel">
        {payload.data?.length ? (
          <TransferTable transfers={payload.data} />
        ) : (
          <EmptyState
            title="No agency transfers"
            text="Your booking list is currently empty."
          />
        )}
      </section>
    </>
  );
}

function TransferTable({ transfers }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Passenger</th>
            <th>Route</th>
            <th>Pickup</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id}>
              <td><strong>{transfer.booking_reference}</strong></td>
              <td>{transfer.passenger_name}</td>
              <td className="route-cell">
                <span>{transfer.pickup}</span>
                <b>→</b>
                <span>{transfer.dropoff}</span>
              </td>
              <td>{formatDateTime(transfer.pickup_time)}</td>
              <td><StatusBadge status={transfer.status} /></td>
              <td>
                <NavLink className="text-link" to={`/bookings/${transfer.id}`}>
                  Open
                </NavLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewBookingPage() {
  const navigate = useNavigate();
  const storedUser = readStoredUser();
  const defaultCurrency = storedUser?.agency_company?.default_currency || "EUR";

  const [form, setForm] = useState({
    passenger_name: "",
    passenger_phone: "",
    passenger_email: "",
    flight_number: "",
    pickup: "",
    pickup_date: "",
    pickup_time: "",
    dropoff: "",
    vehicle_type: "standard_car",
    adult: 1,
    child: 0,
    baby: 0,
    luggage_count: 0,
    passenger_note: "",
    display_currency: defaultCurrency,
  });

  const [selectedLocations, setSelectedLocations] = useState({
    pickup: null,
    dropoff: null,
  });
  const [suggestions, setSuggestions] = useState({ pickup: [], dropoff: [] });
  const [searching, setSearching] = useState({ pickup: false, dropoff: false });
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const timers = useRef({ pickup: null, dropoff: null });

  const earliestDate = new Date().toISOString().slice(0, 10);

  function invalidateQuote() {
    setQuote(null);
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));

    if (
      [
        "pickup_date",
        "pickup_time",
        "vehicle_type",
        "adult",
        "child",
        "baby",
        "luggage_count",
        "display_currency",
      ].includes(name)
    ) {
      invalidateQuote();
    }
  }

  function updateLocation(type, value) {
    setForm((current) => ({ ...current, [type]: value }));
    setSelectedLocations((current) => ({ ...current, [type]: null }));
    invalidateQuote();
    setError("");

    if (timers.current[type]) clearTimeout(timers.current[type]);

    const query = value.trim();
    if (query.length < 2) {
      setSuggestions((current) => ({ ...current, [type]: [] }));
      setSearching((current) => ({ ...current, [type]: false }));
      return;
    }

    setSearching((current) => ({ ...current, [type]: true }));

    timers.current[type] = setTimeout(async () => {
      try {
        const response = await api.get("/public/address-search", {
          params: { q: query },
        });

        setSuggestions((current) => ({
          ...current,
          [type]: Array.isArray(response.data?.data) ? response.data.data : [],
        }));
      } catch {
        setSuggestions((current) => ({ ...current, [type]: [] }));
      } finally {
        setSearching((current) => ({ ...current, [type]: false }));
      }
    }, 450);
  }

  function chooseLocation(type, item) {
    setSelectedLocations((current) => ({ ...current, [type]: item }));
    setForm((current) => ({
      ...current,
      [type]: item.formatted_address || item.label || item.name || current[type],
    }));
    setSuggestions((current) => ({ ...current, [type]: [] }));
    invalidateQuote();
    setError("");
  }

  function pricingContext() {
    const pickup = selectedLocations.pickup;
    const dropoff = selectedLocations.dropoff;

    if (!pickup || !dropoff) {
      throw new Error("Select both pickup and drop-off from the suggestions.");
    }

    const pickupIsAirport = Boolean(pickup.is_airport && pickup.location_id);
    const dropoffIsAirport = Boolean(dropoff.is_airport && dropoff.location_id);

    if (pickupIsAirport === dropoffIsAirport) {
      throw new Error(
        "For instant pricing, one end must be an airport and the other an address or hotel.",
      );
    }

    const airport = pickupIsAirport ? pickup : dropoff;
    const address = pickupIsAirport ? dropoff : pickup;

    return {
      pickup,
      dropoff,
      airport,
      address,
      direction: pickupIsAirport ? "pickup" : "dropoff",
    };
  }

  async function calculatePrice() {
    setQuoteLoading(true);
    setError("");

    try {
      const context = pricingContext();
      const passengers = Math.max(
        1,
        Number(form.adult || 0) + Number(form.child || 0) + Number(form.baby || 0),
      );

      if (!form.pickup_date || !form.pickup_time) {
        throw new Error("Select the pickup date and time.");
      }

      const response = await api.post("/agency/pricing", {
        pickup_date: form.pickup_date,
        pickup_time: form.pickup_time,
        passengers,
        luggage_count: Number(form.luggage_count || 0),
        latitude: context.address.latitude,
        longitude: context.address.longitude,
        direction: context.direction,
        vehicle_type: form.vehicle_type,
        airport_location_id: context.airport.location_id,
        display_currency: form.display_currency,
      });

      if (!response.data?.available) {
        throw new Error(
          response.data?.message ||
            "An instant agency price is not available for this route.",
        );
      }

      setQuote(response.data);
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      const firstValidation = validation ? Object.values(validation).flat()[0] : null;
      setQuote(null);
      setError(
        firstValidation ||
          requestError.response?.data?.message ||
          requestError.message ||
          "Price could not be calculated.",
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!quote) {
      await calculatePrice();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const context = pricingContext();

      const response = await api.post("/agency/transfers", {
        quote_token: quote.quote_token,
        passenger_name: form.passenger_name,
        passenger_phone: form.passenger_phone,
        passenger_email: form.passenger_email || null,
        flight_number: form.flight_number || null,
        pickup: form.pickup,
        pickup_lat: context.pickup.latitude,
        pickup_lng: context.pickup.longitude,
        pickup_location_id: context.pickup.location_id || null,
        dropoff: form.dropoff,
        dropoff_lat: context.dropoff.latitude,
        dropoff_lng: context.dropoff.longitude,
        dropoff_location_id: context.dropoff.location_id || null,
        pickup_date: form.pickup_date,
        pickup_time: form.pickup_time,
        timezone: quote.timezone,
        display_currency: quote.currency,
        vehicle_type: form.vehicle_type,
        adult: Number(form.adult || 0),
        child: Number(form.child || 0),
        baby: Number(form.baby || 0),
        luggage_count: Number(form.luggage_count || 0),
        passenger_note: form.passenger_note || null,
      });

      navigate(`/bookings/${response.data.data.id}`);
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      const firstValidation = validation ? Object.values(validation).flat()[0] : null;

      if (validation?.quote_token) setQuote(null);

      setError(
        firstValidation ||
          requestError.response?.data?.message ||
          "Booking could not be created.",
      );
    } finally {
      setLoading(false);
    }
  }

  function renderLocationField(type, label) {
    const items = suggestions[type];

    return (
      <Field label={label} wide>
        <div className="location-search-wrap">
          <input
            value={form[type]}
            onChange={(event) => updateLocation(type, event.target.value)}
            placeholder={type === "pickup" ? "Airport, hotel or address" : "Hotel, address or airport"}
            autoComplete="off"
            required
          />

          {form[type].trim().length >= 2 && !selectedLocations[type] && (
            <div className="location-dropdown">
              {searching[type] && <div className="location-status">Searching locations...</div>}
              {!searching[type] && items.length === 0 && (
                <div className="location-status">No location found. Try a more specific search.</div>
              )}
              {!searching[type] && items.map((item) => (
                <button
                  key={item.place_id || `${item.latitude}-${item.longitude}`}
                  type="button"
                  className="location-option"
                  onClick={() => chooseLocation(type, item)}
                >
                  <span className={`location-icon ${item.is_airport ? "airport" : "address"}`}>
                    {item.is_airport ? "✈" : "•"}
                  </span>
                  <span>
                    <strong>{item.name || item.label}</strong>
                    <small>{item.formatted_address || item.label}</small>
                  </span>
                  {item.iata && <em>{item.iata}</em>}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="NEW BOOKING"
        title="Create an agency transfer"
        text="Search the route, calculate your contracted agency rate and send the confirmed booking directly to Skyfleet operations."
      />

      <form className="booking-form panel" onSubmit={submit}>
        {error && <div className="alert error full booking-alert">{error}</div>}

        <FormSection title="Passenger" number="01">
          <Field label="Passenger name">
            <input value={form.passenger_name} onChange={(e) => update("passenger_name", e.target.value)} required />
          </Field>
          <Field label="Phone / WhatsApp">
            <input value={form.passenger_phone} onChange={(e) => update("passenger_phone", e.target.value)} required />
          </Field>
          <Field label="Email">
            <input type="email" value={form.passenger_email} onChange={(e) => update("passenger_email", e.target.value)} />
          </Field>
          <Field label="Flight number">
            <input value={form.flight_number} onChange={(e) => update("flight_number", e.target.value)} placeholder="TK1985" />
          </Field>
        </FormSection>

        <FormSection title="Journey" number="02">
          {renderLocationField("pickup", "Pickup")}
          {renderLocationField("dropoff", "Drop-off")}

          <Field label="Pickup date">
            <input type="date" min={earliestDate} value={form.pickup_date} onChange={(e) => update("pickup_date", e.target.value)} required />
          </Field>
          <Field label="Pickup time">
            <input type="time" value={form.pickup_time} onChange={(e) => update("pickup_time", e.target.value)} required />
          </Field>
          <Field label="Vehicle class">
            <select value={form.vehicle_type} onChange={(e) => update("vehicle_type", e.target.value)}>
              {vehicleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Quote currency">
            <select value={form.display_currency} onChange={(e) => update("display_currency", e.target.value)}>
              <option value="TRY">TRY — Turkish Lira</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </Field>
        </FormSection>

        <FormSection title="Capacity & notes" number="03">
          <Field label="Adults"><input type="number" min="0" value={form.adult} onChange={(e) => update("adult", Number(e.target.value))} /></Field>
          <Field label="Children"><input type="number" min="0" value={form.child} onChange={(e) => update("child", Number(e.target.value))} /></Field>
          <Field label="Babies"><input type="number" min="0" value={form.baby} onChange={(e) => update("baby", Number(e.target.value))} /></Field>
          <Field label="Luggage"><input type="number" min="0" value={form.luggage_count} onChange={(e) => update("luggage_count", Number(e.target.value))} /></Field>
          <Field label="Passenger note" wide>
            <textarea rows="4" value={form.passenger_note} onChange={(e) => update("passenger_note", e.target.value)} />
          </Field>
        </FormSection>

        <section className="agency-price-section">
          <div className="form-section-heading">
            <span>04</span>
            <h2>Agency price</h2>
          </div>

          {!quote ? (
            <div className="quote-empty">
              <div>
                <span className="quote-lock">LOCKED B2B RATE</span>
                <h3>Calculate your contracted agency price</h3>
                <p>The price is calculated securely by Skyfleet and your agency discount is applied on the backend.</p>
              </div>
              <button className="secondary-button" type="button" onClick={calculatePrice} disabled={quoteLoading}>
                {quoteLoading ? "Calculating..." : "Calculate agency price"}
              </button>
            </div>
          ) : (
            <div className="agency-quote-card">
              <div className="agency-quote-main">
                <span>YOUR CONTRACTED RATE</span>
                <strong>{Number(quote.agency_price).toFixed(2)} {quote.currency}</strong>
                <small>Rate locked until {new Date(quote.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              </div>

              <div className="agency-quote-breakdown">
                <div><span>Public price</span><strong>{Number(quote.public_price).toFixed(2)} {quote.currency}</strong></div>
                <div><span>Agency discount</span><strong>-{Number(quote.agency_discount_percent).toFixed(2)}%</strong></div>
                <div><span>You save</span><strong>{Number(quote.agency_savings).toFixed(2)} {quote.currency}</strong></div>
              </div>

              <div className="agency-quote-trust">
                <span>✓ Exchange rate locked</span>
                <span>✓ Skyfleet operations included</span>
                <span>✓ Passenger live tracking supported</span>
              </div>
            </div>
          )}
        </section>

        <div className="form-actions">
          <div>
            <strong>No supplier or driver assignment is required here.</strong>
            <small>Skyfleet operations will manage fulfilment after the booking is created.</small>
          </div>
          <button className="primary-button" disabled={loading || quoteLoading}>
            {loading
              ? "Creating booking..."
              : quote
                ? "Confirm & create booking"
                : "Calculate price"}
          </button>
        </div>
      </form>
    </>
  );
}

function TransferDetailPage() {
  const { id } = useParams();
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/agency/transfers/${id}`)
      .then((response) => setTransfer(response.data.data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Transfer could not be loaded."),
      );
  }, [id]);

  if (error) return <div className="alert error">{error}</div>;
  if (!transfer) return <Loading />;

  return (
    <>
      <PageHeading
        eyebrow="TRANSFER DETAIL"
        title={transfer.booking_reference}
        text={`${transfer.pickup} → ${transfer.dropoff}`}
        action={<StatusBadge status={transfer.status} />}
      />

      <section className="detail-grid">
        <article className="panel detail-card">
          <h2>Journey</h2>
          <DetailRow label="Pickup" value={transfer.pickup} />
          <DetailRow label="Drop-off" value={transfer.dropoff} />
          <DetailRow label="Pickup time" value={formatDateTime(transfer.pickup_time)} />
          <DetailRow label="Vehicle" value={vehicleOptions.find(([value]) => value === transfer.vehicle_type)?.[1] || transfer.vehicle_type} />
          <DetailRow label="Flight" value={transfer.flight_number || "—"} />
        </article>

        <article className="panel detail-card">
          <h2>Passenger</h2>
          <DetailRow label="Name" value={transfer.passenger_name} />
          <DetailRow label="Phone" value={transfer.passenger_phone} />
          <DetailRow label="Email" value={transfer.passenger_email || "—"} />
          <DetailRow label="Luggage" value={transfer.luggage_count ?? 0} />
          <DetailRow label="Note" value={transfer.passenger_note || "—"} />
        </article>

        <article className="panel detail-card wide-card">
          <h2>Operations</h2>
          <div className="ops-grid">
            <DetailRow label="Supplier" value={transfer.supplier || "Awaiting assignment"} />
            <DetailRow label="Driver" value={transfer.driver?.name || "Awaiting assignment"} />
            <DetailRow label="Vehicle" value={transfer.vehicle ? `${transfer.vehicle.brand || ""} ${transfer.vehicle.model || ""} ${transfer.vehicle.plate || ""}`.trim() : "Awaiting assignment"} />
            <DetailRow label="Currency" value={transfer.currency || "—"} />
          </div>
          {transfer.tracking_url && (
            <a className="primary-button link-button tracking-button" href={transfer.tracking_url} target="_blank" rel="noreferrer">
              Open passenger tracking
            </a>
          )}
        </article>
      </section>
    </>
  );
}

function ProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/agency/profile")
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Profile could not be loaded."),
      );
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <Loading />;

  const agency = data.agency;

  return (
    <>
      <PageHeading
        eyebrow="AGENCY PROFILE"
        title={agency.company_name}
        text="Company and commercial settings linked to your Skyfleet agency account."
      />

      <section className="detail-grid">
        <article className="panel detail-card">
          <h2>Company</h2>
          <DetailRow label="Legal name" value={agency.legal_name || "—"} />
          <DetailRow label="Country" value={agency.country_name || "—"} />
          <DetailRow label="City" value={agency.city || "—"} />
          <DetailRow label="Website" value={agency.website || "—"} />
        </article>

        <article className="panel detail-card">
          <h2>Commercial settings</h2>
          <DetailRow label="Default currency" value={agency.default_currency} />
          <DetailRow label="Agency discount" value={`${agency.discount_percent}%`} />
          <DetailRow label="Status" value={agency.status} />
          <DetailRow label="Account" value={agency.is_active ? "Active" : "Inactive"} />
        </article>
      </section>
    </>
  );
}

function PageHeading({ eyebrow, title, text, action }) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </header>
  );
}

function FormSection({ number, title, children }) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status] || status}</span>;
}

function Loading() {
  return <div className="loading-card">Loading agency data...</div>;
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div>↗</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default App;
