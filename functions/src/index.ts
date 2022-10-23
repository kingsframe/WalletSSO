import * as base58 from "bs58";
import * as util from "tweetnacl-util";
import { sign } from "tweetnacl";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { randomBytes, secretbox } from "tweetnacl";
import { z } from "zod";

type AttemptT = {
  pubkey: string;
  nonce: string;
  ttl: number;
};

admin.initializeApp();
const AUTH_DOMAIN = "example.xyz";

const saveSigninAttempt = async (attempt: AttemptT) => {
  try {
    const writeResult = await admin
      .firestore()
      .collection("signinattempts")
      .doc(attempt.pubkey)
      .set({
        pubkey: attempt.pubkey,
        nonce: attempt.nonce,
        ttl: attempt.ttl,
      });

    functions.logger.log("Document written result: ", writeResult);
  } catch (e) {
    functions.logger.error("Error adding document: ", e);
  }
  return;
};

// eslint-disable-next-line valid-jsdoc
/** FROM: https://github.com/dchest/tweetnacl-js/wiki/Examples */
const newNonce = () => randomBytes(secretbox.nonceLength);

const getNonce = async (pubkey: string) => {
  const nonce = newNonce().toString();
  const ttl = +new Date() + 300000;
  await saveSigninAttempt({ pubkey, nonce, ttl });
  return nonce;
};

const getSigninAttempts = async (pubkey: string) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("signinattempts")
      .doc(pubkey)
      .get();
    functions.logger.log("signing attemps retrieved ", snapshot.data());
    return snapshot.data();
  } catch (e) {
    functions.logger.error("Error adding document: ", e);
  }
  return;
};

const verifyTTL = async (pubkey: string) => {
  const signinAttempt = await getSigninAttempts(pubkey);
  if (signinAttempt?.ttl < +new Date()) {
    return false;
  }
  return true;
};

const parsePayload = (pl: string): { nonce: string; domain: string } => {
  const PAYLOAD_ERROR_MSG =
    "Incorrect message format. Cannot verify nonce or domain.";
  const nonce = pl.substring(pl.indexOf("id=") + 3);

  const msg = "Sign this message to sign into ";
  if (pl.indexOf(msg) !== 0) {
    throw new Error(PAYLOAD_ERROR_MSG);
  }
  const domain = pl.substring(msg.length, pl.indexOf("||")).trim();

  return { nonce, domain };
};

const nonceStr = (nonce: string) => `|| id=${nonce}`;
const signInMessage = (nonce: string, domain: string) =>
  "Sign this message to sign into " + domain + nonceStr(nonce);

/**
 * Function to take a query param to a Uint8Array
 * @param qp
 * @returns Uint8Array to pass to tweetnacl functions
 */
const qptua = (qp: string | string[]) =>
  Uint8Array.from(
    qp
      .toString()
      .split(",")
      .map((e) => parseInt(e))
  );

const getauthchallengeQuerySchema = z.object({ pubkey: z.string() });
export const getauthchallenge = functions.https.onRequest(
  async (request, response) => {
    const sanitizedQuery = getauthchallengeQuerySchema.parse(request.query);
    const pubkey = sanitizedQuery.pubkey;
    if (pubkey) {
      const nonce = await getNonce(pubkey.toString());
      response.json({ nonce });
    } else {
      response.status(400).json({ error: "No public key specified" });
    }
  }
);

const completeauthchallengeQuerySchema = z.object({
  pubkey: z.string(),
  payload: z.string(),
  signature: z.string(),
});
export const completeauthchallenge = functions.https.onRequest(
  async (request, response) => {
    try {
      const sanitizedQuery = completeauthchallengeQuerySchema.parse(
        request.query
      );
      const { pubkey, payload, signature } = sanitizedQuery;

      //   verify the TLL
      const ttlVerified = await verifyTTL(pubkey);
      functions.logger.log("ttl verified: ", ttlVerified);
      if (!ttlVerified) throw new Error("Nonce is expired");

      // get the nonce from the database
      const signinAttempt = await getSigninAttempts(pubkey);
      const dbNonce = signinAttempt?.nonce;
      functions.logger.log("db nonce: ", dbNonce);
      if (!dbNonce) throw new Error("Public Key not in DB");

      const { nonce, domain } = parsePayload(payload);

      // verify the payload
      const constructedMessage = signInMessage(nonce, domain);
      functions.logger.log("constructed message: ", constructedMessage);

      if (domain !== AUTH_DOMAIN) {
        functions.logger.log(
          "AUTH_DOMAIN does not match domain sent from client"
        );
        functions.logger.log("domain: ", domain);
        functions.logger.log("AUTH_DOMAIN: ", AUTH_DOMAIN);
        throw new Error("AUTH_DOMAIN does not match domain sent from client");
      }

      if (constructedMessage !== payload) {
        functions.logger.log("Invalid payload");
        throw new Error("Invalid payload");
      }

      if (nonce !== dbNonce) {
        functions.logger.log("Nonce is invalid");
        throw new Error("Nonce is invalid");
      }

      const decodePayload = util.decodeUTF8(payload);
      const publicKey = base58.decode(pubkey);
      functions.logger.log("decodePayload: ", decodePayload);
      functions.logger.log("decoded publickey: ", publicKey);

      // verify that the bytes were signed witht the private key
      if (!sign.detached.verify(decodePayload, qptua(signature), publicKey)) {
        throw new Error("invalid signature");
      }

      const token = await admin.auth().createCustomToken(pubkey);
      functions.logger.log("token: ", token);
      // send the sign in state back to the client
      response.status(200).json({ token });
    } catch (err) {
      response.status(400).json({ token: undefined, message: err });
    }
  }
);
