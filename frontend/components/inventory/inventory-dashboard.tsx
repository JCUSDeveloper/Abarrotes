"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { apiFetch } from "@/lib/api-client";
import {
  type ApiInventory,
  type InventorySummary,
  mapInventory,
  type OperationalProduct,
  type OperationalStatus,
  toProductStatus,
} from "./operational-inventory-data";
import { Icon, type IconName } from "./icon";
import styles from "./inventory-dashboard.module.css";

const PAGE_SIZE = 8;

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

const emptySummary: InventorySummary = {
  visibleProducts: 0,
  pendingReview: 0,
  bulkChangesThisMonth: 0,
  activePriceRules: 0,
  trends: {
    visibleProducts: 0,
    pendingReview: 0,
    bulkChanges: 0,
    activePriceRules: 0,
  },
};

function currency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

function statusClass(status: OperationalStatus) {
  if (status === "Activo") return styles.statusActive;
  if (status === "Promoción") return styles.statusPromotion;
  return styles.statusHidden;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

function trendLabel(value: number) {
  if (value > 0) return `↑ ${value} vs. mes anterior`;
  if (value < 0) return `↓ ${Math.abs(value)} vs. mes anterior`;
  return "— sin cambios";
}

function isWithinPeriod(dateValue: string, period: string) {
  if (period === "Todas") return true;
  const value = new Date(dateValue);
  const now = new Date();
  if (period === "Hoy") {
    return value.toDateString() === now.toDateString();
  }
  if (period === "Esta semana") {
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return value >= start;
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return value >= start;
}

export function InventoryDashboard() {
  const router = useRouter();
  const initializedSelection = useRef(false);
  const [products, setProducts] = useState<OperationalProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [supplierFilter, setSupplierFilter] = useState("Todos");
  const [editedFilter, setEditedFilter] = useState("Todas");
  const [page, setPage] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [sortAscending, setSortAscending] = useState<boolean | null>(null);
  const [changeType, setChangeType] = useState<"percentage" | "amount">("percentage");
  const [adjustment, setAdjustment] = useState(5);
  const [rounding, setRounding] = useState(0.1);
  const [newStatus, setNewStatus] = useState<"Sin cambio" | OperationalStatus>("Sin cambio");
  const [reason, setReason] = useState("Actualización de precios");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadInventory = useCallback(async () => {
    const [inventoryResponse, summaryResponse] = await Promise.all([
      apiFetch<ApiInventory[]>("inventory"),
      apiFetch<InventorySummary>("inventory/summary"),
    ]);
    const mapped = inventoryResponse.map(mapInventory);
    setProducts(mapped);
    setSummary(summaryResponse);
    setSelectedIds((current) => {
      const valid = new Set([...current].filter((id) => mapped.some((item) => item.id === id)));
      if (!initializedSelection.current && valid.size === 0) {
        mapped.slice(0, 5).forEach((item) => valid.add(item.id));
        initializedSelection.current = true;
      }
      return valid;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadInventory()
        .catch((error) => setToast(message(error)))
        .finally(() => setLoading(false));
    });
    return () => { cancelled = true; };
  }, [loadInventory]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );
  const suppliers = useMemo(
    () => [...new Set(products.map((product) => product.supplier))].sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return products
      .filter((product) => {
        const matchesSearch = !normalized || [product.name, product.sku].some((value) =>
          value.toLocaleLowerCase("es").includes(normalized),
        );
        return matchesSearch
          && (statusFilter === "Todos" || product.status === statusFilter)
          && (categoryFilter === "Todas" || product.category === categoryFilter)
          && (supplierFilter === "Todos" || product.supplier === supplierFilter)
          && isWithinPeriod(product.lastEditedAt, editedFilter);
      })
      .sort((first, second) => sortAscending === null
        ? 0
        : sortAscending
          ? first.name.localeCompare(second.name, "es")
          : second.name.localeCompare(first.name, "es"));
  }, [categoryFilter, editedFilter, products, query, sortAscending, statusFilter, supplierFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const firstVisible = filteredProducts.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisible = Math.min(safePage * PAGE_SIZE, filteredProducts.length);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedProducts = products.filter((product) => selectedIds.has(product.id));
  const allPageSelected = pageProducts.length > 0
    && pageProducts.every((product) => selectedIds.has(product.id));

  const metrics: { label: string; value: number; trend: number; icon: IconName; tone: string }[] = [
    { label: "Productos visibles", value: summary.visibleProducts, trend: summary.trends.visibleProducts, icon: "package", tone: "teal" },
    { label: "Pendientes de revisión", value: summary.pendingReview, trend: summary.trends.pendingReview, icon: "clock", tone: "amber" },
    { label: "Cambios masivos este mes", value: summary.bulkChangesThisMonth, trend: summary.trends.bulkChanges, icon: "tag", tone: "purple" },
    { label: "Reglas de precio activas", value: summary.activePriceRules, trend: summary.trends.activePriceRules, icon: "shield", tone: "green" },
  ];

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllPage() {
    setSelectedIds((current) => {
      const next = new Set(current);
      pageProducts.forEach((product) => allPageSelected ? next.delete(product.id) : next.add(product.id));
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("Todos");
    setCategoryFilter("Todas");
    setSupplierFilter("Todos");
    setEditedFilter("Todas");
    setPage(1);
  }

  async function updateStatus(product: OperationalProduct, status: OperationalStatus) {
    try {
      await apiFetch(`products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: toProductStatus(status) }),
      });
      await loadInventory();
      setToast(`Estado actualizado: ${status}`);
    } catch (error) {
      setToast(message(error));
    }
  }

  async function deleteProduct(product: OperationalProduct) {
    if (!window.confirm(`¿Eliminar ${product.name} del inventario?`)) return;
    try {
      await apiFetch(`products/${product.id}`, { method: "DELETE" });
      await loadInventory();
      setToast("Producto eliminado del inventario");
    } catch (error) {
      setToast(message(error));
    }
  }

  function calculateAdjustedPrice(price: number) {
    const adjusted = changeType === "percentage"
      ? price * (1 + adjustment / 100)
      : price + adjustment;
    return Math.max(0, Math.round(adjusted / rounding) * rounding);
  }

  async function applyBatchChanges() {
    if (selectedIds.size === 0) {
      setToast("Selecciona al menos un producto");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<{ updated: number }>("inventory/bulk-price", {
        method: "POST",
        body: JSON.stringify({
          productIds: [...selectedIds],
          mode: changeType === "percentage" ? "PERCENTAGE" : "AMOUNT",
          adjustment,
          rounding,
          status: newStatus === "Sin cambio" ? undefined : toProductStatus(newStatus),
          reason: reason.trim() || undefined,
        }),
      });
      await loadInventory();
      setPreviewOpen(false);
      setToast(`Cambios guardados para ${selectedIds.size} productos`);
    } catch (error) {
      setToast(message(error));
    } finally {
      setSaving(false);
    }
  }

  function exportInventory() {
    const rows = [
      ["Producto", "SKU", "Categoría", "Precio actual", "Precio sugerido", "Responsable", "Estado"],
      ...products.map((product) => [
        product.name,
        product.sku,
        product.category,
        product.currentPrice.toFixed(2),
        product.suggestedPrice.toFixed(2),
        product.responsible,
        product.status,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Inventario exportado");
  }

  const pagination = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : [1, 2, 3, -1, pageCount];

  return (
    <div className={styles.appShell}>
      <button className={`${styles.navScrim} ${navOpen ? styles.navScrimVisible : ""}`} aria-label="Cerrar menú" onClick={() => setNavOpen(false)} />
      <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}><span className={styles.brandMark}><Icon name="cart" /></span><span>Abarrotes</span><button aria-label="Cerrar navegación" onClick={() => setNavOpen(false)}><Icon name="arrow-left" /></button></div>
        <nav className={styles.navigation} aria-label="Navegación principal">
          {navigation.map((item) => item.href
            ? <Link key={item.label} href={item.href} className={`${styles.navItem} ${item.label === "Inventario" ? styles.navItemActive : ""}`} onClick={() => setNavOpen(false)}><Icon name={item.icon} /><span>{item.label}</span></Link>
            : <button key={item.label} className={styles.navItem} onClick={() => setToast(`${item.label}: módulo pendiente`)}><Icon name={item.icon} /><span>{item.label}</span></button>)}
        </nav>
        <button className={styles.storeCard} onClick={() => setToast("Sucursal Tienda Centro seleccionada")}><span className={styles.storeIcon}><Icon name="store" /></span><span><strong>Tienda Centro</strong><small>Abarrotes</small></span><Icon name="chevron-down" /></button>
        <form action={logout} className={styles.logoutForm}><button type="submit"><Icon name="logout" /> Cerrar sesión</button></form>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <button className={styles.mobileMenu} aria-label="Abrir menú" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <div><p>Operación de tienda</p><h1>Inventario</h1><span>Administra el catálogo operativo y aplica cambios masivos de producto y precio.</span></div>
          <div className={styles.headerActions}><button onClick={exportInventory}><Icon name="upload" /> Exportar</button><button onClick={() => document.getElementById("actualizacion-lote")?.scrollIntoView({ behavior: "smooth" })}><Icon name="list" /> Actualización masiva</button></div>
        </header>

        <section className={styles.metricsGrid} aria-label="Métricas de inventario">
          {metrics.map((metric) => <article className={styles.metricCard} key={metric.label}><span className={`${styles.metricIcon} ${styles[`tone${metric.tone}`]}`}><Icon name={metric.icon} /></span><div><p>{metric.label}</p><strong>{metric.value}</strong><small className={metric.trend < 0 ? styles.negativeTrend : ""}>{trendLabel(metric.trend)}</small></div></article>)}
        </section>

        <section className={styles.inventoryPanel}>
          <div className={styles.filters}>
            <label className={styles.searchBox}><Icon name="search" /><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Buscar producto por nombre o SKU..." aria-label="Buscar producto" /></label>
            <label className={styles.selectField}><span>Estado</span><select value={statusFilter} onChange={(event) => updateFilter(setStatusFilter, event.target.value)}><option>Todos</option><option>Activo</option><option>Promoción</option><option>Oculto</option></select></label>
            <label className={styles.selectField}><span>Categoría</span><select value={categoryFilter} onChange={(event) => updateFilter(setCategoryFilter, event.target.value)}><option>Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.selectField}><span>Proveedor</span><select value={supplierFilter} onChange={(event) => updateFilter(setSupplierFilter, event.target.value)}><option>Todos</option>{suppliers.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.selectField}><span>Última edición</span><select value={editedFilter} onChange={(event) => updateFilter(setEditedFilter, event.target.value)}><option>Todas</option><option>Hoy</option><option>Esta semana</option><option>Este mes</option></select></label>
            <button className={styles.clearButton} onClick={clearFilters}><Icon name="filter" /> Limpiar filtros</button>
          </div>

          <div className={styles.tableScroller}>
            <table className={styles.inventoryTable}>
              <thead><tr><th><input type="checkbox" checked={allPageSelected} onChange={toggleAllPage} aria-label="Seleccionar todos" /></th><th><button onClick={() => setSortAscending((current) => current === null ? true : !current)}>Producto <Icon name="sort" /></button></th><th>SKU</th><th>Categoría</th><th>Precio actual</th><th>Precio sugerido</th><th>Última edición <Icon name="sort" /></th><th>Responsable</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{pageProducts.map((product) => <tr key={product.id} className={selectedIds.has(product.id) ? styles.selectedRow : ""}>
                <td><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelected(product.id)} aria-label={`Seleccionar ${product.name}`} /></td>
                <td><button className={styles.productCell} onClick={() => router.push("/productos")}><span style={{ background: product.iconTone }}>{product.icon}</span>{product.name}</button></td>
                <td>{product.sku}</td><td>{product.category}</td><td>{currency(product.currentPrice)}</td>
                <td><span className={product.changePercent > 0 ? styles.suggestedPrice : styles.noChange}>{currency(product.suggestedPrice)} <small><Icon name={product.changePercent > 0 ? "arrow-up" : "minus"} />{Math.abs(product.changePercent).toFixed(1)}%</small></span></td>
                <td>{product.lastEdited}</td><td><span className={styles.responsible}><i>{product.initials}</i>{product.responsible}</span></td>
                <td><span className={`${styles.statusPill} ${statusClass(product.status)}`}><i />{product.status}</span></td>
                <td><div className={styles.rowActions}><button aria-label={`Editar ${product.name}`} title="Editar" onClick={() => router.push("/productos")}><Icon name="edit" /></button><button aria-label={`Cambiar promoción de ${product.name}`} title="Promoción" onClick={() => void updateStatus(product, product.status === "Promoción" ? "Activo" : "Promoción")}><Icon name="tag" /></button><button aria-label={`Cambiar visibilidad de ${product.name}`} title="Visibilidad" onClick={() => void updateStatus(product, product.status === "Oculto" ? "Activo" : "Oculto")}><Icon name={product.status === "Oculto" ? "eye" : "eye-off"} /></button><button className={styles.deleteAction} aria-label={`Eliminar ${product.name}`} title="Eliminar" onClick={() => void deleteProduct(product)}><Icon name="trash" /></button><button aria-label={`Más acciones para ${product.name}`} title="Más acciones" onClick={() => setToast(`${product.name}: más acciones`)}><Icon name="more" /></button></div></td>
              </tr>)}</tbody>
            </table>
            {(loading || pageProducts.length === 0) && <div className={styles.emptyState}><Icon name={loading ? "clock" : "search"} /><strong>{loading ? "Cargando inventario..." : "Sin resultados"}</strong><span>{loading ? "Consultando PostgreSQL" : "Ajusta los filtros."}</span></div>}
          </div>

          <footer className={styles.tableFooter}><span>Mostrando {firstVisible} a {lastVisible} de {filteredProducts.length} productos</span><div><button aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage(Math.max(1, safePage - 1))}><Icon name="arrow-left" /></button>{pagination.map((item, index) => item === -1 ? <span key={`ellipsis-${index}`}>…</span> : <button key={item} className={safePage === item ? styles.currentPage : ""} onClick={() => setPage(item)}>{item}</button>)}<button aria-label="Página siguiente" disabled={safePage === pageCount} onClick={() => setPage(Math.min(pageCount, safePage + 1))}><Icon name="arrow-right" /></button></div></footer>
        </section>

        <section className={styles.batchPanel} id="actualizacion-lote">
          <div className={styles.batchSelection}>
            <div className={styles.batchTitle}><Icon name="bolt" /><div><h2>Actualización por lote</h2><p>Selecciona productos y aplica cambios masivos.</p></div><span>{selectedProducts.length} seleccionados</span></div>
            <div className={styles.selectedList}>{selectedProducts.length ? selectedProducts.map((product) => <div key={product.id}><input type="checkbox" checked readOnly aria-label={`${product.name} seleccionado`} /><span style={{ background: product.iconTone }}>{product.icon}</span><strong>{product.name}</strong><small>{product.sku}</small><b>{currency(product.currentPrice)}</b><button aria-label={`Quitar ${product.name}`} onClick={() => toggleSelected(product.id)}><Icon name="close" /></button></div>) : <p className={styles.emptySelection}>Selecciona productos en la tabla para preparar una actualización.</p>}</div>
          </div>

          <div className={styles.batchForm}>
            <label><span>Tipo de cambio</span><select value={changeType} onChange={(event) => setChangeType(event.target.value as typeof changeType)}><option value="percentage">Ajuste porcentual</option><option value="amount">Ajuste por monto</option></select></label>
            <label><span>Ajuste (% o monto)</span><div className={styles.adjustmentInput}><input type="number" value={adjustment} onChange={(event) => setAdjustment(Number(event.target.value))} /><i>{changeType === "percentage" ? "%" : "$"}</i></div></label>
            <label><span>Redondeo</span><select value={rounding} onChange={(event) => setRounding(Number(event.target.value))}><option value="0.1">A 0.10</option><option value="0.5">A 0.50</option><option value="1">A 1.00</option></select></label>
            <label><span>Nuevo estado (opcional)</span><select value={newStatus} onChange={(event) => setNewStatus(event.target.value as typeof newStatus)}><option>Sin cambio</option><option>Activo</option><option>Promoción</option><option>Oculto</option></select></label>
            <label className={styles.reasonField}><span>Motivo (opcional)</span><input value={reason} onChange={(event) => setReason(event.target.value)} /></label>
            <div className={styles.batchActions}><button onClick={() => selectedProducts.length ? setPreviewOpen(true) : setToast("Selecciona al menos un producto")}><Icon name="eye" /> Vista previa</button><button onClick={() => void applyBatchChanges()} disabled={saving || !selectedProducts.length}><Icon name="check" /> {saving ? "Aplicando..." : "Aplicar cambios"}</button><small>Se aplicarán cambios a los {selectedProducts.length} productos seleccionados.</small></div>
          </div>
        </section>
      </main>

      {previewOpen && <div className={styles.previewBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><section className={styles.previewModal} role="dialog" aria-modal="true" aria-labelledby="preview-title"><header><div><p>Actualización masiva</p><h2 id="preview-title">Vista previa de cambios</h2></div><button aria-label="Cerrar vista previa" onClick={() => setPreviewOpen(false)}><Icon name="close" /></button></header><div className={styles.previewList}>{selectedProducts.map((product) => <div key={product.id}><span style={{ background: product.iconTone }}>{product.icon}</span><strong>{product.name}<small>{product.sku}</small></strong><p>{currency(product.currentPrice)} <Icon name="arrow-right" /> <b>{currency(calculateAdjustedPrice(product.currentPrice))}</b></p></div>)}</div><footer><button onClick={() => setPreviewOpen(false)}>Cancelar</button><button onClick={() => void applyBatchChanges()} disabled={saving}><Icon name="check" /> Confirmar cambios</button></footer></section></div>}
      {toast && <div className={styles.toast} role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
