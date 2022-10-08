import { useWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import { useCallback, useEffect } from "react";

const requestUrl = "/api/solana-auth/getauthchallenge";
const domain = "example.xyz";
const nonceStr = (nonce: string) => `|| id=${nonce}`;
export const signInMessage = (nonce: string, domain: string) =>
  "Sign this message to sign into " + domain + nonceStr(nonce);

const HomePage: NextPage = () => {
  const { publicKey, signMessage, connect, wallet, connected, disconnect } =
    useWallet();

  const authenticate = useCallback(async () => {
    try {
      const { nonce } = await fetch(`${requestUrl}?pubkey=${publicKey}`)
        .then((resp) => resp.json())
        .then((data) => data);

      console.log("nonce: ", nonce);
      if (!signMessage) throw new Error("Wallet does not support signing");

      // TODO: Abstract into user defined message
      // construct the message
      const message = signInMessage(nonce, domain);
      console.log("message: ", message);
      // encode the message
      const encodedMsg = new TextEncoder().encode(message);
      // sign with the wallet
      const signature = await signMessage(encodedMsg);
      console.log("signature: ", signature);
    } catch (e) {
      console.error("Authentication failed");
    }
  }, [signMessage, publicKey]);

  useEffect(() => {
    if (connected) {
      authenticate();
    }
  }, [connected, authenticate]);

  return <div>Home Page</div>;
};

export default HomePage;
