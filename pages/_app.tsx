import "../styles/globals.css";
import type { AppProps } from "next/app";
import { FirebaseApp, initializeApp } from "firebase/app";
import { Analytics, getAnalytics } from "firebase/analytics";
import { Auth, getAuth } from "firebase/auth";
import { createContext } from "react";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5Nx4OqLsnHLvUxkAHOxlsaQeMs_XQ7CU",
  authDomain: "walletsso.firebaseapp.com",
  projectId: "walletsso",
  storageBucket: "walletsso.appspot.com",
  messagingSenderId: "937373074013",
  appId: "1:937373074013:web:d2eafd29bbfc1fa76843b4",
  measurementId: "G-G9SQKTCG3R",
};

type FirebaseContextT = {
  app: FirebaseApp;
  analytics: Analytics;
  auth: Auth;
};

export const FirebaseContext = createContext<FirebaseContextT | null>(null);

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);

  return (
    <FirebaseContext.Provider
      value={{
        app,
        analytics,
        auth,
      }}
    >
      <Component {...pageProps} />
    </FirebaseContext.Provider>
  );
}

export default MyApp;
