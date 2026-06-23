"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logout } from "@/app/actions/auth";
import { Icon, type IconName } from "@/components/inventory/icon";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  type ApiCategory,
  type ApiProduct,
  type ApiProductStatus,
  type ApiSupplier,
  type CatalogProduct,
  type CatalogStatus,
  type PaginatedResponse,
  toApiStatus,
  toCatalogProduct,
} from "./products-data";
import styles from "./products-dashboard.module.css";

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

type ProductDraft = {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: number;
  salePrice: number;
  status: CatalogStatus;
};

const blankDraft: ProductDraft = {
  name: "",
  sku: "",
  barcode: "",
  brand: "",
  categoryId: "",
  supplierId: "",
  purchasePrice: 0,
  salePrice: 0,
  status: "Activo",
};

function currency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}

function statusClass(status: CatalogStatus) {
  if (status === "Activo") return styles.statusActive;
  if (status === "Promoción") return styles.statusPromotion;
  return styles.statusHidden;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function ProductsDashboard() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState<"Todos" | ApiProductStatus>("Todos");
  const [supplier, setSupplier] = useState("Todos");
  const [ascending, setAscending] = useState<boolean | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [newPrice, setNewPrice] = useState(0);
  const [reason, setReason] = useState("Ajuste de precio");
  const [modalOpen, setModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(blankDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectedIdRef = useRef("");

  const loadProducts = useCallback(async () => {
    const response = await apiFetch<PaginatedResponse<ApiProduct>>("products?limit=100");
    const mapped = response.data.map(toCatalogProduct);
    setProducts(mapped);
    setTotal(response.meta.total);
    const selected = mapped.find((item) => item.id === selectedIdRef.current) ?? mapped[0];
    selectedIdRef.current = selected?.id ?? "";
    setSelectedId(selectedIdRef.current);
    setNewPrice(selected?.price ?? 0);
    return mapped;
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [categoryResponse, supplierResponse] = await Promise.all([
          apiFetch<PaginatedResponse<ApiCategory>>("categories?limit=100"),
          apiFetch<PaginatedResponse<ApiSupplier>>("suppliers?limit=100"),
        ]);
        if (!active) return;
        setCategories(categoryResponse.data);
        setSuppliers(supplierResponse.data);
        await loadProducts();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (active) setToast(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [loadProducts]);

  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0];

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return products
      .filter((product) => {
        const matchesQuery = !normalized || [product.name, product.sku].some((value) =>
          value.toLocaleLowerCase("es").includes(normalized),
        );
        return matchesQuery
          && (category === "Todas" || product.categoryId === category)
          && (status === "Todos" || product.apiStatus === status)
          && (supplier === "Todos" || product.supplierId === supplier);
      })
      .sort((first, second) => ascending === null
        ? 0
        : ascending
          ? first.name.localeCompare(second.name, "es")
          : second.name.localeCompare(first.name, "es"));
  }, [ascending, category, products, query, status, supplier]);

  const activeCount = products.filter((product) => product.apiStatus === "ACTIVE").length;

  const metrics: { label: string; value: string; trend: string; icon: IconName; tone: string }[] = [
    { label: "Productos totales", value: String(total), trend: "Catálogo sincronizado", icon: "package", tone: "teal" },
    { label: "Activos", value: String(activeCount), trend: "Disponibles para venta", icon: "check", tone: "green" },
    { label: "Proveedores", value: String(suppliers.length), trend: "Vinculados al catálogo", icon: "truck", tone: "purple" },
    { label: "Categorías", value: String(categories.length), trend: "Organización actual", icon: "folder", tone: "violet" },
  ];

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function openNewProduct() {
    setDraft({
      ...blankDraft,
      categoryId: categories[0]?.id ?? "",
      supplierId: suppliers[0]?.id ?? "",
    });
    setModalOpen(true);
  }

  function openEditProduct(product: CatalogProduct) {
    setDraft({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      brand: product.brand,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      purchasePrice: product.purchasePrice,
      salePrice: product.price,
      status: product.status,
    });
    setModalOpen(true);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      sku: draft.sku.trim(),
      barcode: draft.barcode.trim() || undefined,
      brand: draft.brand.trim() || undefined,
      categoryId: draft.categoryId || undefined,
      supplierId: draft.supplierId || undefined,
      purchasePrice: draft.purchasePrice,
      salePrice: draft.salePrice,
      status: toApiStatus(draft.status),
    };

    try {
      if (draft.id) {
        await apiFetch<ApiProduct>(`products/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<ApiProduct>("products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await loadProducts();
      setModalOpen(false);
      setToast(draft.id ? "Producto actualizado correctamente" : "Producto guardado en PostgreSQL");
    } catch (error) {
      setToast(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function updateQuickPrice() {
    if (!selectedProduct || newPrice < 0) {
      setToast("Ingresa un precio válido");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<ApiProduct>(`products/${selectedProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify({ salePrice: newPrice }),
      });
      await loadProducts();
      setToast(`Precio actualizado: ${selectedProduct.name} (${reason})`);
    } catch (error) {
      setToast(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(product: CatalogProduct) {
    const nextStatus: ApiProductStatus = product.apiStatus === "PROMOTION" ? "ACTIVE" : "PROMOTION";
    try {
      await apiFetch<ApiProduct>(`products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadProducts();
      setToast(nextStatus === "PROMOTION" ? "Promoción activada" : "Promoción retirada");
    } catch (error) {
      setToast(errorMessage(error));
    }
  }

  function deleteProduct(product: CatalogProduct) {
    setProductToDelete(product);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`products/${productToDelete.id}`, { method: "DELETE" });
      await loadProducts();
      setProductToDelete(null);
      setToast("Producto eliminado del catálogo");
    } catch (error) {
      setToast(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  function updateDraft<Key extends keyof ProductDraft>(key: Key, value: ProductDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className={styles.appShell}>
      <button className={`${styles.navScrim} ${navOpen ? styles.navScrimVisible : ""}`} aria-label="Cerrar menú" onClick={() => setNavOpen(false)} />

      <aside className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><Icon name="cart" /></span>
          <span>Abarrotes</span>
          <button aria-label="Cerrar navegación" onClick={() => setNavOpen(false)}><Icon name="arrow-left" /></button>
        </div>
        <nav className={styles.navigation} aria-label="Navegación principal">
          {navigation.map((item) => item.href ? (
            <Link key={item.label} href={item.href} className={`${styles.navItem} ${item.label === "Productos" ? styles.navItemActive : ""}`} onClick={() => setNavOpen(false)}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </Link>
          ) : (
            <button key={item.label} className={styles.navItem} onClick={() => { setNavOpen(false); setToast(`${item.label}: módulo pendiente`); }}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className={styles.storeCard} onClick={() => setToast("Sucursal Tienda Centro seleccionada")}>
          <span className={styles.storeIcon}><Icon name="store" /></span>
          <span><strong>Tienda Centro</strong><small>Abarrotes</small></span>
          <Icon name="chevron-down" />
        </button>
        <form action={logout} className={styles.logoutForm}>
          <button type="submit"><Icon name="logout" /> Cerrar sesión</button>
        </form>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <button className={styles.mobileMenu} aria-label="Abrir menú" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <div><p>Operación de tienda</p><h1>Productos</h1><span>Administra el catálogo y guarda los cambios directamente en PostgreSQL.</span></div>
          <button className={styles.primaryButton} onClick={openNewProduct} disabled={loading}><Icon name="plus" /> Nuevo producto</button>
        </header>

        <section className={styles.metricsGrid} aria-label="Resumen de productos">
          {metrics.map((metric) => (
            <article className={styles.metricCard} key={metric.label}>
              <span className={`${styles.metricIcon} ${styles[`tone${metric.tone}`]}`}><Icon name={metric.icon} /></span>
              <div><p>{metric.label}</p><strong>{metric.value}</strong><small><Icon name="check" /> {metric.trend}</small></div>
            </article>
          ))}
        </section>

        <section className={styles.catalogPanel}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto por nombre o SKU..." aria-label="Buscar producto" /></label>
            <label className={styles.selectField}><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Todas">Todas</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className={styles.selectField}><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="Todos">Todos</option><option value="ACTIVE">Activo</option><option value="PROMOTION">Promoción</option><option value="HIDDEN">Oculto</option></select></label>
            <label className={styles.selectField}><span>Proveedor</span><select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="Todos">Todos</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <div className={styles.toolbarActions}>
              <button onClick={() => setToast("Importación se implementará en el módulo de archivos")}><Icon name="upload" /> Importar</button>
              <button onClick={() => setToast("Exportación se implementará en el módulo de archivos")}><Icon name="download" /> Exportar</button>
              <button className={styles.outlineAction} onClick={() => setToast("Usa Inventario para la actualización masiva")}><Icon name="list" /> Actualización masiva</button>
            </div>
          </div>

          <div className={styles.tableScroller}>
            <table className={styles.productsTable}>
              <thead><tr><th><button onClick={() => setAscending((current) => current === null ? true : !current)}>Producto <Icon name="sort" /></button></th><th>SKU</th><th>Categoría</th><th>Proveedor</th><th>Precio actual</th><th>Última actualización</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><button className={styles.productCell} onClick={() => openEditProduct(product)}><span style={{ background: product.iconTone }}>{product.icon}</span>{product.name}</button></td>
                  <td>{product.sku}</td><td>{product.category}</td><td>{product.supplier}</td><td>{currency(product.price)}</td><td>{product.lastUpdated}</td>
                  <td><span className={`${styles.statusPill} ${statusClass(product.status)}`}><i />{product.status}</span></td>
                  <td><div className={styles.rowActions}><button aria-label={`Editar ${product.name}`} title="Editar" onClick={() => openEditProduct(product)}><Icon name="edit" /></button><button aria-label={`Cambiar promoción de ${product.name}`} title="Promoción" onClick={() => void togglePromotion(product)}><Icon name="tag" /></button><button className={styles.deleteAction} aria-label={`Eliminar ${product.name}`} title="Eliminar" onClick={() => void deleteProduct(product)}><Icon name="trash" /></button><button aria-label={`Más acciones para ${product.name}`} title="Más acciones"><Icon name="more" /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
            {(loading || filteredProducts.length === 0) && <div className={styles.emptyState}><Icon name={loading ? "clock" : "search"} /><strong>{loading ? "Cargando catálogo..." : "Sin resultados"}</strong><span>{loading ? "Consultando PostgreSQL" : "Ajusta la búsqueda o los filtros."}</span></div>}
          </div>

          <footer className={styles.tableFooter}><span>Mostrando {filteredProducts.length} de {total} productos</span><div><button aria-label="Página anterior"><Icon name="arrow-left" /></button><button className={styles.currentPage}>1</button><button aria-label="Página siguiente"><Icon name="arrow-right" /></button></div></footer>
        </section>

        <section className={styles.quickEdit} id="edicion-rapida">
          <div className={styles.quickTitle}><Icon name="bolt" /><div><h2>Edición rápida</h2><p>Cambia el precio de un producto al instante.</p></div></div>
          <label><span>Producto</span><select value={selectedId} onChange={(event) => { const id = event.target.value; selectedIdRef.current = id; setSelectedId(id); setNewPrice(products.find((product) => product.id === id)?.price ?? 0); }}>{products.map((product) => <option key={product.id} value={product.id}>{product.icon} {product.name}</option>)}</select></label>
          <label><span>Precio actual</span><input value={selectedProduct ? currency(selectedProduct.price) : "—"} readOnly /></label>
          <label><span>Nuevo precio</span><div className={styles.priceInput}><i>$</i><input type="number" min="0" step="0.01" value={newPrice} onChange={(event) => setNewPrice(Number(event.target.value))} /></div></label>
          <label><span>Motivo</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option>Ajuste de precio</option><option>Promoción</option><option>Cambio de proveedor</option><option>Corrección</option></select></label>
          <div className={styles.quickSave}><button onClick={() => void updateQuickPrice()} disabled={saving || !selectedProduct}><Icon name="check" /> Guardar cambios</button><small>El cambio se guarda en el historial.</small></div>
        </section>
      </main>

      {modalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <form onSubmit={(event) => void saveProduct(event)}>
              <header><div><p>{draft.id ? "Editar catálogo" : "Alta de producto"}</p><h2 id="product-modal-title">{draft.id ? "Editar producto" : "Nuevo producto"}</h2></div><button type="button" aria-label="Cerrar formulario" onClick={() => setModalOpen(false)}><Icon name="close" /></button></header>
              <div className={styles.modalBody}>
                <label className={styles.fullField}><span>Nombre del producto</span><input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} required autoFocus /></label>
                <label><span>SKU</span><input value={draft.sku} onChange={(event) => updateDraft("sku", event.target.value)} required /></label>
                <label><span>Código de barras</span><input value={draft.barcode} onChange={(event) => updateDraft("barcode", event.target.value)} /></label>
                <label><span>Marca</span><input value={draft.brand} onChange={(event) => updateDraft("brand", event.target.value)} /></label>
                <label><span>Categoría</span><select value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)} required>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>Proveedor</span><select value={draft.supplierId} onChange={(event) => updateDraft("supplierId", event.target.value)} required>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>Precio de compra</span><div className={styles.priceInput}><i>$</i><input type="number" min="0" step="0.01" value={draft.purchasePrice} onChange={(event) => updateDraft("purchasePrice", Number(event.target.value))} required /></div></label>
                <label><span>Precio de venta</span><div className={styles.priceInput}><i>$</i><input type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => updateDraft("salePrice", Number(event.target.value))} required /></div></label>
                <label className={styles.fullField}><span>Estado</span><select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as CatalogStatus)}><option>Activo</option><option>Promoción</option><option>Oculto</option></select></label>
              </div>
              <footer><button type="button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" disabled={saving}><Icon name="check" /> {saving ? "Guardando..." : "Guardar producto"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {productToDelete && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (!deleting && event.target === event.currentTarget) setProductToDelete(null);
          }}
        >
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" aria-describedby="delete-product-description">
            <div className={styles.confirmIcon}><Icon name="warning" /></div>
            <div className={styles.confirmCopy}>
              <p>Acción irreversible</p>
              <h2 id="delete-product-title">Eliminar producto</h2>
              <span id="delete-product-description">
                ¿Seguro que deseas eliminar <strong>{productToDelete.name}</strong> del catálogo? Esta acción lo retirará de productos, inventario y reportes relacionados.
              </span>
            </div>
            <footer>
              <button type="button" onClick={() => setProductToDelete(null)} disabled={deleting}>Cancelar</button>
              <button type="button" className={styles.dangerButton} onClick={() => void confirmDeleteProduct()} disabled={deleting}>
                <Icon name="trash" /> {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {toast && <div className={styles.toast} role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
