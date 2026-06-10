import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Clock3,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  ListFilter,
  Loader2,
  LogIn,
  LogOut,
  PackageSearch,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getProduct, searchProducts } from "./lib/api";
import { cost, money, quantity } from "./lib/format";
import { supabase, supabaseStatus } from "./lib/supabase";
import { InvoicesTable } from "./components/InvoicesTable";
import { ProductDetails } from "./components/ProductDetails";
import { ProductList } from "./components/ProductList";
import { SearchBar } from "./components/SearchBar";
import { StockPanel } from "./components/StockPanel";

type ViewId = "dashboard" | "consulta" | "estoque" | "entradas" | "cadastro";

type ProfileInfo = {
  name: string;
  email: string;
  role: string;
  status: string;
  sectors: string[];
  isAdmin: boolean;
};

const navigation: Array<{ id: ViewId; label: string; description: string; icon: typeof LayoutDashboard; adminOnly?: boolean }> = [
  { id: "dashboard", label: "Visão geral", description: "Resumo da consulta", icon: LayoutDashboard },
  { id: "consulta", label: "Consulta de custos", description: "Produto, custo e filial", icon: PackageSearch },
  { id: "estoque", label: "Estoque", description: "Saldo e custo médio", icon: Warehouse },
  { id: "entradas", label: "Entradas", description: "Notas fiscais SD1", icon: ReceiptText },
  { id: "cadastro", label: "Cadastro", description: "SB1 e atributos", icon: Boxes },
];

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);

  return debounced;
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function displayNameFromUser(user: User, profile?: Record<string, unknown> | null) {
  const profileName = String(profile?.full_name ?? profile?.name ?? profile?.nome ?? "").trim();
  const metadataName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
  if (profileName) return profileName;
  if (metadataName) return metadataName;
  return user.email?.split("@")[0].replace(/[._-]+/g, " ") ?? "Usuário EcoPower";
}

function roleFromProfile(profile?: Record<string, unknown> | null) {
  const raw = String(profile?.role ?? profile?.cargo ?? profile?.profile ?? profile?.perfil ?? "").toLowerCase();
  if (raw.includes("admin")) return "Administrador";
  if (raw.includes("controladoria")) return "Controladoria";
  if (raw.includes("auditor")) return "Auditoria";
  if (raw.includes("compr")) return "Compras";
  return "Usuário do setor";
}

function sectorsFromProfile(profile?: Record<string, unknown> | null) {
  const raw = profile?.sectors ?? profile?.setores ?? profile?.allowed_sectors ?? profile?.sector ?? profile?.setor;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return raw.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function isAdminProfile(email: string, profile?: Record<string, unknown> | null) {
  const role = String(profile?.role ?? profile?.cargo ?? profile?.profile ?? profile?.perfil ?? "").toLowerCase();
  return email.toLowerCase() === "maria.almeida@ecopower.com.br" || role.includes("admin");
}

async function loadProfile(user: User): Promise<ProfileInfo> {
  let profile: Record<string, unknown> | null = null;

  if (supabase) {
    const byId = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (byId.data) {
      profile = byId.data as Record<string, unknown>;
    } else if (user.email) {
      const byEmail = await supabase.from("profiles").select("*").eq("email", user.email).maybeSingle();
      if (byEmail.data) profile = byEmail.data as Record<string, unknown>;
    }
  }

  const email = user.email ?? "";
  return {
    name: displayNameFromUser(user, profile),
    email,
    role: roleFromProfile(profile),
    status: String(profile?.status ?? profile?.situacao ?? "ativo"),
    sectors: sectorsFromProfile(profile),
    isAdmin: isAdminProfile(email, profile),
  };
}

function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Supabase não configurado. Confira o arquivo .env antes de publicar.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (loginError) {
      setError(loginError.message.includes("Invalid login") ? "E-mail ou senha inválidos." : loginError.message);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-line">
          <img src="/brand-mark.png" alt="EcoPower" />
          <div>
            <strong>EcoPower Custos</strong>
            <span>Controle de custos Protheus</span>
          </div>
        </div>
        <span className="eyebrow"><ShieldCheck size={14} /> Acesso seguro</span>
        <h1>Gestão de custos e produtos</h1>
        <p>
          Use o mesmo acesso das plataformas EcoPower para consultar produtos, estoque, custo unitário e entradas fiscais.
        </p>
        <form className="auth-form" onSubmit={login}>
          <label className="field">
            <span>E-mail</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="nome@ecopower.com.br" />
          </label>
          <label className="field">
            <span>Senha</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Sua senha" />
          </label>
          {error && <div className="auth-error"><AlertTriangle size={16} /> {error}</div>}
          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="auth-foot">
          <span>{supabaseStatus}</span>
          <small>Auth compartilhado com Auditoria Interna</small>
        </div>
      </section>
      <aside className="auth-visual">
        <div className="floating-card top">
          <Database size={18} />
          <div><strong>Base protegida</strong><span>Consulta liberada após login</span></div>
        </div>
        <div className="floating-card middle">
          <PackageSearch size={18} />
          <div><strong>Produto + custo</strong><span>SB1, SB2, SD1 e fornecedores</span></div>
        </div>
        <div className="floating-card bottom">
          <ShieldCheck size={18} />
          <div><strong>RLS e perfis</strong><span>Mesmo padrão das plataformas EcoPower</span></div>
        </div>
      </aside>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-shell single">
      <section className="auth-card compact">
        <img className="loading-logo" src="/brand-mark.png" alt="EcoPower" />
        <Loader2 className="spin" size={24} />
        <strong>Validando acesso...</strong>
      </section>
    </main>
  );
}

function BlockedAccess({ profile }: { profile: ProfileInfo }) {
  return (
    <main className="auth-shell single">
      <section className="auth-card compact">
        <AlertTriangle size={28} />
        <strong>Acesso desativado</strong>
        <p>O usuário {profile.email} está marcado como inativo ou arquivado. Reative o acesso pela plataforma de Auditoria Interna.</p>
        <button className="logout-button" onClick={() => supabase?.auth.signOut()}>
          <LogOut size={16} />
          Sair
        </button>
      </section>
    </main>
  );
}

function AppShell({ profile }: { profile: ProfileInfo }) {
  const [view, setView] = useState<ViewId>(() => (localStorage.getItem("costs:view") as ViewId) || "consulta");
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>();
  const [filial, setFilial] = useState("");
  const [page, setPage] = useState(1);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const now = useLiveClock();

  useEffect(() => {
    localStorage.setItem("costs:view", view);
  }, [view]);

  const searchQuery = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.trim().length > 1,
    staleTime: 60_000,
  });

  const products = searchQuery.data ?? [];

  useEffect(() => {
    if (!products.length) {
      if (debouncedSearch.trim().length > 1) setSelectedCode(undefined);
      return;
    }
    if (selectedCode && !products.some((product) => product.codigo === selectedCode)) {
      setSelectedCode(undefined);
      setPage(1);
    }
  }, [debouncedSearch, products, selectedCode]);

  const detailQuery = useQuery({
    queryKey: ["product", selectedCode, page, filial],
    queryFn: () => getProduct(selectedCode ?? "", page, filial),
    enabled: Boolean(selectedCode),
    staleTime: 60_000,
  });

  const selectedDescription = useMemo(
    () => products.find((product) => product.codigo === selectedCode)?.descricao,
    [products, selectedCode],
  );

  const detail = detailQuery.data;
  const productTitle = selectedDescription ?? String(detail?.sb1.b1_desc ?? "Produto não selecionado");
  const activeNavigation = navigation.filter((item) => profile.isAdmin || !item.adminOnly);

  function selectProduct(code: string) {
    setSelectedCode(code);
    setPage(1);
    setView("consulta");
  }

  const kpis = [
    { label: "Saldo consultado", value: detail ? quantity(detail.sb2.total.quantidade) : "n/d", detail: filial.trim() ? `Filial ${filial.trim()}` : "Todas as filiais", icon: Warehouse },
    { label: "Valor em estoque", value: detail ? money(detail.sb2.total.custo_total) : "n/d", detail: "Custo consolidado SB2", icon: Database },
    { label: "Custo unitário", value: detail ? cost(detail.sb2.total.custo_unitario) : "n/d", detail: "Média pelo saldo atual", icon: ListFilter },
    { label: "Entradas SD1", value: detail ? String(detail.sd1.pagination.total) : "n/d", detail: "Notas relacionadas ao item", icon: ReceiptText },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/brand-mark.png" alt="EcoPower" />
          <div>
            <strong>EcoPower Custos</strong>
            <span>Gestão de custos</span>
          </div>
        </div>

        <div className="sidebar-group">
          <span className="group-title">Operação</span>
          {activeNavigation.map((item) => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button key={item.id} className={`nav-item ${selected ? "active" : ""}`} onClick={() => setView(item.id)}>
                <Icon size={17} />
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            );
          })}
        </div>

        <div className="sidebar-logout">
          <button className="logout-button" onClick={() => supabase?.auth.signOut()}>
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button" aria-label="Atualizar consulta" title="Atualizar consulta" disabled={!selectedCode} onClick={() => detailQuery.refetch()}>
            <RefreshCw size={18} />
          </button>
          <div className="top-search">
            <Search size={17} />
            <SearchBar value={search} onChange={setSearch} suggestions={products} loading={searchQuery.isFetching} onSelect={selectProduct} compact />
          </div>
          <div className="top-pill clock-pill">
            <Clock3 size={16} />
            <span>{greeting(now)}, {firstName(profile.name)}</span>
            <small>{now.toLocaleDateString("pt-BR")}, {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
          <button className="icon-button notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notificações" title="Notificações">
            <Bell size={18} />
            <span />
          </button>
          <div className="user-pill">
            <div className="avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{profile.name}</strong>
              <small>{profile.email}</small>
            </div>
          </div>
          {notificationsOpen && (
            <div className="notifications-popover">
              <strong>Notificações</strong>
              <span>Sem pendências críticas na consulta de custos.</span>
              <span>API de produtos: {detailQuery.isError ? "atenção necessária" : "operacional"}</span>
            </div>
          )}
        </header>

        <main className="content">
          <section className="command-strip">
            <div className="command-copy">
              <span className="eyebrow"><PackageSearch size={14} /> Consulta Protheus</span>
              <div>
                <h1>Consulta de custos</h1>
                <p>Pesquise produto, confira saldo, custo médio, entradas e cadastro em uma tela mais direta.</p>
              </div>
            </div>
            <div className="command-tools">
              <label className="filial-field compact">
                <span>Filial</span>
                <input
                  value={filial}
                  onChange={(event) => {
                    setFilial(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Todas"
                />
              </label>
              <button className="primary-action" type="button" onClick={() => setView("consulta")}>
                <Search size={17} />
                Consultar
              </button>
            </div>
            <div className="mini-kpis">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <article className="mini-kpi" key={kpi.label}>
                    <Icon size={16} />
                    <div>
                      <span>{kpi.label}</span>
                      <strong>{kpi.value}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {view === "dashboard" && (
            <section className="dashboard-grid">
              <Panel title="Buscar produto" subtitle="Digite código, descrição, grupo ou tipo">
                <SearchBar value={search} onChange={setSearch} suggestions={products} loading={searchQuery.isFetching} onSelect={selectProduct} />
                <ProductList
                  products={products}
                  selectedCode={selectedCode}
                  loading={searchQuery.isFetching}
                  error={searchQuery.isError}
                  errorMessage={searchQuery.error instanceof Error ? searchQuery.error.message : undefined}
                  query={debouncedSearch}
                  onSelect={selectProduct}
                />
              </Panel>
              <Panel title="Produto em foco" subtitle={selectedCode ? selectedCode : "Nenhum item selecionado"}>
                {detail ? (
                  <div className="focus-product">
                    <strong>{productTitle}</strong>
                    <span>{quantity(detail.sb2.total.quantidade)} em estoque</span>
                    <span>{money(detail.sb2.total.custo_total)} de custo consolidado</span>
                    <div className="focus-actions">
                      <button className="secondary-action" onClick={() => setView("consulta")}>Abrir detalhe</button>
                      <button className="secondary-action" onClick={() => setView("entradas")}>Entradas</button>
                      <button className="secondary-action" onClick={() => setView("cadastro")}>Cadastro</button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">Selecione um produto para abrir estoque, entradas e cadastro.</div>
                )}
              </Panel>
            </section>
          )}

          {view === "consulta" && (
            <section className="consult-grid">
              <aside className="result-column">
                <Panel title="Resultados" subtitle={debouncedSearch.trim() ? `${products.length} produtos encontrados` : "Digite ao menos 2 caracteres"}>
                  <ProductList
                    products={products}
                    selectedCode={selectedCode}
                    loading={searchQuery.isFetching}
                    error={searchQuery.isError}
                    errorMessage={searchQuery.error instanceof Error ? searchQuery.error.message : undefined}
                    query={debouncedSearch}
                    onSelect={selectProduct}
                  />
                </Panel>
              </aside>
              <section className="detail-column">
                <ProductHeader loading={detailQuery.isLoading} error={detailQuery.isError} code={selectedCode} title={productTitle} />
                {detail && (
                  <>
                    <StockPanel data={detail.sb2} />
                    <section className="next-actions">
                      <button className="secondary-action" onClick={() => setView("entradas")}>
                        <ReceiptText size={17} />
                        Ver notas de entrada
                      </button>
                      <button className="secondary-action" onClick={() => setView("cadastro")}>
                        <Boxes size={17} />
                        Ver cadastro completo
                      </button>
                    </section>
                  </>
                )}
              </section>
            </section>
          )}

          {view === "estoque" && (
            <section className="stack">
              <ProductHeader loading={detailQuery.isLoading} error={detailQuery.isError} code={selectedCode} title={productTitle} />
              {detail ? <StockPanel data={detail.sb2} /> : <EmptyProductMessage />}
            </section>
          )}

          {view === "entradas" && (
            <section className="stack">
              <ProductHeader loading={detailQuery.isLoading} error={detailQuery.isError} code={selectedCode} title={productTitle} />
              {detail ? <InvoicesTable data={detail.sd1} onPageChange={setPage} /> : <EmptyProductMessage />}
            </section>
          )}

          {view === "cadastro" && (
            <section className="stack">
              <ProductHeader loading={detailQuery.isLoading} error={detailQuery.isError} code={selectedCode} title={productTitle} />
              {detail ? <ProductDetails product={detail.sb1} /> : <EmptyProductMessage />}
            </section>
          )}
        </main>
      </section>
    </div>
  );
}

function ProductHeader({ loading, error, code, title }: { loading: boolean; error: boolean; code?: string; title: string }) {
  if (!code) return <EmptyProductMessage />;
  if (loading) return <div className="loading-panel"><Loader2 className="spin" size={20} /> Carregando detalhes do produto...</div>;
  if (error) return <div className="error-panel"><AlertTriangle size={18} /> Não foi possível carregar o produto selecionado.</div>;
  return (
    <section className="product-header">
      <span>{code}</span>
      <h2>{title}</h2>
    </section>
  );
}

function EmptyProductMessage() {
  return (
    <div className="empty-state large">
      <PackageSearch size={22} />
      Pesquise e selecione um produto para visualizar os detalhes.
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      setProfile(user ? await loadProfile(user) : null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setProfile(user ? await loadProfile(user) : null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) return <LoadingScreen />;
  if (!profile) return <LoginView />;
  if (/(inativo|inactive|arquivado|archived|disabled)/i.test(profile.status)) return <BlockedAccess profile={profile} />;
  return <AppShell profile={profile} />;
}
