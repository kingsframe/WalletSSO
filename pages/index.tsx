import type { NextPage } from "next";
import { useContext } from "react";
import styles from "../styles/Home.module.css";
import { FirebaseContext } from "./_app";

const Home: NextPage = () => {
  const { auth } = useContext(FirebaseContext);

  console.log("auth: ", auth);
  return (
    <div className={styles.container}>
      <form action="">
        <div>
          <label>Enter your username: </label>
          <input type="text" name="name" id="name" required />
        </div>
        <div>
          <label>Enter your password: </label>
          <input type="text" name="email" id="email" required />
        </div>
        <div>
          <input type="submit" value="Log in" />
        </div>
      </form>
    </div>
  );
};

export default Home;
