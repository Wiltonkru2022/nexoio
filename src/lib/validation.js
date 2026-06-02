export const roles = {
  owner: "Dono/Admin",
  manager: "Gerente",
  cashier: "Caixa/Atendente",
};

export const roleRank = {
  owner: 3,
  manager: 2,
  cashier: 1,
};

export function canAccess(role, permission) {
  const permissions = {
    pdv: ["owner", "manager", "cashier"],
    modulos: ["owner", "manager", "cashier"],
    produtos: ["owner", "manager"],
    servicos: ["owner", "manager"],
    vendas: ["owner", "manager"],
    assistencia: ["owner", "manager"],
    estoque: ["owner", "manager"],
    clientes: ["owner", "manager", "cashier"],
    financeiro: ["owner", "manager"],
    equipe: ["owner"],
    configuracoes: ["owner"],
    relatorios: ["owner", "manager"],
    backup: ["owner"],
    integracoes: ["owner"],
    impressoes: ["owner"],
    cupons: ["owner", "manager"],
    metas: ["owner"],
    writeProducts: ["owner", "manager"],
    writeServices: ["owner", "manager"],
    writeCustomers: ["owner", "manager", "cashier"],
    writeWorkOrders: ["owner", "manager"],
    cancelOrders: ["owner", "manager"],
    cashManagement: ["owner", "manager"],
  };

  return permissions[permission]?.includes(role) || false;
}

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function emailKey(email) {
  return normalizeEmail(email).replace(/[.#$[\]/]/g, "_");
}

export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskCurrency(value) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function maskCpfCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function isValidCnpj(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calc = (length) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + Number(cnpj[index]) * weight, 0);
    const digit = sum % 11;
    return digit < 2 ? 0 : 11 - digit;
  };

  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

export function isValidDocument(value) {
  const digits = onlyDigits(value);
  if (!digits) return true;
  return digits.length <= 11 ? isValidCpf(digits) : isValidCnpj(digits);
}

export function validateRequired(fields) {
  const errors = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (!String(value || "").trim()) {
      errors[key] = "Obrigatorio";
    }
  });
  return errors;
}

export async function fetchCep(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.erro) return null;

  return {
    cep: maskCep(digits),
    street: data.logradouro || "",
    neighborhood: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}
