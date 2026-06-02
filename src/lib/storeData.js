export const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const today = new Date().toISOString().slice(0, 10);

export const initialProductForm = {
  sku: "",
  name: "",
  category: "Capinha",
  brand: "",
  compatible: "",
  supplier: "",
  stock: 1,
  minStock: 3,
  price: "",
  cost: "",
  imageUrl: "",
};

export const productImageUrls = {
  "CAP-IP14-TR": "https://images.pexels.com/photos/10029867/pexels-photo-10029867.jpeg?cs=srgb&dl=pexels-zion-10029867.jpg&fm=jpg",
  "CAP-A15-SI": "https://images.pexels.com/photos/18357980/pexels-photo-18357980.jpeg?cs=srgb&dl=pexels-gentcreate-18357980.jpg&fm=jpg",
  "PEL-G84-3D": "https://images.pexels.com/photos/7742507/pexels-photo-7742507.jpeg?cs=srgb&dl=pexels-rann-vijay-677553-7742507.jpg&fm=jpg",
  "CAR-TC-20W": "https://unsplash.com/photos/f0EpYkZ-cp4/download?force=true",
  "CAB-USBC": "https://images.pexels.com/photos/3921713/pexels-photo-3921713.jpeg?cs=srgb&dl=pexels-readymade-3921713.jpg&fm=jpg",
  "FON-BT-PRO": "https://images.pexels.com/photos/33797659/pexels-photo-33797659.jpeg?cs=srgb&dl=pexels-zeleboba-33797659.jpg&fm=jpg",
};

export const initialServiceForm = {
  name: "",
  duration: "15 min",
  price: "",
  cost: "",
  sector: "Balcão",
};

export const initialCustomerForm = {
  name: "",
  phone: "",
  document: "",
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  device: "",
  note: "",
};

export const initialStoreForm = {
  name: "",
  document: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  logoUrl: "",
  plan: "starter",
  subscriptionStatus: "active",
  subscriptionProvider: "mercado_pago",
  subscriptionAmount: 1,
  subscriptionDueDate: "",
  lastPaymentAt: null,
  suppliers: [],
  financialAccounts: [],
};

export const initialInviteForm = {
  name: "",
  email: "",
  role: "cashier",
};

export const initialCouponForm = {
  code: "",
  type: "fixed",
  value: "",
  active: true,
  expiresAt: "",
};

export const initialOsForm = {
  customer: "",
  phone: "",
  device: "",
  imei: "",
  password: "",
  issue: "",
  technicianUid: "",
  technicianName: "",
  priority: "Normal",
  estimate: "",
  services: [],
  parts: [],
  status: "Orcamento",
  dueDate: today,
};

export const seedProducts = [
  {
    sku: "CAP-IP14-TR",
    name: "Capinha anti-impacto transparente",
    category: "Capinha",
    brand: "Nexo Case",
    compatible: "iPhone 13 / 14",
    supplier: "Distribuidora Centro",
    stock: 18,
    minStock: 5,
    price: 39.9,
    cost: 16,
    imageUrl: productImageUrls["CAP-IP14-TR"],
  },
  {
    sku: "CAP-A15-SI",
    name: "Capinha silicone premium",
    category: "Capinha",
    brand: "Soft Touch",
    compatible: "Samsung A15 / A25",
    supplier: "Mobile Parts",
    stock: 12,
    minStock: 4,
    price: 49.9,
    cost: 21,
    imageUrl: productImageUrls["CAP-A15-SI"],
  },
  {
    sku: "PEL-G84-3D",
    name: "Pelicula 3D full glue",
    category: "Película",
    brand: "Shield Pro",
    compatible: "Motorola G84",
    supplier: "Mobile Parts",
    stock: 9,
    minStock: 6,
    price: 29.9,
    cost: 8,
    imageUrl: productImageUrls["PEL-G84-3D"],
  },
  {
    sku: "CAR-TC-20W",
    name: "Carregador Turbo USB-C 20W",
    category: "Acessório",
    brand: "VoltMax",
    compatible: "Universal",
    supplier: "Eletronic Mix",
    stock: 7,
    minStock: 3,
    price: 79.9,
    cost: 36,
    imageUrl: productImageUrls["CAR-TC-20W"],
  },
  {
    sku: "CAB-USBC",
    name: "Cabo USB-C reforçado",
    category: "Cabo",
    brand: "Nexo Cable",
    compatible: "Universal",
    supplier: "Eletronic Mix",
    stock: 15,
    minStock: 5,
    price: 29.9,
    cost: 10,
    imageUrl: productImageUrls["CAB-USBC"],
  },
  {
    sku: "FON-BT-PRO",
    name: "Fone Bluetooth Pro",
    category: "Fone",
    brand: "Sound Pro",
    compatible: "Universal",
    supplier: "Mobile Parts",
    stock: 6,
    minStock: 3,
    price: 89.9,
    cost: 42,
    imageUrl: productImageUrls["FON-BT-PRO"],
  },
];

export const seedServices = [
  { name: "Aplicação de película", duration: "15 min", price: 20, cost: 0, sector: "Balcão" },
  { name: "Troca de película com limpeza", duration: "25 min", price: 35, cost: 3, sector: "Técnico" },
  { name: "Limpeza de conector", duration: "30 min", price: 45, cost: 2, sector: "Técnico" },
  { name: "Diagnóstico técnico", duration: "40 min", price: 60, cost: 0, sector: "Técnico" },
];

export function parseMoney(value) {
  const normalized = String(value || "").replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

export function getCreatedDate(item) {
  if (item.createdAt?.toDate) {
    return item.createdAt.toDate().toISOString().slice(0, 10);
  }

  return item.date || item.scheduledFor || "";
}
