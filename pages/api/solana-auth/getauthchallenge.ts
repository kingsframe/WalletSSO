// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes, secretbox } from "tweetnacl";
import { firebaseConfig } from "../../../utils/FirebaseConfig";

type Data = {
  nonce?: string;
  error?: string;
};

type AttemptT = {
  pubkey: string;
  nonce: string;
  ttl: number;
};

const saveSigninAttempt = async (attempt: AttemptT) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "localhost", 8080);
  try {
    const docRef = await addDoc(collection(db, "signinattempts"), {
      pubkey: attempt.pubkey,
      nonce: attempt.nonce,
      ttl: attempt.ttl,
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
  return;
};

/** FROM: https://github.com/dchest/tweetnacl-js/wiki/Examples */
const newNonce = () => randomBytes(secretbox.nonceLength);

const getNonce = async (pubkey: string) => {
  // generate an updated nonce
  const nonce = newNonce().toString();
  const ttl = +new Date() + 300000;
  await saveSigninAttempt({ pubkey, nonce, ttl });
  return nonce;
};

const getSolanaAuth = async (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) => {
  const pubkey = req.query.pubkey;
  console.log("pubkey: ", pubkey);
  if (pubkey) {
    const nonce = await getNonce(pubkey.toString());
    res.status(200).json({ nonce });
  } else {
    res.status(400).json({ error: "No public key specified" });
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await getSolanaAuth(req, res);
}
