import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import apiClient from "./apiClient";

const firebaseConfig = {
  apiKey: "AIzaSyDrikbfJqY2EJfvsnvcARlUAdBqiWLxSUI",
  authDomain: "skyfleet-ai-e2b1a.firebaseapp.com",
  projectId: "skyfleet-ai-e2b1a",
  storageBucket: "skyfleet-ai-e2b1a.firebasestorage.app",
  messagingSenderId: "1065536064600",
  appId: "1:1065536064600:web:185a249bfed7918e140e2d",
};

const vapidKey = "BGfa2vQL7-dc8n5kA2QYdZAKpHn14lsRKyS220yWDDwsuyf6idw-qExpqLD655HafYBsXD2dwwL6aNlM1-pvUPw";

function firebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

async function messagingInstance() {
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp());
}

async function serviceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
 return navigator.serviceWorker.register(
  "/driver/firebase-messaging-sw.js",
  {
    scope: "/driver/",
    updateViaCache: "none",
  },
);
}

export async function registerForPushNotifications({ requestPermission = true } = {}) {
  if (!("Notification" in window)) {
    throw new Error("Bu tarayıcı bildirimleri desteklemiyor.");
  }

  let permission = Notification.permission;
  if (permission === "default" && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error("Bildirim izni verilmedi.");
  }

  const messaging = await messagingInstance();
  const registration = await serviceWorkerRegistration();
  if (!messaging || !registration) {
    throw new Error("Firebase bildirimleri bu tarayıcıda kullanılamıyor.");
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Cihaz bildirim anahtarı oluşturulamadı.");

  await apiClient.post("/driver/push-token", { token, platform: "web" });
  return token;
}

export async function listenForForegroundMessages(callback) {
  const messaging = await messagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
