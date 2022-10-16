import { useWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import { useCallback, useEffect } from "react";

const requestUrl =
  "http://localhost:10001/walletsso/us-central1/getauthchallenge";
const callbackUrl =
  "http://localhost:10001/walletsso/us-central1/completeauthchallenge";
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

      // complete the authorization
      const callbackData = await fetch(
        callbackUrl +
          "?" +
          new URLSearchParams({
            pubkey: publicKey!.toString(),
            payload: message,
            signature: Array.from(signature).toString(),
          })
      ).then((resp) => resp.json());
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
