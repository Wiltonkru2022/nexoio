import assert from "node:assert/strict";
import {
  canAccess,
  isValidCnpj,
  isValidCpf,
  maskCep,
  maskCpfCnpj,
  maskCurrency,
  maskPhone,
} from "../src/lib/validation.js";
import { parseMoney } from "../src/lib/storeData.js";

assert.equal(isValidCpf("529.982.247-25"), true, "CPF valido deve passar");
assert.equal(isValidCpf("111.111.111-11"), false, "CPF repetido deve falhar");
assert.equal(isValidCnpj("11.222.333/0001-81"), true, "CNPJ valido deve passar");
assert.equal(isValidCnpj("11.111.111/1111-11"), false, "CNPJ repetido deve falhar");

assert.equal(maskPhone("67999999999"), "(67) 99999-9999");
assert.equal(maskCep("01001000"), "01001-000");
assert.equal(maskCpfCnpj("52998224725"), "529.982.247-25");
assert.equal(maskCurrency("3990"), "39,90");
assert.equal(parseMoney("1.234,56"), 1234.56);

assert.equal(canAccess("owner", "equipe"), true);
assert.equal(canAccess("manager", "financeiro"), true);
assert.equal(canAccess("cashier", "financeiro"), false);
assert.equal(canAccess("cashier", "pdv"), true);

console.log("All tests passed");
