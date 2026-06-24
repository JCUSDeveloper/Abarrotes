"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { Icon, type IconName } from "@/components/inventory/icon";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse } from "@/components/products/products-data";
import styles from "./categories-dashboard.module.css";

type ApiStatus = "ACTIVE" | "PROMOTION" | "HIDDEN";
type Status = "Activa" | "Promoción" | "Oculta";

type ApiCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: ApiStatus;
  updatedAt: string;
  _count: { products: number };
  priceRules: Array<{ id: string; name: string; active: boolean }>;
};

type Category = {
  id?: string;
  name: string;
  description: string;
  products: number;
  status: Status;
  apiStatus: ApiStatus;
  updated: string;
  icon: string;
  color: string;
  rules: number;
};

const blankCategory: Category = {
  name: "",
  description: "",
  products: 0,
  status: "Activa",
  apiStatus: "ACTIVE",
  updated: "Sin publicar",
  icon: "🏷️",
  color: "#25d3b0",
  rules: 0,
};

const statusLabels: Record<ApiStatus, Status> = {
  ACTIVE: "Activa",
  PROMOTION: "Promoción",
  HIDDEN: "Oculta",
};

function toApiStatus(status: Status): ApiStatus {
  if (status === "Promoción") return "PROMOTION";
  if (status === "Oculta") return "HIDDEN";
  return "ACTIVE";
}

function mapCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    products: category._count.products,
    status: statusLabels[category.status],
    apiStatus: category.status,
    updated: new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(category.updatedAt)),
    icon: category.icon.length <= 4 && category.icon !== "tag" ? category.icon : "🏷️",
    color: category.color,
    rules: category.priceRules.length,
  };
}

function statusClass(status: Status) {
  return status === "Activa"
    ? styles.active
    : status === "Promoción"
      ? styles.promo
      : styles.hidden;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

export function CategoriesDashboard() {
  const [items, setItems] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category>(blankCategory);
  const [draft, setDraft] = useState<Category>(blankCategory);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | Status>("Todos");
  const [nav, setNav] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    const response = await apiFetch<PaginatedResponse<ApiCategory>>("categories?limit=100");
    const mapped = response.data.map(mapCategory);
    setItems(mapped);
    setSelected((current) => mapped.find((item) => item.id === current.id) ?? mapped[0] ?? blankCategory);
    setDraft((current) => mapped.find((item) => item.id === current.id) ?? mapped[0] ?? blankCategory);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadCategories()
        .catch((error) => setToast(message(error)))
        .finally(() => setLoading(false));
    });
    return () => { cancelled = true; };
  }, [loadCategories]);

  const filtered = useMemo(() => items.filter((item) =>
    (!query || item.name.toLowerCase().includes(query.toLowerCase()))
    && (filter === "Todos" || item.status === filter),
  ), [filter, items, query]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeCount = items.filter((item) => item.apiStatus === "ACTIVE").length;
  const ruleCount = items.filter((item) => item.rules > 0).length;
  const uncategorizedProducts = 0;
  const metrics: { label: string; value: string; trend: string; icon: IconName; tone: string }[] = [
    { label: "Categorías totales", value: String(items.length), trend: "Datos sincronizados", icon: "tag", tone: "teal" },
    { label: "Activas", value: String(activeCount), trend: "Disponibles", icon: "check", tone: "green" },
    { label: "Con reglas de precio", value: String(ruleCount), trend: "Reglas activas", icon: "tag", tone: "purple" },
    { label: "Productos sin categoría", value: String(uncategorizedProducts), trend: "Sin cambios", icon: "box", tone: "blue" },
  ];

  function choose(category: Category) {
    setSelected(category);
    setDraft(category);
  }

  function create() {
    setSelected(blankCategory);
    setDraft(blankCategory);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      color: draft.color,
      icon: draft.icon,
      status: toApiStatus(draft.status),
    };
    try {
      const saved = draft.id
        ? await apiFetch<ApiCategory>(`categories/${draft.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiFetch<ApiCategory>("categories", { method: "POST", body: JSON.stringify(payload) });
      await loadCategories();
      const normalized = mapCategory({ ...saved, _count: saved._count ?? { products: 0 }, priceRules: saved.priceRules ?? [] });
      setSelected(normalized);
      setDraft(normalized);
      setToast(draft.id ? "Categoría actualizada" : "Categoría guardada en PostgreSQL");
    } catch (error) {
      setToast(message(error));
    } finally {
      setSaving(false);
    }
  }

  function remove(category: Category) {
    if (!category.id) return;
    setCategoryToDelete(category);
  }

  async function confirmRemove() {
    if (!categoryToDelete?.id) return;
    setDeleting(true);
    try {
      await apiFetch(`categories/${categoryToDelete.id}`, { method: "DELETE" });
      await loadCategories();
      setCategoryToDelete(null);
      setToast("Categoría eliminada");
    } catch (error) {
      setToast(message(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <ManagementSidebar active="Categorías" open={nav} onClose={() => setNav(false)} onNotify={setToast} />
      <main>
        <header className={styles.header}><button className={styles.mobile} onClick={() => setNav(true)} aria-label="Abrir menú"><Icon name="menu" /></button><div><p>Operación de tienda</p><h1>Categorías</h1><span>Organiza el catálogo con información persistida en PostgreSQL.</span></div><button className={styles.primary} onClick={create}><Icon name="plus" />Nueva categoría</button></header>
        <section className={styles.metrics}>{metrics.map((metric) => <article key={metric.label}><i className={styles[`tone${metric.tone}`]}><Icon name={metric.icon} /></i><div><span>{metric.label}</span><b>{metric.value}</b><small><Icon name={metric.trend === "Sin cambios" ? "minus" : "check"} />{metric.trend}</small></div></article>)}</section>
        <div className={styles.workspace}>
          <section className={styles.tablePanel}>
            <div className={styles.toolbar}><label><Icon name="search" /><input aria-label="Buscar categoría" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar categoría por nombre..." /></label><select aria-label="Filtrar por estado" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option>Todos</option><option>Activa</option><option>Promoción</option><option>Oculta</option></select><button onClick={() => setToast("Exportación pendiente")}><Icon name="download" />Exportar</button></div>
            <div className={styles.scroller}><table><thead><tr><th>Categoría</th><th>Productos asociados</th><th>Estado</th><th>Última actualización</th><th>Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className={selected.id === item.id ? styles.selected : ""}><td><button className={styles.categoryCell} onClick={() => choose(item)}><i style={{ background: item.color }}>{item.icon}</i><span><b>{item.name}</b><small>{item.description}</small></span></button></td><td>{item.products}</td><td><span className={`${styles.pill} ${statusClass(item.status)}`}><i />{item.status}</span></td><td>{item.updated}</td><td><div className={styles.actions}><button aria-label={`Editar ${item.name}`} onClick={() => choose(item)}><Icon name="edit" /></button><button aria-label={`Eliminar ${item.name}`} onClick={() => void remove(item)}><Icon name="trash" /></button><button aria-label={`Más acciones para ${item.name}`}><Icon name="more" /></button></div></td></tr>)}</tbody></table>{loading && <p>Cargando categorías...</p>}</div>
            <footer>Mostrando {filtered.length} de {items.length} categorías <span><button>‹</button><button className={styles.page}>1</button><button>›</button></span></footer>
          </section>
          <aside className={styles.editor}>
            <form onSubmit={(event) => void save(event)}><div className={styles.editorTitle}><Icon name="tag" /><div><h2>{draft.id ? "Edición de categoría" : "Nueva categoría"}</h2><p>Actualiza la información y reglas de la categoría.</p></div></div><label><span>Nombre *</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label><div className={styles.two}><label><span>Color</span><div className={styles.iconSelect}><i style={{ background: draft.color }}>{draft.icon}</i><input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></div></label><label><span>Estado</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}><option>Activa</option><option>Promoción</option><option>Oculta</option></select></label></div><label><span>Ícono</span><select value={draft.icon} onChange={(event) => setDraft({ ...draft, icon: event.target.value })}><option>🏷️</option><option>🍾</option><option>🧺</option><option>🥛</option><option>🍿</option><option>🥫</option></select></label><label><span>Descripción</span><textarea value={draft.description} maxLength={250} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /><small>{draft.description.length}/250 caracteres</small></label><div className={styles.rule}><header>Reglas de categoría <b>{draft.rules} activas</b></header><button type="button" onClick={() => setToast("El editor de reglas será el siguiente módulo")}><Icon name="clipboard" /><span><b>Reglas de precio</b><small>Administración desde la API</small></span><Icon name="arrow-right" /></button></div><footer><button type="button" onClick={() => setDraft(selected)}>Cancelar</button><button disabled={saving}><Icon name="check" />{saving ? "Guardando..." : "Guardar cambios"}</button></footer></form>
          </aside>
        </div>
      </main>
      {categoryToDelete && (
        <DeleteConfirmDialog
          subject={categoryToDelete.name}
          title="Eliminar categoría"
          description={<>¿Seguro que deseas eliminar <strong>{categoryToDelete.name}</strong>? Los productos asociados quedarán sin esta categoría.</>}
          loading={deleting}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {toast && <div className={styles.toast} role="status"><Icon name="check" />{toast}</div>}
    </div>
  );
}
