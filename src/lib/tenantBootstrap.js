import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

const bootstrapTenantCallable = httpsCallable(functions, "bootstrapTenant");

export async function bootstrapTenant(store, acceptedTerms) {
  const result = await bootstrapTenantCallable({ store, acceptedTerms });
  return result.data;
}
