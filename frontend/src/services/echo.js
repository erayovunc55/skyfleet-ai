import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const reverbKey =
  import.meta.env.VITE_REVERB_APP_KEY;

const reverbHost =
  import.meta.env.VITE_REVERB_HOST;

const reverbPort =
  Number(
    import.meta.env.VITE_REVERB_PORT,
  ) || 8080;

const reverbScheme =
  import.meta.env.VITE_REVERB_SCHEME ||
  "http";

let echo = null;

if (reverbKey) {
  try {
    echo = new Echo({
      broadcaster: "reverb",
      key: reverbKey,

      wsHost:
        reverbHost || "127.0.0.1",

      wsPort:
        reverbPort,

      wssPort:
        reverbPort,

      forceTLS:
        reverbScheme === "https",

      enabledTransports: [
        "ws",
        "wss",
      ],
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
        console.error(
          "Reverb bağlantı hatası:",
          error,
        );
      },
    );
  } catch (error) {
    console.error(
      "Reverb başlatılamadı:",
      error,
    );

    echo = null;
  }
} else {
  console.warn(
    "Reverb devre dışı: VITE_REVERB_APP_KEY tanımlı değil.",
  );
}

export default echo;