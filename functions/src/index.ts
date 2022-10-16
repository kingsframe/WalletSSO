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

const saveSigninAttempt = async (attempt: AttemptT) => {
  try {
    const writeResult = await admin
      .firestore()
      .collection("signinattempts")
      .add({
        pubkey: attempt.pubkey,
        nonce: attempt.nonce,
        ttl: attempt.ttl,
      });
    functions.logger.log("Document written with ID: ", writeResult.id);
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

const sanitizeRequestQuery = (query: any) => {
  const { pubkey, payload, signature } = query;
  const returnParams: {
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

const getAuthChallengeSchema = z.object({
  query: z.object({ pubkey: z.string() }),
});

export const getauthchallenge = functions.https.onRequest(
  async (request, response) => {
    const authChallengeResult = getAuthChallengeSchema.parse(request);
    const pubkey = authChallengeResult.query.pubkey;
    if (pubkey) {
      const nonce = await getNonce(pubkey.toString());
      response.json({ nonce });
    } else {
      response.status(400).json({ error: "No public key specified" });
    }
  }
);

export const completeauthchallenge = functions.https.onRequest(
  async (request, response) => {
    try {
      // parse the query parameters
      const { missingFields, pubkey, payload, signature } =
        sanitizeRequestQuery(request.query);
      if (missingFields) {
        throw new Error("missing required fields!");
      }
      // verify the TLL
      //   const ttlVerified = await verifyTTL(pubkey);
      //   if (!ttlVerified) throw new Error("Nonce is expired");
    } catch (err) {
      response.status(400).json({ token: undefined, message: err });
    }
  }
);
