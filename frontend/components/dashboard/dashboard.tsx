"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Icon, type IconName } from "@/components/inventory/icon";
import { apiFetch } from "@/lib/api-client";
import { quickActions } from "./dashboard-data";
import styles from "./dashboard.module.css";

const navigation: { label: string; icon: IconName; href?: string }[] = [
  { label: "Dashboard", icon: "dashboard", href: "/" },
  { label: "Productos", icon: "cart", href: "/productos" },
  { label: "Inventario", icon: "box", href: "/inventario" },
  { label: "Categorías", icon: "tag", href: "/categorias" },
  { label: "Proveedores", icon: "truck", href: "/proveedores" },
  { label: "Movimientos", icon: "swap" },
  { label: "Reportes", icon: "chart" },
  { label: "Usuarios", icon: "users", href: "/usuarios" },
  { label: "Configuración", icon: "settings" },
];

type DashboardSummary = {
  products: { total: number; active: number; promotion: number; hidden: number };
  categories: number;
  suppliers: number;
  inventory: { pendingReview: number };
  priceChangesThisMonth: number;
  weeklyPriceChanges: number[];
  recent: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: string;
    productName: string | null;
  }>;
};

export function Dashboard() {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    void apiFetch<DashboardSummary>("dashboard/summary")
      .then(setSummary)
      .catch((error: unknown) => setToast(error instanceof Error ? error.message : "No fue posible cargar el dashboard"));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function runAction(label: string, target?: string) {
    if (target) {
      router.push(target);
      return;
    }
    setToast(`${label}: módulo pendiente`);
  }

  const productState = summary?.products ?? { total: 0, active: 0, promotion: 0, hidden: 0 };
  const metrics: { label: string; value: string; trend: string; icon: IconName; tone: string }[] = [
    { label: "Productos activos", value: String(productState.active), trend: "Catálogo sincronizado", icon: "package", tone: "teal" },
    { label: "Productos ocultos", value: String(productState.hidden), trend: "Estado actual", icon: "eye-off", tone: "amber" },
    { label: "Cambios de precio este mes", value: String(summary?.priceChangesThisMonth ?? 0), trend: "Historial registrado", icon: "tag", tone: "blue" },
    { label: "Pendientes de revisión", value: String(summary?.inventory.pendingReview ?? 0), trend: "Requieren revisión", icon: "clipboard", tone: "purple" },
  ];
  const activities = (summary?.recent ?? []).map((activity) => ({
    ...activity,
    product: activity.productName ?? "Actualización masiva",
    icon: "📦",
    iconTone: "#eef5f4",
    actionLabel: activity.action === "CREATE"
      ? "Producto creado"
      : activity.action === "DELETE"
        ? "Producto eliminado"
        : activity.action === "BULK_PRICE_UPDATE"
          ? "Actualización masiva"
          : "Producto actualizado",
    date: new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(activity.createdAt)),
  }));
  const alerts = [
    { label: "productos pendientes de revisión", count: summary?.inventory.pendingReview ?? 0, icon: "warning" as IconName, tone: "red" },
    { label: "productos ocultos", count: productState.hidden, icon: "eye-off" as IconName, tone: "amber" },
    { label: "categorías registradas", count: summary?.categories ?? 0, icon: "tag" as IconName, tone: "purple" },
    { label: "proveedores registrados", count: summary?.suppliers ?? 0, icon: "truck" as IconName, tone: "blue" },
  ];
  const weekValues = summary?.weeklyPriceChanges ?? [0, 0, 0, 0, 0];
  const maxWeekValue = Math.max(1, ...weekValues);
  const chartPoints = weekValues.map((value, index) => ({
    x: 50 + index * 100,
    y: 145 - (value / maxWeekValue) * 85,
    value,
    label: `Semana ${index + 1}`,
    dates: ["(1–7)", "(8–14)", "(15–21)", "(22–28)", "(29–31)"][index],
  }));
  const chartLine = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  const chartArea = `${chartLine} L450 148 L50 148 Z`;
  const percent = (value: number) => productState.total
    ? ((value / productState.total) * 100).toFixed(1)
    : "0.0";

  return (
    <div className={styles.appShell}>
      <button className={`${styles.navScrim} ${navOpen ? styles.navScrimVisible : ""}`} aria-label="Cerrar menú" onClick={() => setNavOpen(false)} />
      <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}><span className={styles.brandMark}><Icon name="cart" /></span><span>Abarrotes</span><button aria-label="Cerrar navegación" onClick={() => setNavOpen(false)}><Icon name="arrow-left" /></button></div>
        <nav className={styles.navigation} aria-label="Navegación principal">{navigation.map((item) => item.href ? <Link key={item.label} href={item.href} className={`${styles.navItem} ${item.label === "Dashboard" ? styles.navItemActive : ""}`} onClick={() => setNavOpen(false)}><Icon name={item.icon} /><span>{item.label}</span></Link> : <button key={item.label} className={styles.navItem} onClick={() => setToast(`${item.label}: módulo pendiente`)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <button className={styles.storeCard} onClick={() => setToast("Sucursal Tienda Centro seleccionada")}><span className={styles.storeIcon}><Icon name="store" /></span><span><strong>Tienda Centro</strong><small>Abarrotes</small></span><Icon name="chevron-down" /></button>
        <form action={logout} className={styles.logoutForm}><button type="submit"><Icon name="logout" /> Cerrar sesión</button></form>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.pageHeader}><button className={styles.mobileMenu} aria-label="Abrir menú" onClick={() => setNavOpen(true)}><Icon name="menu" /></button><div><p>Operación de tienda</p><h1>Dashboard</h1><span>Supervisa el catálogo y la actividad registrada en PostgreSQL.</span></div><button className={styles.primaryButton} onClick={() => router.push("/productos")}><Icon name="plus" /> Nuevo producto</button></header>

        <section className={styles.metricsGrid} aria-label="Métricas del catálogo">{metrics.map((metric, index) => <article className={styles.metricCard} key={metric.label}><span className={`${styles.metricIcon} ${styles[`tone${metric.tone}`]}`}><Icon name={metric.icon} /></span><div><p>{metric.label}</p><strong>{metric.value}</strong><small className={index === 1 ? styles.neutral : ""}><Icon name={index === 1 ? "minus" : "check"} />{metric.trend}</small></div></article>)}</section>

        <div className={styles.activityGrid}>
          <section className={styles.panel}><div className={styles.panelHeader}><div><Icon name="clock" /><span><h2>Actividad reciente</h2><p>Últimas acciones persistidas en el catálogo</p></span></div><button onClick={() => router.push("/productos")}>Ver todo</button></div><div className={styles.tableScroller}><table className={styles.activityTable}><thead><tr><th>Producto</th><th>Acción</th><th>Antes</th><th>Después</th><th>Usuario</th><th>Fecha</th><th>Estado</th><th><span className={styles.srOnly}>Más</span></th></tr></thead><tbody>{activities.map((activity) => <tr key={activity.id}><td><span className={styles.productCell}><i style={{ background: activity.iconTone }}>{activity.icon}</i>{activity.product}</span></td><td>{activity.actionLabel}</td><td>—</td><td>—</td><td>{activity.user}</td><td>{activity.date}</td><td><span className={styles.statusPill}>Completado</span></td><td><button className={styles.moreButton} aria-label={`Más detalles de ${activity.product}`}><Icon name="more" /></button></td></tr>)}</tbody></table>{activities.length === 0 && <p>Sin actividad reciente.</p>}</div></section>
          <section className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.quickHeading}><Icon name="bolt" /><h2>Acciones rápidas</h2></div><div className={styles.quickList}>{quickActions.map((action) => <button key={action.label} onClick={() => runAction(action.label, action.target)}><Icon name={action.icon} /><span>{action.label}</span><Icon name="arrow-right" /></button>)}</div></section>
        </div>

        <div className={styles.insightsGrid}>
          <section className={`${styles.panel} ${styles.alertsPanel}`}><div className={styles.smallPanelTitle}><Icon name="bell" /><div><h2>Alertas del catálogo</h2><p>Aspectos que requieren tu atención</p></div></div><div className={styles.alertList}>{alerts.map((alert) => <button key={alert.label} onClick={() => router.push(alert.tone === "red" ? "/inventario" : "/productos")}><span className={`${styles.alertIcon} ${styles[`alert${alert.tone}`]}`}><Icon name={alert.icon} /></span><span><b>{alert.count}</b> {alert.label}</span><i className={`${styles.alertCount} ${styles[`alert${alert.tone}`]}`}>{alert.count}</i><Icon name="arrow-right" /></button>)}</div></section>

          <section className={`${styles.panel} ${styles.chartPanel}`}><div className={styles.chartHeader}><div><Icon name="trend" /><h2>Cambios de precio por semana</h2></div><button>Este mes <Icon name="chevron-down" /></button></div><div className={styles.chartWrap}><svg viewBox="0 0 500 185" role="img" aria-label={`Cambios de precio semanales: ${weekValues.join(", ")}`}><defs><linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#26d7b2" stopOpacity=".25" /><stop offset="1" stopColor="#26d7b2" stopOpacity="0" /></linearGradient></defs>{[30, 65, 100, 135].map((y) => <line key={y} x1="30" y1={y} x2="475" y2={y} className={styles.gridLine} />)}<path d={chartArea} fill="url(#chart-area)" /><path d={chartLine} className={styles.chartLine} />{chartPoints.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="5" className={styles.chartDot} /><text x={point.x} y={point.y - 13} className={styles.chartValue}>{point.value}</text><text x={point.x} y="169" className={styles.chartLabel}>{point.label}</text><text x={point.x} y="182" className={styles.chartDates}>{point.dates}</text></g>)}</svg></div></section>

          <section className={`${styles.panel} ${styles.statePanel}`}><div className={styles.stateTitle}><h2>Estado de productos</h2></div><div className={styles.stateContent}><div className={styles.donut}><div><span>Total</span><strong>{productState.total}</strong><small>productos</small></div></div><ul><li><i className={styles.activeDot} /><span>Activos</span><b>{productState.active}</b><small>({percent(productState.active)}%)</small></li><li><i className={styles.promoDot} /><span>En promoción</span><b>{productState.promotion}</b><small>({percent(productState.promotion)}%)</small></li><li><i className={styles.hiddenDot} /><span>Ocultos</span><b>{productState.hidden}</b><small>({percent(productState.hidden)}%)</small></li></ul></div><footer>Última actualización: ahora <Icon name="refresh" /></footer></section>
        </div>
      </main>
      {toast && <div className={styles.toast} role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
