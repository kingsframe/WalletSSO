import { initializeApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { firebaseConfig } from "../utils/FirebaseConfig";

const Home: NextPage = () => {
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const firebaseAuth = getAuth(app);
    setAuth(firebaseAuth);
    connectAuthEmulator(firebaseAuth, "http://localhost:9099");
  }, []);

  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");

  const loginEmailPassword = async () => {
    if (!auth) return console.error("No auth provided yet!");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("userCredential: ", userCredential);
    } catch (error) {
      console.log(`There was an error: ${error}`);
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <label>Enter your email: </label>
        <input
          type="text"
          name="name"
          id="name"
          onChange={(e) => setemail(e.target.value)}
        />
      </div>
      <div>
        <label>Enter your password: </label>
        <input
          type="text"
          name="email"
          id="email"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={loginEmailPassword}>Log In</button>
    </div>
  );
};

export default Home;
