"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { Icon, type IconName } from "@/components/inventory/icon";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import type { PaginatedResponse } from "@/components/products/products-data";
import { apiFetch } from "@/lib/api-client";
import styles from "./suppliers-dashboard.module.css";

type ApiStatus = "ACTIVE" | "PENDING" | "INACTIVE";
type SupplierStatus = "Activo" | "Pendiente" | "Inactivo";

type ApiSupplier = {
  id: string;
  name: string;
  contactName: string;
  contactRole: string | null;
  email: string | null;
  phone: string | null;
  creditDays: number;
  paymentMethod: string | null;
  status: ApiStatus;
  updatedAt: string;
  _count: { products: number };
};

type SupplierDetail = ApiSupplier & {
  products: Array<{ product: { id: string; name: string; sku: string; brand: string | null } }>;
};

type Supplier = {
  id: string;
  name: string;
  logo: string;
  color: string;
  contact: string;
  role: string;
  email: string;
  phone: string;
  products: number;
  last: string;
  terms: string;
  paymentMethod: string;
  status: SupplierStatus;
  apiStatus: ApiStatus;
  linkedProducts: Array<{ name: string; brand: string }>;
};

type SupplierDraft = {
  id?: string;
  name: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  creditDays: number;
  paymentMethod: string;
  status: ApiStatus;
};

const blankDraft: SupplierDraft = {
  name: "",
  contactName: "",
  contactRole: "Contacto principal",
  email: "",
  phone: "",
  creditDays: 30,
  paymentMethod: "Transferencia",
  status: "ACTIVE",
};

const statusLabels: Record<ApiStatus, SupplierStatus> = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  INACTIVE: "Inactivo",
};

const logoColors = ["#d7192d", "#d7921e", "#2b87d3", "#25a56a", "#8c54d9"];

function mapSupplier(supplier: ApiSupplier, detail?: SupplierDetail): Supplier {
  return {
    id: supplier.id,
    name: supplier.name,
    logo: supplier.name.slice(0, 4).toUpperCase(),
    color: logoColors[supplier.name.length % logoColors.length],
    contact: supplier.contactName,
    role: supplier.contactRole ?? "Contacto principal",
    email: supplier.email ?? "Sin correo",
    phone: supplier.phone ?? "Sin teléfono",
    products: supplier._count?.products ?? detail?.products.length ?? 0,
    last: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(supplier.updatedAt)),
    terms: `${supplier.creditDays} días`,
    paymentMethod: supplier.paymentMethod ?? "Sin especificar",
    status: statusLabels[supplier.status],
    apiStatus: supplier.status,
    linkedProducts: detail?.products.map(({ product }) => ({ name: product.name, brand: product.brand ?? "Sin marca" })) ?? [],
  };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

export function SuppliersDashboard() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | ApiStatus>("Todos");
  const [nav, setNav] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState<SupplierDraft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const choose = useCallback(async (supplier: Supplier) => {
    setSelected(supplier);
    try {
      const detail = await apiFetch<SupplierDetail>(`suppliers/${supplier.id}`);
      const enriched = mapSupplier({ ...detail, _count: { products: detail.products.length } }, detail);
      setItems((current) => current.map((item) => item.id === enriched.id ? enriched : item));
      setSelected(enriched);
    } catch (error) {
      setToast(message(error));
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    const response = await apiFetch<PaginatedResponse<ApiSupplier>>("suppliers?limit=100");
    const mapped = response.data.map((supplier) => mapSupplier(supplier));
    setItems(mapped);
    setSelected((current) => mapped.find((item) => item.id === current?.id) ?? mapped[0] ?? null);
    if (!selected && mapped[0]) void choose(mapped[0]);
  }, [choose, selected]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadSuppliers().catch((error) => setToast(message(error)));
    });
    return () => { cancelled = true; };
    // La carga inicial se ejecuta una sola vez; las mutaciones refrescan explícitamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => items.filter((item) =>
    (!query || [item.name, item.contact].some((value) => value.toLowerCase().includes(query.toLowerCase())))
    && (statusFilter === "Todos" || item.apiStatus === statusFilter),
  ), [items, query, statusFilter]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeCount = items.filter((item) => item.apiStatus === "ACTIVE").length;
  const pendingCount = items.filter((item) => item.apiStatus === "PENDING").length;
  const associatedProducts = items.reduce((sum, item) => sum + item.products, 0);
  const metrics: { label: string; value: string; trend: string; icon: IconName; tone: string }[] = [
    { label: "Proveedores activos", value: String(activeCount), trend: "Datos sincronizados", icon: "users", tone: "teal" },
    { label: "Productos asociados", value: String(associatedProducts), trend: "Relaciones actuales", icon: "package", tone: "green" },
    { label: "Proveedores totales", value: String(items.length), trend: "Catálogo comercial", icon: "tag", tone: "purple" },
    { label: "Contactos pendientes", value: String(pendingCount), trend: "Requieren seguimiento", icon: "mail", tone: "violet" },
  ];

  function openNew() {
    setDraft(blankDraft);
    setModal(true);
  }

  function openEdit(supplier: Supplier) {
    setDraft({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contact,
      contactRole: supplier.role,
      email: supplier.email === "Sin correo" ? "" : supplier.email,
      phone: supplier.phone === "Sin teléfono" ? "" : supplier.phone,
      creditDays: Number.parseInt(supplier.terms, 10) || 0,
      paymentMethod: supplier.paymentMethod === "Sin especificar" ? "" : supplier.paymentMethod,
      status: supplier.apiStatus,
    });
    setModal(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      contactName: draft.contactName.trim(),
      contactRole: draft.contactRole.trim() || undefined,
      email: draft.email.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      creditDays: draft.creditDays,
      paymentMethod: draft.paymentMethod.trim() || undefined,
      status: draft.status,
    };
    try {
      if (draft.id) {
        await apiFetch(`suppliers/${draft.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("suppliers", { method: "POST", body: JSON.stringify(payload) });
      }
      await loadSuppliers();
      setModal(false);
      setToast(draft.id ? "Proveedor actualizado" : "Proveedor guardado en PostgreSQL");
    } catch (error) {
      setToast(message(error));
    } finally {
      setSaving(false);
    }
  }

  function remove(supplier: Supplier) {
    setSupplierToDelete(supplier);
  }

  async function confirmRemove() {
    if (!supplierToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`suppliers/${supplierToDelete.id}`, { method: "DELETE" });
      setSelected(null);
      await loadSuppliers();
      setSupplierToDelete(null);
      setToast("Proveedor eliminado");
    } catch (error) {
      setToast(message(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <ManagementSidebar active="Proveedores" open={nav} onClose={() => setNav(false)} onNotify={setToast} />
      <main>
        <header className={styles.header}><button className={styles.mobile} aria-label="Abrir menú" onClick={() => setNav(true)}><Icon name="menu" /></button><div><p>Operación de tienda</p><h1>Proveedores</h1><span>Gestiona proveedores y productos asociados con datos persistentes.</span></div><button className={styles.primary} onClick={openNew}><Icon name="plus" />Nuevo proveedor</button></header>
        <section className={styles.metrics}>{metrics.map((metric) => <article key={metric.label}><i className={styles[`tone${metric.tone}`]}><Icon name={metric.icon} /></i><div><span>{metric.label}</span><b>{metric.value}</b><small><Icon name="check" />{metric.trend}</small></div></article>)}</section>
        <section className={styles.tablePanel}>
          <div className={styles.toolbar}><label><Icon name="search" /><input aria-label="Buscar proveedor" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar proveedor por nombre o contacto..." /></label><select aria-label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="Todos">Estado: Todos</option><option value="ACTIVE">Activos</option><option value="PENDING">Pendientes</option><option value="INACTIVE">Inactivos</option></select><span><button onClick={() => setToast("Importación pendiente")}><Icon name="download" />Importar</button><button onClick={() => setToast("Exportación pendiente")}><Icon name="download" />Exportar</button><button onClick={() => setToast("Actualización masiva pendiente")}><Icon name="list" />Actualización masiva</button></span></div>
          <div className={styles.scroller}><table><thead><tr><th>Proveedor</th><th>Contacto</th><th>Correo / Teléfono</th><th>Productos asociados</th><th>Última actividad</th><th>Condiciones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className={selected?.id === item.id ? styles.selected : ""} onClick={() => void choose(item)}><td><span className={styles.supplier}><i style={{ background: item.color }}>{item.logo}</i><b>{item.name}</b></span></td><td>{item.contact}<small>{item.role}</small></td><td>{item.email}<small>{item.phone}</small></td><td>{item.products}</td><td>{item.last}<small>Sincronizado</small></td><td>{item.terms}<small>{item.paymentMethod}</small></td><td><span className={styles.pill}><i />{item.status}</span></td><td><div className={styles.actions}><button aria-label={`Editar ${item.name}`} onClick={(event) => { event.stopPropagation(); openEdit(item); }}><Icon name="edit" /></button><button aria-label={`Ver ${item.name}`}><Icon name="eye" /></button><button aria-label={`Contactar ${item.name}`}><Icon name="mail" /></button><button aria-label={`Eliminar ${item.name}`} onClick={(event) => { event.stopPropagation(); void remove(item); }}><Icon name="trash" /></button></div></td></tr>)}</tbody></table></div>
          <footer>Mostrando {filtered.length} de {items.length} proveedores <span><button>‹</button><button className={styles.page}>1</button><button>›</button></span></footer>
        </section>
        {selected && <section className={styles.detail}><nav><button className={styles.activeTab}><Icon name="users" />Detalle del proveedor</button><button><Icon name="package" />Productos asociados</button><button><Icon name="clock" />Historial de precios</button></nav><div className={styles.detailBody}><header><i style={{ background: selected.color }}>{selected.logo}</i><h2>{selected.name}</h2><span>{selected.status}</span><div><button onClick={() => openEdit(selected)}><Icon name="edit" />Editar</button><button onClick={() => setToast("La vinculación se realiza al editar productos")}><Icon name="link" />Vincular productos</button><button onClick={() => setToast("Solicitud preparada")}><Icon name="send" />Solicitar actualización</button></div></header><div className={styles.detailGrid}><section><h3>Contacto principal</h3><b>{selected.contact}</b><small>{selected.role}</small><p>Correo <span>{selected.email}</span></p><p>Teléfono <span>{selected.phone}</span></p><p>Última actividad <span>{selected.last}</span></p></section><section><h3>Marcas asociadas</h3><div className={styles.chips}>{selected.linkedProducts.length ? [...new Set(selected.linkedProducts.map((product) => product.brand))].map((brand) => <b key={brand}>{brand}</b>) : <span>Sin productos vinculados</span>}</div><h3>Productos</h3><div className={styles.chips}>{selected.linkedProducts.slice(0, 4).map((product) => <span key={product.name}>{product.name}</span>)}</div></section><section><h3>Condiciones comerciales</h3><p>Plazo de crédito <b>{selected.terms}</b></p><p>Tipo de pago <b>{selected.paymentMethod}</b></p><p>Productos asociados <b>{selected.products}</b></p></section><section><h3>Actividad</h3><p>Información actualizada <b>{selected.last}</b></p><p>Estado comercial <b>{selected.status}</b></p></section></div></div></section>}
      </main>
      {modal && <div className={styles.backdrop}><form className={styles.modal} onSubmit={(event) => void save(event)}><header><h2>{draft.id ? "Editar proveedor" : "Nuevo proveedor"}</h2><button type="button" onClick={() => setModal(false)}><Icon name="close" /></button></header><label><span>Nombre</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label><label><span>Contacto</span><input value={draft.contactName} onChange={(event) => setDraft({ ...draft, contactName: event.target.value })} required /></label><label><span>Cargo</span><input value={draft.contactRole} onChange={(event) => setDraft({ ...draft, contactRole: event.target.value })} /></label><label><span>Correo</span><input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label><label><span>Teléfono</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label><label><span>Días de crédito</span><input type="number" min="0" value={draft.creditDays} onChange={(event) => setDraft({ ...draft, creditDays: Number(event.target.value) })} /></label><label><span>Forma de pago</span><input value={draft.paymentMethod} onChange={(event) => setDraft({ ...draft, paymentMethod: event.target.value })} /></label><label><span>Estado</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ApiStatus })}><option value="ACTIVE">Activo</option><option value="PENDING">Pendiente</option><option value="INACTIVE">Inactivo</option></select></label><footer><button type="button" onClick={() => setModal(false)}>Cancelar</button><button disabled={saving}><Icon name="check" />{saving ? "Guardando..." : "Guardar"}</button></footer></form></div>}
      {supplierToDelete && (
        <DeleteConfirmDialog
          subject={supplierToDelete.name}
          title="Eliminar proveedor"
          description={<>¿Seguro que deseas eliminar <strong>{supplierToDelete.name}</strong>? Se quitará del catálogo comercial y de las relaciones configuradas.</>}
          loading={deleting}
          onCancel={() => setSupplierToDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {toast && <div className={styles.toast} role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
