import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost:
    import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
  wsPort:
    Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  wssPort:
    Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  forceTLS:
    (import.meta.env.VITE_REVERB_SCHEME || "http") ===
    "https",
  enabledTransports: ["ws", "wss"],
});

echo.connector.pusher.connection.bind(
  "state_change",
  (states) => {
    console.log(
      "Reverb bağlantısı:",
      states.previous,
      "→",
      states.current,
    );
  },
);

echo.connector.pusher.connection.bind(
  "error",
  (error) => {
    console.error("Reverb bağlantı hatası:", error);
  },
);

export default echo;