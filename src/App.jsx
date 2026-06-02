import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { AppShell, BrandLogo, ToastStack } from "./components/ui";
import {
  formatMoney,
  getCreatedDate,
  initialCustomerForm,
  initialCouponForm,
  initialInviteForm,
  initialOsForm,
  initialProductForm,
  initialServiceForm,
  initialStoreForm,
  parseMoney,
  productImageUrls,
  seedProducts,
  seedServices,
  today,
} from "./lib/storeData";
import {
  canAccess,
  emailKey,
  fetchCep,
  isValidDocument,
  normalizeEmail,
  onlyDigits,
} from "./lib/validation";
import { AssistenciaPage } from "./pages/AssistenciaPage";
import { ClientesPage } from "./pages/ClientesPage";
import { EquipePage } from "./pages/EquipePage";
import { EstoquePage } from "./pages/EstoquePage";
import { FinanceiroPage } from "./pages/FinanceiroPage";
import { ProdutosPage } from "./pages/ProdutosPage";
import { BackupPage, CuponsPage, ImpressoesPage, IntegracoesPage, MetasPage } from "./pages/ExtraModulesPage";
import { LoginPage } from "./pages/LoginPage";
import { PdvPage } from "./pages/PdvPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { ModulosPage } from "./pages/ModulosPage";
import { VendasPage } from "./pages/VendasPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { bootstrapTenant } from "./lib/tenantBootstrap";

const FIREBASE_DEFAULT_HOSTS = new Set([
  "nexoio-4b7ae.web.app",
  "nexoio-4b7ae.firebaseapp.com",
]);
const MARKETING_HOSTS = new Set(["nexoio.com.br", "www.nexoio.com.br"]);
const MARKETING_ORIGIN = "https://nexoio.com.br";
const APP_ORIGIN = "https://app.nexoio.com.br";
const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro"]);

function canonicalRedirectFor(user, loading) {
  if (typeof window === "undefined") return "";
  const { hostname, pathname, search, hash } = window.location;

  if (FIREBASE_DEFAULT_HOSTS.has(hostname)) {
    return `${MARKETING_ORIGIN}/`;
  }

  if (hostname === "app.nexoio.com.br") {
    if (pathname === "/login") return `${MARKETING_ORIGIN}/login${search}${hash}`;
    if (pathname === "/cadastro") return `${MARKETING_ORIGIN}/cadastro${search}${hash}`;
    if (pathname !== "/painel") return `${APP_ORIGIN}/painel${search}${hash}`;
    if (!loading && !user) return `${MARKETING_ORIGIN}/login${search}${hash}`;
    return "";
  }

  if (MARKETING_HOSTS.has(hostname)) {
    if (pathname === "/painel") return `${APP_ORIGIN}/painel${search}${hash}`;
    if (!PUBLIC_PATHS.has(pathname)) return `${MARKETING_ORIGIN}/${search}${hash}`;
    if (!loading && user) return `${APP_ORIGIN}/painel${search}${hash}`;
  }

  return "";
}

function mensagemErro(error, fallback = "Não foi possível concluir a operação.") {
  const code = error?.code || "";
  const message = String(error?.message || "");
  const map = {
    "auth/email-already-in-use": "Este e-mail já está sendo usado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "permission-denied": "Você não tem permissão para acessar estes dados.",
  };

  if (map[code]) return map[code];
  if (/missing or insufficient permissions/i.test(message)) return "Você não tem permissão para acessar estes dados.";
  if (/network/i.test(message)) return "Falha de conexão. Verifique sua internet e tente novamente.";
  return fallback;
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [bootingTenant, setBootingTenant] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signupStoreForm, setSignupStoreForm] = useState(initialStoreForm);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [cashSessions, setCashSessions] = useState([]);
  const [cashMovements, setCashMovements] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [activeTab, setActiveTab] = useState("modulos");
  const [saving, setSaving] = useState(false);
  const [productFilter, setProductFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("Todos");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState("Pix");
  const [payments, setPayments] = useState([]);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [creditSurplus, setCreditSurplus] = useState(false);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [osForm, setOsForm] = useState(initialOsForm);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [couponCode, setCouponCode] = useState("");
  const [lastReceipt, setLastReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [dataReady, setDataReady] = useState({ products: false, services: false });

  const loaded = useRef({ products: false, services: false });
  const seededTenants = useRef(new Set());
  const imagedTenants = useRef(new Set());
  const lastCustomerCep = useRef("");
  const lastStoreCep = useRef("");
  const lastSignupCep = useRef("");
  const signupStoreRef = useRef(initialStoreForm);
  const canonicalRedirect = useMemo(() => canonicalRedirectFor(user, loading), [user, loading]);

  useEffect(() => {
    if (canonicalRedirect) {
      window.location.replace(canonicalRedirect);
    }
  }, [canonicalRedirect]);

  function addToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }

  function assertPermission(permission) {
    if (canAccess(profile?.role, permission)) {
      return true;
    }

    addToast("Seu nível de acesso não permite esta ação.", "error");
    return false;
  }

  async function logAudit(action, details = {}) {
    if (!tenantId || !user?.uid) return;
    await addDoc(collection(db, "tenants", tenantId, "auditLogs"), {
      tenant_id: tenantId,
      action,
      details,
      operatorUid: user.uid,
      operatorEmail: user.email || "",
      createdAt: serverTimestamp(),
    });
  }

  async function initializeTenant(currentUser) {
    setBootingTenant(true);
    const profileRef = doc(db, "userProfiles", currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const nextProfile = { id: profileSnap.id, ...profileSnap.data() };
      setProfile(nextProfile);
      setTenantId(nextProfile.tenant_id);
      setBootingTenant(false);
      return;
    }

    const result = await bootstrapTenant(signupStoreRef.current || initialStoreForm, acceptedTerms);
    setProfile(result.profile);
    setTenantId(result.tenantId);
    setBootingTenant(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        initializeTenant(currentUser).catch((error) => {
          setErro(mensagemErro(error, "Não foi possível carregar a loja."));
          setBootingTenant(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!tenantId) {
      return undefined;
    }

    const tenantRef = doc(db, "tenants", tenantId);
    const unsubTenant = onSnapshot(tenantRef, (snapshot) => {
      const data = snapshot.data() || {};
      setTenant({ id: snapshot.id, ...data });
      setStoreForm({
        ...initialStoreForm,
        ...data,
      });
    });
    const basePath = ["tenants", tenantId];
    const unsubProducts = onSnapshot(query(collection(db, ...basePath, "products"), orderBy("name")), (snapshot) => {
      loaded.current.products = true;
      setDataReady((current) => ({ ...current, products: true }));
      setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubServices = onSnapshot(query(collection(db, ...basePath, "services"), orderBy("name")), (snapshot) => {
      loaded.current.services = true;
      setDataReady((current) => ({ ...current, services: true }));
      setServices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubOrders = onSnapshot(query(collection(db, ...basePath, "orders"), orderBy("createdAt", "desc")), (snapshot) => {
      setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubCustomers = onSnapshot(query(collection(db, ...basePath, "customers"), orderBy("name")), (snapshot) => {
      setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubWorkOrders = onSnapshot(query(collection(db, ...basePath, "workOrders"), orderBy("createdAt", "desc")), (snapshot) => {
      setWorkOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubMembers = onSnapshot(query(collection(db, ...basePath, "members"), orderBy("email")), (snapshot) => {
      setMembers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubInvites = onSnapshot(query(collection(db, ...basePath, "invites"), orderBy("email")), (snapshot) => {
      setInvites(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubCashSessions = onSnapshot(query(collection(db, ...basePath, "cashSessions"), orderBy("openedAt", "desc")), (snapshot) => {
      setCashSessions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubCashMovements = onSnapshot(query(collection(db, ...basePath, "cashMovements"), orderBy("createdAt", "desc")), (snapshot) => {
      setCashMovements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubStockMovements = onSnapshot(query(collection(db, ...basePath, "stockMovements"), orderBy("createdAt", "desc")), (snapshot) => {
      setStockMovements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    const unsubCoupons = onSnapshot(query(collection(db, ...basePath, "coupons"), orderBy("code")), (snapshot) => {
      setCoupons(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });

    return () => {
      unsubTenant();
      unsubProducts();
      unsubServices();
      unsubOrders();
      unsubCustomers();
      unsubWorkOrders();
      unsubMembers();
      unsubInvites();
      unsubCashSessions();
      unsubCashMovements();
      unsubStockMovements();
      unsubCoupons();
    };
  }, [tenantId]);

  useEffect(() => {
    const readyToSeed = dataReady.products && dataReady.services;
    if (!tenantId || !readyToSeed || seededTenants.current.has(tenantId)) {
      return;
    }

    if (products.length || services.length) {
      seededTenants.current.add(tenantId);
      return;
    }

    seededTenants.current.add(tenantId);
    Promise.all(seedProducts.map((product) => addDoc(collection(db, "tenants", tenantId, "products"), {
      ...product,
      tenant_id: tenantId,
      createdAt: serverTimestamp(),
    }))).catch((error) => addToast(mensagemErro(error, "Não foi possível criar os produtos iniciais."), "error"));
    Promise.all(seedServices.map((service) => addDoc(collection(db, "tenants", tenantId, "services"), {
      ...service,
      tenant_id: tenantId,
      createdAt: serverTimestamp(),
    }))).catch((error) => addToast(mensagemErro(error, "Não foi possível criar os serviços iniciais."), "error"));
  }, [dataReady.products, dataReady.services, products.length, services.length, tenantId]);

  useEffect(() => {
    if (!tenantId || !products.length || imagedTenants.current.has(tenantId)) return;
    const productsToUpdate = products.filter((product) => !product.imageUrl && productImageUrls[product.sku]);
    if (!productsToUpdate.length) {
      imagedTenants.current.add(tenantId);
      return;
    }

    imagedTenants.current.add(tenantId);
    Promise.all(productsToUpdate.map((product) => updateDoc(doc(db, "tenants", tenantId, "products", product.id), {
      imageUrl: productImageUrls[product.sku],
      updatedAt: serverTimestamp(),
    }))).catch((error) => addToast(mensagemErro(error, "Não foi possível adicionar imagens aos produtos."), "error"));
  }, [products, tenantId]);

  useEffect(() => {
    const cep = onlyDigits(customerForm.cep);
    if (cep.length !== 8 || cep === lastCustomerCep.current) return;
    lastCustomerCep.current = cep;
    fetchCep(cep).then((address) => {
      if (address) {
        setCustomerForm((current) => ({ ...current, ...address }));
      }
    }).catch(() => addToast("Não foi possível consultar o CEP do cliente.", "error"));
  }, [customerForm.cep]);

  useEffect(() => {
    const cep = onlyDigits(storeForm.cep);
    if (cep.length !== 8 || cep === lastStoreCep.current) return;
    lastStoreCep.current = cep;
    fetchCep(cep).then((address) => {
      if (address) {
        setStoreForm((current) => ({ ...current, ...address }));
      }
    }).catch(() => addToast("Não foi possível consultar o CEP da loja.", "error"));
  }, [storeForm.cep]);

  useEffect(() => {
    signupStoreRef.current = signupStoreForm;
  }, [signupStoreForm]);

  useEffect(() => {
    if (authMode !== "cadastro") return;
    const cep = onlyDigits(signupStoreForm.cep);
    if (cep.length !== 8 || cep === lastSignupCep.current) return;
    lastSignupCep.current = cep;
    fetchCep(cep).then((address) => {
      if (address) {
        setSignupStoreForm((current) => ({ ...current, ...address }));
      }
    }).catch(() => setErro("Não foi possível consultar o CEP da loja."));
  }, [authMode, signupStoreForm.cep]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const discountValue = parseMoney(discount);
    const total = Math.max(subtotal - discountValue, 0);
    const profit = Math.max(total - cost, 0);
    const received = parseMoney(receivedAmount);
    const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const amountPaid = received + paid;
    const remaining = Math.max(total - amountPaid, 0);
    const change = Math.max(amountPaid - total, 0);
    return { subtotal, cost, discountValue, total, profit, received, paid, amountPaid, remaining, change };
  }, [cart, discount, payments, receivedAmount]);

  const openCashSession = useMemo(() => {
    return cashSessions.find((session) => session.status === "open") || null;
  }, [cashSessions]);

  const metrics = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== "Cancelado");
    const todayOrders = validOrders.filter((order) => getCreatedDate(order) === today);
    const revenueToday = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const revenueTotal = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const profitTotal = validOrders.reduce((sum, order) => sum + Number(order.profit || 0), 0);
    const lowStock = products.filter((product) => Number(product.stock || 0) <= Number(product.minStock || 0));
    const openService = orders.filter((order) => order.status === "Em atendimento").length;
    const openOs = workOrders.filter((item) => !["Entregue", "Cancelada"].includes(item.status)).length;
    const averageTicket = validOrders.length ? revenueTotal / validOrders.length : 0;
    const itemsSoldToday = todayOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
    }, 0);
    return {
      revenueToday,
      revenueTotal,
      profitTotal,
      lowStock,
      openService,
      openOs,
      averageTicket,
      itemsSoldToday,
      ordersToday: todayOrders,
    };
  }, [orders, products, workOrders]);

  const cashSummary = useMemo(() => {
    if (!openCashSession) {
      return {
        openingAmount: 0,
        cashSales: 0,
        pixSales: 0,
        cardSales: 0,
        otherSales: 0,
        supplies: 0,
        withdrawals: 0,
        changePaid: 0,
        expectedCash: 0,
        movements: [],
      };
    }

    const sessionOrders = orders.filter((order) => order.status !== "Cancelado" && order.cashSessionId === openCashSession.id);
    const sessionMovements = cashMovements.filter((movement) => movement.cashSessionId === openCashSession.id);
    const totals = {
      openingAmount: Number(openCashSession.openingAmount || 0),
      cashSales: 0,
      pixSales: 0,
      cardSales: 0,
      otherSales: 0,
      supplies: sessionMovements.filter((item) => item.type === "supply").reduce((sum, item) => sum + Number(item.amount || 0), 0),
      withdrawals: sessionMovements.filter((item) => item.type === "withdrawal").reduce((sum, item) => sum + Number(item.amount || 0), 0),
      changePaid: 0,
      movements: sessionMovements,
    };

    sessionOrders.forEach((order) => {
      const orderPayments = order.payments?.length ? order.payments : [{ method: order.payment, amount: order.total }];
      const hasCash = orderPayments.some((item) => item.method === "Dinheiro");
      orderPayments.forEach((item) => {
        const amount = Number(item.amount || 0);
        if (item.method === "Dinheiro") totals.cashSales += amount;
        else if (item.method === "Pix") totals.pixSales += amount;
        else if (["Cartao credito", "Cartao debito"].includes(item.method)) totals.cardSales += amount;
        else totals.otherSales += amount;
      });
      if (hasCash) totals.changePaid += Number(order.change || 0);
    });

    totals.expectedCash = totals.openingAmount + totals.cashSales + totals.supplies - totals.withdrawals - totals.changePaid;
    return totals;
  }, [cashMovements, openCashSession, orders]);

  const notifications = useMemo(() => {
    const next = [];
    if (!openCashSession) {
      next.push({
        id: "cash-closed",
        title: "Caixa fechado",
        description: "Abra o caixa antes de iniciar as vendas do turno.",
        tab: "pdv",
      });
    }
    if (metrics.lowStock.length) {
      next.push({
        id: "low-stock",
        title: `${metrics.lowStock.length} item(ns) com estoque baixo`,
        description: metrics.lowStock.slice(0, 3).map((item) => item.name).join(", "),
        tab: "estoque",
      });
    }
    if (metrics.openOs) {
      next.push({
        id: "open-os",
        title: `${metrics.openOs} OS em aberto`,
        description: "Existem atendimentos técnicos aguardando evolução.",
        tab: "assistencia",
      });
    }
    const pendingInvites = invites.filter((invite) => invite.status === "pending").length;
    if (pendingInvites) {
      next.push({
        id: "pending-invites",
        title: `${pendingInvites} convite(s) pendente(s)`,
        description: "Revise convites de usuários aguardando acesso.",
        tab: "equipe",
      });
    }
    const expiringCoupons = coupons.filter((coupon) => coupon.active !== false && coupon.expiresAt && coupon.expiresAt >= today).length;
    if (expiringCoupons) {
      next.push({
        id: "active-coupons",
        title: `${expiringCoupons} cupom(ns) ativo(s)`,
        description: "Cupons configurados podem impactar o fechamento.",
        tab: "financeiro",
      });
    }
    return next;
  }, [coupons, invites, metrics.lowStock, metrics.openOs, openCashSession]);

  const filteredProducts = useMemo(() => {
    const search = productFilter.toLowerCase().trim();
    if (!search) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.category, product.brand, product.compatible]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search)),
    );
  }, [productFilter, products]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "Todos") return orders;
    return orders.filter((order) => order.status === orderFilter);
  }, [orderFilter, orders]);

  const globalResults = useMemo(() => {
    const search = globalSearch.toLowerCase().trim();
    if (!search) return [];
    const productResults = products
      .filter((product) => [product.name, product.sku, product.category, product.compatible].filter(Boolean).some((field) => String(field).toLowerCase().includes(search)))
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        type: "product",
        label: "Produto",
        title: product.name,
        description: `${product.sku || "Sem SKU"} - ${formatMoney(product.price)} - ${product.stock || 0} un`,
        item: product,
      }));
    const serviceResults = services
      .filter((service) => [service.name, service.sector, service.duration].filter(Boolean).some((field) => String(field).toLowerCase().includes(search)))
      .slice(0, 5)
      .map((service) => ({
        id: service.id,
        type: "service",
        label: "Servico",
        title: service.name,
        description: `${service.duration || "Sem duração"} - ${formatMoney(service.price)}`,
        item: service,
      }));
    const customerResults = customers
      .filter((customer) => [customer.name, customer.phone, customer.document, customer.device].filter(Boolean).some((field) => String(field).toLowerCase().includes(search)))
      .slice(0, 5)
      .map((customer) => ({
        id: customer.id,
        type: "customer",
        label: "Cliente",
        title: customer.name,
        description: `${customer.phone || "Sem telefone"} - ${customer.device || "Sem aparelho"}`,
        item: customer,
      }));
    return [...productResults, ...serviceResults, ...customerResults].slice(0, 10);
  }, [customers, globalSearch, products, services]);

  function handleGlobalResultClick(result) {
    if (result.type === "product") {
      addProductToCart(result.item);
      setActiveTab("pdv");
    }
    if (result.type === "service") {
      addServiceToCart(result.item);
      setActiveTab("pdv");
    }
    if (result.type === "customer") {
      setCustomerForm((current) => ({ ...current, ...result.item }));
      setActiveTab("clientes");
    }
    setGlobalSearch("");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        const nextErrors = {};
        if (!signupStoreForm.name.trim()) nextErrors.signupStoreName = "Informe o nome da loja.";
        if (signupStoreForm.document && !isValidDocument(signupStoreForm.document)) nextErrors.signupStoreDocument = "CPF/CNPJ inválido.";
        if (signupStoreForm.cep && onlyDigits(signupStoreForm.cep).length !== 8) nextErrors.signupStoreCep = "CEP inválido.";
        if (!acceptedTerms) nextErrors.acceptedTerms = "Aceite os Termos de Uso e a Política de Privacidade.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        signupStoreRef.current = signupStoreForm;
        await createUserWithEmailAndPassword(auth, email, senha);
        setSucesso("Conta criada com sucesso.");
      }
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível entrar ou criar a conta."));
    }
  }

  function validateCustomerForm(requireName = false) {
    const nextErrors = {};
    if (requireName && !customerForm.name.trim()) nextErrors.customerName = "Informe o cliente.";
    if (customerForm.document && !isValidDocument(customerForm.document)) nextErrors.customerDocument = "CPF/CNPJ inválido.";
    if (customerForm.cep && onlyDigits(customerForm.cep).length !== 8) nextErrors.customerCep = "CEP inválido.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateProductForm() {
    const nextErrors = {};
    if (!productForm.name.trim()) nextErrors.productName = "Informe o produto.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateServiceForm() {
    const nextErrors = {};
    if (!serviceForm.name.trim()) nextErrors.serviceName = "Informe o serviço.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function validateOsForm() {
    const nextErrors = {};
    if (!osForm.customer.trim()) nextErrors.osCustomer = "Informe o cliente.";
    if (!osForm.device.trim()) nextErrors.osDevice = "Informe o aparelho.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function addProductToCart(product) {
    if (!assertPermission("pdv")) return;
    if (Number(product.stock || 0) <= 0) {
      addToast("Produto sem estoque.", "error");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id && item.kind === "product");
      if (existing) {
        return current.map((item) => item.id === product.id && item.kind === "product" ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, {
        id: product.id,
        kind: "product",
        name: product.name,
        detail: product.compatible,
        sku: product.sku,
        price: Number(product.price || 0),
        cost: Number(product.cost || 0),
        quantity: 1,
      }];
    });
  }

  function addServiceToCart(service) {
    if (!assertPermission("pdv")) return;
    setCart((current) => [...current, {
      id: service.id,
      kind: "service",
      name: service.name,
      detail: service.duration,
      price: Number(service.price || 0),
      cost: Number(service.cost || 0),
      quantity: 1,
    }]);
  }

  function addVoucherToCart(voucher) {
    if (!assertPermission("pdv")) return;
    setCart((current) => [...current, {
      id: `voucher-${Date.now()}`,
      kind: "service",
      name: voucher.name || "Vale/Crédito",
      detail: "Crédito pré-pago",
      sku: "VALE",
      price: Number(voucher.amount || 0),
      cost: 0,
      quantity: 1,
    }]);
  }

  function updateCartQuantity(index, delta) {
    setCart((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item).filter((item) => item.quantity > 0));
  }

  function clearCart() {
    setCart([]);
    setDiscount("");
    setReceivedAmount("");
    setPayments([]);
    setCreditSurplus(false);
    setCouponCode("");
  }

  async function openCashRegister(initialAmount = 0) {
    if (!assertPermission("pdv")) return;
    if (openCashSession) {
      addToast("Ja existe um caixa aberto.");
      return;
    }
    await addDoc(collection(db, "tenants", tenantId, "cashSessions"), {
      tenant_id: tenantId,
      code: "Caixa 01",
      operatorUid: user.uid,
      operatorEmail: user.email,
      status: "open",
      openingAmount: Number(initialAmount || 0),
      openedAt: serverTimestamp(),
      date: today,
    });
    addToast("Caixa aberto.");
  }

  async function closeCashRegister(closePayload = {}) {
    if (!assertPermission("cashManagement")) return false;
    if (!openCashSession) {
      addToast("Nenhum caixa aberto.", "error");
      return false;
    }
    const countedAmount = Number(closePayload.countedAmount || 0);
    const expectedAmount = Number(closePayload.expectedAmount ?? cashSummary.expectedCash ?? 0);
    await updateDoc(doc(db, "tenants", tenantId, "cashSessions", openCashSession.id), {
      status: "closed",
      closedAt: serverTimestamp(),
      closingAmount: countedAmount,
      expectedAmount,
      difference: countedAmount - expectedAmount,
      closeNote: closePayload.note || "",
      closeSummary: closePayload.summary || cashSummary,
    });
    await logAudit("cash.close", { cashSessionId: openCashSession.id, countedAmount, expectedAmount, difference: countedAmount - expectedAmount });
    addToast("Caixa fechado.");
    return true;
  }

  async function addCashMovement(type, amount, note = "") {
    if (!assertPermission("cashManagement")) return false;
    if (!openCashSession) {
      addToast("Abra o caixa antes de registrar movimentacoes.", "error");
      return false;
    }
    const payload = {
      tenant_id: tenantId,
      cashSessionId: openCashSession.id,
      type,
      amount: Number(amount || 0),
      note,
      createdBy: user.uid,
      operatorEmail: user.email,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "tenants", tenantId, "cashMovements"), payload);
    await logAudit(`cash.${type}`, { amount, note, cashSessionId: openCashSession.id });
    addToast(type === "supply" ? "Suprimento registrado." : "Sangria registrada.");
    return payload;
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const coupon = coupons.find((item) => item.code === code && item.active !== false);
    if (!coupon) {
      addToast("Cupom inválido ou inativo.", "error");
      return;
    }
    if (coupon.expiresAt && coupon.expiresAt < today) {
      addToast("Cupom expirado.", "error");
      return;
    }
    const value = coupon.type === "percent"
      ? cartSummary.subtotal * (Number(coupon.value || 0) / 100)
      : Number(coupon.value || 0);
    setDiscount(value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    addToast("Cupom aplicado.");
  }

  async function handleCouponSubmit(event) {
    event.preventDefault();
    if (!assertPermission("financeiro")) return;
    const code = couponForm.code.trim().toUpperCase();
    if (!code) {
      addToast("Informe o codigo do cupom.", "error");
      return;
    }
    setSaving(true);
    await setDoc(doc(db, "tenants", tenantId, "coupons", code), {
      ...couponForm,
      code,
      value: parseMoney(couponForm.value),
      tenant_id: tenantId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setCouponForm(initialCouponForm);
    setSaving(false);
    addToast("Cupom salvo.");
  }

  async function updateMemberRole(memberId, role) {
    if (!assertPermission("equipe")) return;
    await setDoc(doc(db, "tenants", tenantId, "members", memberId), { role, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(doc(db, "userProfiles", memberId), { role, updatedAt: serverTimestamp() }, { merge: true });
    addToast("Cargo atualizado.");
  }

  async function updateMemberStatus(memberId, status) {
    if (!assertPermission("equipe")) return;
    await setDoc(doc(db, "tenants", tenantId, "members", memberId), { status, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(doc(db, "userProfiles", memberId), { status, updatedAt: serverTimestamp() }, { merge: true });
    addToast(status === "blocked" ? "Usuario bloqueado." : "Usuario ativado.");
  }

  async function saveCustomerFromSale(total = 0, sourceForm = customerForm) {
    if (!sourceForm.name.trim()) return "";
    const existing = customers.find((customer) => customer.phone && sourceForm.phone && onlyDigits(customer.phone) === onlyDigits(sourceForm.phone));
    const payload = {
      ...sourceForm,
      name: sourceForm.name.trim(),
      phone: sourceForm.phone.trim(),
      tenant_id: tenantId,
      lastSaleAt: serverTimestamp(),
      totalSpent: Number(existing?.totalSpent || 0) + total,
      updatedAt: serverTimestamp(),
    };
    if (existing) {
      await setDoc(doc(db, "tenants", tenantId, "customers", existing.id), payload, { merge: true });
      return existing.id;
    }
    const newCustomer = await addDoc(collection(db, "tenants", tenantId, "customers"), { ...payload, createdAt: serverTimestamp() });
    return newCustomer.id;
  }

  async function finishSale(status = "Finalizado") {
    if (!assertPermission("pdv")) return;
    setErrors({});
    if (!cart.length) {
      addToast("Adicione produtos ou serviços ao carrinho.", "error");
      return;
    }
    if (!validateCustomerForm(false)) return;
    if (cartSummary.remaining > 0) {
      addToast(`Falta receber ${formatMoney(cartSummary.remaining)} para finalizar.`, "error");
      return;
    }
    if (payments.some((item) => item.method === "Pix" && item.provider === "OpenPix" && item.status !== "Confirmado")) {
      addToast("Confirme o pagamento Pix OpenPix antes de finalizar.", "error");
      return;
    }
    if (creditSurplus && cartSummary.change > 0 && !customerForm.name.trim()) {
      addToast("Informe o cliente para gerar credito.", "error");
      return;
    }
    setSaving(true);
    const customerId = await saveCustomerFromSale(cartSummary.total);
    const nextSaleNumber = orders.reduce((max, order, index) => {
      const number = Number(order.orderNumber || 0);
      return Math.max(max, number, index + 1);
    }, 0) + 1;
    await addDoc(collection(db, "tenants", tenantId, "orders"), {
      tenant_id: tenantId,
      orderNumber: nextSaleNumber,
      code: `Venda #${nextSaleNumber}`,
      customerId,
      customer: customerForm.name || "Cliente balcao",
      phone: customerForm.phone,
      customerDocument: customerForm.document,
      device: customerForm.device,
      items: cart,
      payment,
      status,
      subtotal: cartSummary.subtotal,
      discount: cartSummary.discountValue,
      total: cartSummary.total,
      cost: cartSummary.cost,
      profit: cartSummary.profit,
      date: today,
      createdBy: user.uid,
      cashSessionId: openCashSession?.id || "",
      received: cartSummary.received,
      payments: payments.length ? payments : [{ method: payment, amount: cartSummary.amountPaid }],
      paymentProofs: payments.filter((item) => item.provider || item.transactionID || item.correlationID).map((item) => ({
        method: item.method,
        provider: item.provider || "",
        status: item.status || "",
        correlationID: item.correlationID || "",
        transactionID: item.transactionID || "",
        paidAt: item.paidAt || "",
      })),
      change: cartSummary.change,
      creditGenerated: creditSurplus ? cartSummary.change : 0,
      createdAt: serverTimestamp(),
    });
    const receipt = {
      orderNumber: nextSaleNumber,
      code: `Venda #${nextSaleNumber}`,
      tenant: tenant?.name || "Nexo.io",
      customer: customerForm.name || "Cliente balcao",
      phone: customerForm.phone,
      customerDocument: customerForm.document,
      items: cart,
      subtotal: cartSummary.subtotal,
      discount: cartSummary.discountValue,
      total: cartSummary.total,
      payment,
      received: cartSummary.received,
      payments: payments.length ? payments : [{ method: payment, amount: cartSummary.amountPaid }],
      paymentProofs: payments.filter((item) => item.provider || item.transactionID || item.correlationID),
      change: cartSummary.change,
      creditGenerated: creditSurplus ? cartSummary.change : 0,
      date: new Date().toLocaleString("pt-BR"),
    };
    if (creditSurplus && customerId) {
      const existing = customers.find((customer) => customer.id === customerId);
      await setDoc(doc(db, "tenants", tenantId, "customers", customerId), {
        credit: Number(existing?.credit || 0) + cartSummary.change,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    setLastReceipt(receipt);
    await Promise.all(cart.filter((item) => item.kind === "product").map((item) => {
      const product = products.find((current) => current.id === item.id);
      if (!product) return Promise.resolve();
      const previousStock = Number(product.stock || 0);
      const nextStock = Math.max(previousStock - Number(item.quantity || 0), 0);
      return Promise.all([
        updateDoc(doc(db, "tenants", tenantId, "products", product.id), {
          stock: nextStock,
          updatedAt: serverTimestamp(),
        }),
        addDoc(collection(db, "tenants", tenantId, "stockMovements"), {
          tenant_id: tenantId,
          productId: product.id,
          productName: product.name,
          type: "sale",
          quantity: -Number(item.quantity || 0),
          previousStock,
          nextStock,
          cost: Number(product.cost || 0),
          source: "Venda PDV",
          operatorUid: user.uid,
          createdAt: serverTimestamp(),
        }),
      ]);
    }));
    setCart([]);
    setDiscount("");
    setReceivedAmount("");
    setPayments([]);
    setCreditSurplus(false);
    setPayment("Pix");
    setCustomerForm(initialCustomerForm);
    setSaving(false);
    addToast("Venda registrada com sucesso.");
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    if (!assertPermission("writeProducts")) return false;
    setErrors({});
    if (!validateProductForm()) return false;
    setSaving(true);
    const payload = {
      ...productForm,
      tenant_id: tenantId,
      stock: Number(productForm.stock || 0),
      minStock: Number(productForm.minStock || 0),
      price: parseMoney(productForm.price),
      cost: parseMoney(productForm.cost),
      updatedAt: serverTimestamp(),
    };
    if (productForm.id) {
      await setDoc(doc(db, "tenants", tenantId, "products", productForm.id), payload, { merge: true });
    } else {
      await addDoc(collection(db, "tenants", tenantId, "products"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    setProductForm(initialProductForm);
    setSaving(false);
    addToast(productForm.id ? "Produto atualizado." : "Produto cadastrado.");
    return true;
  }

  async function handleServiceSubmit(event) {
    event.preventDefault();
    if (!assertPermission("writeServices")) return false;
    setErrors({});
    if (!validateServiceForm()) return false;
    setSaving(true);
    const payload = {
      ...serviceForm,
      tenant_id: tenantId,
      price: parseMoney(serviceForm.price),
      cost: parseMoney(serviceForm.cost),
      updatedAt: serverTimestamp(),
    };
    if (serviceForm.id) {
      await setDoc(doc(db, "tenants", tenantId, "services", serviceForm.id), payload, { merge: true });
    } else {
      await addDoc(collection(db, "tenants", tenantId, "services"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
    setServiceForm(initialServiceForm);
    setSaving(false);
    addToast(serviceForm.id ? "Serviço atualizado." : "Serviço cadastrado.");
    return true;
  }

  async function deleteProduct(productId) {
    if (!assertPermission("writeProducts")) return;
    await deleteDoc(doc(db, "tenants", tenantId, "products", productId));
    addToast("Produto excluído.");
  }

  async function deleteService(serviceId) {
    if (!assertPermission("writeServices")) return;
    await deleteDoc(doc(db, "tenants", tenantId, "services", serviceId));
    addToast("Serviço excluído.");
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();
    if (!assertPermission("writeCustomers")) return false;
    setErrors({});
    if (!validateCustomerForm(true)) return false;
    setSaving(true);
    const payload = {
      ...customerForm,
      tenant_id: tenantId,
      updatedAt: serverTimestamp(),
    };
    if (customerForm.id) {
      await setDoc(doc(db, "tenants", tenantId, "customers", customerForm.id), payload, { merge: true });
    } else {
      await addDoc(collection(db, "tenants", tenantId, "customers"), {
        ...payload,
        totalSpent: 0,
        createdAt: serverTimestamp(),
      });
    }
    setCustomerForm(initialCustomerForm);
    setSaving(false);
    addToast(customerForm.id ? "Cliente atualizado." : "Cliente cadastrado.");
    return true;
  }

  async function deleteCustomer(customerId) {
    if (!assertPermission("writeCustomers")) return;
    await deleteDoc(doc(db, "tenants", tenantId, "customers", customerId));
    addToast("Cliente excluído.");
  }

  async function handleOsSubmit(event) {
    event.preventDefault();
    if (!assertPermission("writeWorkOrders")) return false;
    setErrors({});
    if (!validateOsForm()) return false;
    setSaving(true);
    const nextOsNumber = osForm.id ? osForm.osNumber : workOrders.reduce((max, order, index) => {
      const number = Number(order.osNumber || 0);
      return Math.max(max, number, index + 1);
    }, 0) + 1;
    const osServicesTotal = (osForm.services || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
    const osPartsTotal = (osForm.parts || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    const customerPayload = {
      name: osForm.customer,
      phone: osForm.phone,
      document: "",
      device: osForm.device,
      note: osForm.issue,
    };
    const customerId = await saveCustomerFromSale(0, customerPayload);
    const payload = {
      ...osForm,
      tenant_id: tenantId,
      osNumber: nextOsNumber,
      code: `OS #${nextOsNumber}`,
      customerId,
      estimate: parseMoney(osForm.estimate) || osServicesTotal + osPartsTotal,
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
    };
    let savedOs;
    if (osForm.id) {
      await setDoc(doc(db, "tenants", tenantId, "workOrders", osForm.id), payload, { merge: true });
      savedOs = { id: osForm.id, ...payload };
    } else {
      const osRef = await addDoc(collection(db, "tenants", tenantId, "workOrders"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      savedOs = { id: osRef.id, ...payload };
    }
    setOsForm(initialOsForm);
    setSaving(false);
    addToast(osForm.id ? "OS atualizada." : "OS aberta.");
    return savedOs;
  }

  async function handleStoreSubmit(event) {
    event.preventDefault();
    if (!assertPermission("equipe")) return;
    const nextErrors = {};
    if (!storeForm.name.trim()) nextErrors.storeName = "Informe o nome da loja.";
    if (storeForm.document && !isValidDocument(storeForm.document)) nextErrors.storeDocument = "CPF/CNPJ inválido.";
    if (storeForm.cep && onlyDigits(storeForm.cep).length !== 8) nextErrors.storeCep = "CEP inválido.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    await setDoc(doc(db, "tenants", tenantId), { ...storeForm, updatedAt: serverTimestamp() }, { merge: true });
    setSaving(false);
    addToast("Dados da loja atualizados.");
  }

  async function saveFinancialAccounts(financialAccounts) {
    if (!assertPermission("financeiro")) return false;
    setSaving(true);
    await setDoc(doc(db, "tenants", tenantId), { financialAccounts, updatedAt: serverTimestamp() }, { merge: true });
    setSaving(false);
    addToast("Financeiro atualizado.");
    return true;
  }

  async function saveSuppliers(suppliers) {
    if (!assertPermission("estoque")) return false;
    setSaving(true);
    await setDoc(doc(db, "tenants", tenantId), { suppliers, updatedAt: serverTimestamp() }, { merge: true });
    setSaving(false);
    addToast("Estoque atualizado.");
    return true;
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    if (!assertPermission("equipe")) return false;
    const normalizedEmail = normalizeEmail(inviteForm.email);
    const nextErrors = {};
    if (!normalizedEmail.includes("@")) nextErrors.inviteEmail = "Informe um e-mail válido.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return false;
    setSaving(true);
    const payload = {
      email: normalizedEmail,
      name: inviteForm.name || "",
      role: inviteForm.role,
      tenant_id: tenantId,
      status: "pending",
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "tenantInvites", emailKey(normalizedEmail)), payload);
    await setDoc(doc(db, "tenants", tenantId, "invites", emailKey(normalizedEmail)), payload);
    setInviteForm(initialInviteForm);
    setSaving(false);
    addToast("Convite criado. O usuário entra com esse e-mail e será vinculado à loja.");
    return true;
  }

  async function updateInviteStatus(inviteId, status) {
    if (!assertPermission("equipe")) return;
    const invite = invites.find((item) => item.id === inviteId);
    if (!invite) return;
    await setDoc(doc(db, "tenantInvites", inviteId), { status, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(doc(db, "tenants", tenantId, "invites", inviteId), { status, updatedAt: serverTimestamp() }, { merge: true });
    addToast(status === "canceled" ? "Convite cancelado." : "Convite atualizado.");
  }

  async function updateStock(product, delta) {
    if (!assertPermission("writeProducts")) return;
    const previousStock = Number(product.stock || 0);
    const nextStock = Math.max(previousStock + Number(delta || 0), 0);
    await setDoc(doc(db, "tenants", tenantId, "products", product.id), {
      stock: nextStock,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await addDoc(collection(db, "tenants", tenantId, "stockMovements"), {
      tenant_id: tenantId,
      productId: product.id,
      productName: product.name,
      type: delta >= 0 ? "entry" : "exit",
      quantity: Number(delta || 0),
      previousStock,
      nextStock,
      cost: Number(product.cost || 0),
      supplier: product.supplier || "",
      source: delta >= 0 ? "Entrada manual" : "Saída manual",
      operatorUid: user.uid,
      createdAt: serverTimestamp(),
    });
    await logAudit("stock.move", { productId: product.id, productName: product.name, delta, previousStock, nextStock });
  }

  async function updateOrderStatus(orderId, status) {
    if (status === "Cancelado" && !assertPermission("cancelOrders")) return;
    await updateDoc(doc(db, "tenants", tenantId, "orders", orderId), { status, updatedAt: serverTimestamp() });
    await logAudit("order.status", { orderId, status });
    addToast("Status atualizado.");
  }

  async function deleteOrder(orderId) {
    if (!assertPermission("financeiro")) return;
    if (!tenant?.allowOrderDelete) {
      addToast("Exclusão de venda bloqueada nas configurações.", "error");
      return;
    }
    await deleteDoc(doc(db, "tenants", tenantId, "orders", orderId));
    await logAudit("order.delete", { orderId });
    addToast("Venda excluida.");
  }

  async function updateWorkOrderStatus(workOrderId, status) {
    if (!assertPermission("writeWorkOrders")) return;
    await updateDoc(doc(db, "tenants", tenantId, "workOrders", workOrderId), { status, updatedAt: serverTimestamp() });
    addToast("OS atualizada.");
  }

  async function deleteWorkOrder(workOrderId) {
    if (!assertPermission("writeWorkOrders")) return;
    await deleteDoc(doc(db, "tenants", tenantId, "workOrders", workOrderId));
    addToast("OS excluida.");
  }

  function handleLogout() {
    setProducts([]);
    setServices([]);
    setOrders([]);
    setCustomers([]);
    setWorkOrders([]);
    setMembers([]);
    setInvites([]);
    setStockMovements([]);
    setCart([]);
    setTenantId("");
    setTenant(null);
    setProfile(null);
    loaded.current = { products: false, services: false };
    setDataReady({ products: false, services: false });
    signOut(auth);
  }

  async function handlePasswordChange(currentPassword, newPassword) {
    if (!auth.currentUser?.email) {
      addToast("Usuário não autenticado.", "error");
      return false;
    }
    if (!newPassword || newPassword.length < 6) {
      addToast("A nova senha precisa ter pelo menos 6 caracteres.", "error");
      return false;
    }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      addToast("Senha alterada com sucesso.");
      return true;
    } catch (error) {
      addToast(error.code === "auth/invalid-credential" ? "Senha atual incorreta." : mensagemErro(error, "Não foi possível alterar a senha."), "error");
      return false;
    }
  }

  if (canonicalRedirect || loading || bootingTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
        <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6 text-center ring-1 ring-white/10">
          <BrandLogo className="mx-auto" />
          <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-sky-200">Carregando sistema</p>
        </div>
      </div>
    );
  }

  if (user && !tenantId) {
    return (
      <>
        <ToastStack toasts={toasts} />
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
            <BrandLogo className="mx-auto mb-6" />
            <h1 className="text-2xl font-black">Não foi possível carregar a loja</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              {erro || "Seu login foi criado, mas o vínculo com a loja ainda não ficou pronto."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  initializeTenant(user).catch((error) => {
                    setErro(mensagemErro(error, "Não foi possível carregar a loja."));
                    setBootingTenant(false);
                  });
                }}
                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                Tentar novamente
              </button>
              <button type="button" onClick={handleLogout} className="rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-950">
                Sair
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <ToastStack toasts={toasts} />
        <LoginPage
          authMode={authMode}
          setAuthMode={setAuthMode}
          email={email}
          setEmail={setEmail}
          senha={senha}
          setSenha={setSenha}
          signupStoreForm={signupStoreForm}
          setSignupStoreForm={setSignupStoreForm}
          acceptedTerms={acceptedTerms}
          setAcceptedTerms={setAcceptedTerms}
          erro={erro}
          sucesso={sucesso}
          errors={errors}
          onSubmit={handleAuthSubmit}
          clearMessages={() => {
            setErro("");
            setSucesso("");
          }}
        />
      </>
    );
  }

  const page = canAccess(profile?.role, activeTab) ? activeTab : "modulos";

  if (profile?.status === "blocked") {
    return (
      <>
        <ToastStack toasts={toasts} />
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
          <div className="max-w-md rounded-xl border border-white/10 bg-white/10 p-8 text-center">
            <BrandLogo className="mx-auto mb-6" />
            <h1 className="text-2xl font-black">Acesso bloqueado</h1>
            <p className="mt-3 text-slate-300">Seu usuário foi bloqueado pelo administrador da loja.</p>
            <button type="button" onClick={handleLogout} className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950">
              Sair
            </button>
          </div>
        </div>
      </>
    );
  }

  const subscriptionStatus = tenant?.subscriptionStatus || "active";
  const subscriptionAllowed = ["active", "trial"].includes(subscriptionStatus);
  if (!subscriptionAllowed) {
    return (
      <>
        <ToastStack toasts={toasts} />
        <SubscriptionPage tenant={tenant} user={user} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} />
      <AppShell
        activeTab={page}
        setActiveTab={setActiveTab}
        user={user}
        profile={profile}
        tenant={tenant}
        notifications={notifications}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        globalResults={globalResults}
        onGlobalResultClick={handleGlobalResultClick}
        onLogout={handleLogout}
      >
        {page === "modulos" && (
          <ModulosPage setActiveTab={setActiveTab} />
        )}

        {page === "pdv" && (
          <PdvPage
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            filteredProducts={filteredProducts}
            customers={customers}
            services={services}
            cart={cart}
            cartSummary={cartSummary}
            discount={discount}
            setDiscount={setDiscount}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            applyCoupon={applyCoupon}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            payments={payments}
            setPayments={setPayments}
            creditSurplus={creditSurplus}
            setCreditSurplus={setCreditSurplus}
            payment={payment}
            setPayment={setPayment}
            metrics={metrics}
            tenant={tenant}
            openCashSession={openCashSession}
            cashMovements={cashMovements}
            cashSummary={cashSummary}
            canManageCash={canAccess(profile?.role, "cashManagement")}
            operatorName={profile?.name || user.email}
            openCashRegister={openCashRegister}
            closeCashRegister={closeCashRegister}
            addCashMovement={addCashMovement}
            lastReceipt={lastReceipt}
            setLastReceipt={setLastReceipt}
            erro={erro}
            saving={saving}
            addProductToCart={addProductToCart}
            addServiceToCart={addServiceToCart}
            addVoucherToCart={addVoucherToCart}
            updateCartQuantity={updateCartQuantity}
            clearCart={clearCart}
            finishSale={finishSale}
            handleCustomerSubmit={handleCustomerSubmit}
            setActiveTab={setActiveTab}
            errors={errors}
          />
        )}

        {(page === "assistencia" || page === "servicos") && (
          <AssistenciaPage
            tenant={tenant}
            storeForm={storeForm}
            osForm={osForm}
            setOsForm={setOsForm}
            serviceForm={serviceForm}
            setServiceForm={setServiceForm}
            services={services}
            products={products}
            customers={customers}
            members={members}
            workOrders={workOrders}
            saving={saving}
            errors={errors}
            handleOsSubmit={handleOsSubmit}
            handleServiceSubmit={handleServiceSubmit}
            deleteService={deleteService}
            updateWorkOrderStatus={updateWorkOrderStatus}
            deleteWorkOrder={deleteWorkOrder}
          />
        )}

        {page === "produtos" && (
          <ProdutosPage
            productForm={productForm}
            setProductForm={setProductForm}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            filteredProducts={filteredProducts}
            saving={saving}
            errors={errors}
            handleProductSubmit={handleProductSubmit}
            deleteProduct={deleteProduct}
          />
        )}

        {page === "estoque" && (
          <EstoquePage
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            filteredProducts={filteredProducts}
            products={products}
            stockMovements={stockMovements}
            storeForm={storeForm}
            saving={saving}
            updateStock={updateStock}
            saveSuppliers={saveSuppliers}
          />
        )}

        {page === "clientes" && (
          <ClientesPage
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            customers={customers}
            saving={saving}
            errors={errors}
            handleCustomerSubmit={handleCustomerSubmit}
            deleteCustomer={deleteCustomer}
          />
        )}

        {page === "vendas" && (
          <VendasPage
            metrics={metrics}
            tenant={tenant}
            orders={orders}
            filteredOrders={filteredOrders}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            updateOrderStatus={updateOrderStatus}
            deleteOrder={deleteOrder}
          />
        )}

        {page === "financeiro" && (
          <FinanceiroPage
            metrics={metrics}
            storeForm={storeForm}
            saving={saving}
            saveFinancialAccounts={saveFinancialAccounts}
            orders={orders}
            cashSessions={cashSessions}
            cashMovements={cashMovements}
          />
        )}

        {page === "equipe" && (
          <EquipePage
            tenant={tenant}
            inviteForm={inviteForm}
            setInviteForm={setInviteForm}
            members={members}
            invites={invites}
            saving={saving}
            errors={errors}
            handleStoreSubmit={handleStoreSubmit}
            handleInviteSubmit={handleInviteSubmit}
            updateMemberRole={updateMemberRole}
            updateMemberStatus={updateMemberStatus}
            updateInviteStatus={updateInviteStatus}
          />
        )}

        {page === "relatorios" && (
          <RelatoriosPage
            tenant={tenant}
            metrics={metrics}
            orders={orders}
            products={products}
            customers={customers}
            workOrders={workOrders}
            cashMovements={cashMovements}
            stockMovements={stockMovements}
          />
        )}

        {page === "configuracoes" && (
          <ConfiguracoesPage
            tenant={tenant}
            storeForm={storeForm}
            setStoreForm={setStoreForm}
            saving={saving}
            errors={errors}
            handleStoreSubmit={handleStoreSubmit}
            onPasswordChange={handlePasswordChange}
          />
        )}

        {page === "backup" && (
          <BackupPage
            tenant={tenant}
            products={products}
            services={services}
            customers={customers}
            orders={orders}
            workOrders={workOrders}
            cashSessions={cashSessions}
            cashMovements={cashMovements}
            coupons={coupons}
          />
        )}

        {page === "integracoes" && (
          <IntegracoesPage
            storeForm={storeForm}
            setStoreForm={setStoreForm}
            saving={saving}
            handleStoreSubmit={handleStoreSubmit}
          />
        )}

        {page === "impressoes" && (
          <ImpressoesPage
            storeForm={storeForm}
            setStoreForm={setStoreForm}
            saving={saving}
            handleStoreSubmit={handleStoreSubmit}
          />
        )}

        {page === "cupons" && (
          <CuponsPage
            coupons={coupons}
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            saving={saving}
            handleCouponSubmit={handleCouponSubmit}
          />
        )}

        {page === "metas" && (
          <MetasPage
            metrics={metrics}
            storeForm={storeForm}
            setStoreForm={setStoreForm}
            saving={saving}
            handleStoreSubmit={handleStoreSubmit}
          />
        )}
      </AppShell>
    </>
  );
}

export default App;
