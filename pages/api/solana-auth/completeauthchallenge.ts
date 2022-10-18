// @ts-nocheck
import { initializeApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseConfig } from "../../../utils/FirebaseConfig";

type Data = {
  token?: string;
  message?: string;
};

const sanitizeRequestQuery = (
  query: Partial<{
    [key: string]: string | string[];
  }>
) => {
  const { pubkey, payload, signature } = query;
  let returnParams: {
    missingFields: boolean;
    pubkey: string;
    payload: string;
    signature: string | string[];
  } = {
    missingFields: true,
    pubkey: "",
    payload: "",
    signature: "",
  };

  if (
    pubkey === undefined ||
    payload === undefined ||
    signature === undefined
  ) {
    return returnParams;
  }

  returnParams.missingFields = false;
  returnParams.pubkey = pubkey.toString();
  returnParams.payload = payload.toString();
  returnParams.signature = signature;
  return returnParams;
};

const getTLL = async (pubkey: string) => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "localhost", 8080);
  //   const docRef = db.doc(`signinattempts/${pubkey}`);
  //   const doc = await docRef.get();
  const docRef = doc(db, "signinattempts", pubkey);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log("Document data:", docSnap.data());
    const tll = docSnap.data()?.tll;
    return tll;
  } else {
    // doc.data() will be undefined in this case
    console.log("No such document!");
  }
};

const verifyTTL = async (pubkey: string) => {
  // get the TLL from the adapter
  let ttl = await getTLL(pubkey);

  if (ttl < +new Date()) {
    return false;
  }
  return true;
};

export const completeSolanaAuth = async (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) => {
  try {
    // parse the query parameters
    const { missingFields, pubkey, payload, signature } = sanitizeRequestQuery(
      req.query
    );
    if (missingFields) {
      throw new Error("missing required fields!");
    }
    // verify the TLL
    const ttlVerified = await verifyTTL(pubkey);
    if (!ttlVerified) throw new Error("Nonce is expired");
  } catch (err: any) {
    res.status(400).json({ token: undefined, message: err.toString() });
  }
};
