import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const createSubscriptionCharge = httpsCallable(functions, "createNexoSubscriptionCharge");
const checkSubscriptionCharge = httpsCallable(functions, "checkNexoSubscriptionCharge");

export async function createNexoSubscriptionCharge() {
  const result = await createSubscriptionCharge({});
  return result.data;
}

export async function checkNexoSubscriptionCharge(correlationID) {
  const result = await checkSubscriptionCharge({ correlationID });
  return result.data;
}
