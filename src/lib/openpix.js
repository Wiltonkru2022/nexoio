import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const createCharge = httpsCallable(functions, "createOpenPixCharge");
const checkCharge = httpsCallable(functions, "checkOpenPixCharge");

export async function createOpenPixCharge(payload) {
  const result = await createCharge(payload);
  return result.data;
}

export async function checkOpenPixCharge(correlationID) {
  const result = await checkCharge({ correlationID });
  return result.data;
}
