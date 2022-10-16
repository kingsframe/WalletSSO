import { initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { WalletConnectionProvider } from "../components/wallets/WalletConnectionProvider";
import { firebaseConfig } from "../utils/FirebaseConfig";
import HomePage from "./HomePage";

const Home: NextPage = () => {
  // const [auth, setAuth] = useState<Auth | null>(null);

  // useEffect(() => {
  //   // Initialize Firebase
  //   const app = initializeApp(firebaseConfig);
  //   const firebaseAuth = getAuth(app);
  //   setAuth(firebaseAuth);
  //   connectAuthEmulator(firebaseAuth, "http://localhost:9099");
  // }, []);

  return (
    <WalletConnectionProvider>
      <HomePage />
    </WalletConnectionProvider>
  );
};

export default Home;
