"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { Icon } from "@/components/inventory/icon";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import { apiFetch } from "@/lib/api-client";
import styles from "./users-dashboard.module.css";

type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  storeId: string | null;
  store: { id: string; name: string; code: string } | null;
  createdAt: string;
  updatedAt: string;
};
type UsersResponse = {
  data: ApiUser[];
  summary: { total: number; active: number; inactive: number; administrators: number };
};
type Draft = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
};

const blankDraft: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  active: true,
};
const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  EMPLOYEE: "Empleado",
};
const roleDescriptions: Record<Role, string> = {
  ADMIN: "Control total, usuarios y configuración",
  MANAGER: "Catálogo, inventario y reportes",
  EMPLOYEE: "Operación diaria y consulta",
};

function initials(user: Pick<ApiUser, "firstName" | "lastName">) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

export function UsersDashboard({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [summary, setSummary] = useState<UsersResponse["summary"]>({ total: 0, active: 0, inactive: 0, administrators: 0 });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch<UsersResponse>("users");
      setUsers(response.data);
      setSummary(response.summary);
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !term || `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(term);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? user.active : !user.active);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  function openCreate() {
    setDraft(blankDraft);
    setModalOpen(true);
  }

  function openEdit(user: ApiUser) {
    setDraft({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
    });
    setModalOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        role: draft.role,
        active: draft.active,
        ...(!draft.id || draft.password ? { password: draft.password } : {}),
      };
      await apiFetch(draft.id ? `users/${draft.id}` : "users", {
        method: draft.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      notify(draft.id ? "Usuario actualizado" : "Usuario creado correctamente");
      await load();
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(user: ApiUser, patch: Partial<Pick<ApiUser, "active" | "role">>) {
    try {
      await apiFetch<ApiUser>(`users/${user.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      notify(patch.role ? "Privilegios actualizados" : patch.active ? "Usuario activado" : "Usuario desactivado");
      await load();
    } catch (error) {
      notify(errorMessage(error));
    }
  }

  function remove(user: ApiUser) {
    setUserToDelete(user);
  }

  async function confirmRemove() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`users/${userToDelete.id}`, { method: "DELETE" });
      setUserToDelete(null);
      notify("Usuario eliminado");
      await load();
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const cards = [
    { label: "Usuarios totales", value: summary.total, icon: "users" as const, tone: "teal", detail: "Cuentas registradas" },
    { label: "Usuarios activos", value: summary.active, icon: "check" as const, tone: "green", detail: "Con acceso al sistema" },
    { label: "Usuarios inactivos", value: summary.inactive, icon: "eye-off" as const, tone: "amber", detail: "Acceso suspendido" },
    { label: "Administradores", value: summary.administrators, icon: "shield" as const, tone: "purple", detail: "Privilegios completos" },
  ];

  return (
    <div className={styles.shell}>
      <ManagementSidebar active="Usuarios" open={navOpen} onClose={() => setNavOpen(false)} onNotify={notify} />
      <main>
        <header className={styles.header}>
          <button className={styles.mobileMenu} aria-label="Abrir menú" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <div><p>ADMINISTRACIÓN DEL SISTEMA</p><h1>Usuarios</h1><span>Gestiona cuentas, accesos y privilegios del equipo.</span></div>
          <button className={styles.primary} onClick={openCreate}><Icon name="plus" />Nuevo usuario</button>
        </header>

        <section className={styles.metrics}>
          {cards.map((card) => <article key={card.label}><i className={styles[card.tone]}><Icon name={card.icon} /></i><div><span>{card.label}</span><b>{card.value}</b><small>{card.detail}</small></div></article>)}
        </section>

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo..." /></label>
            <select aria-label="Filtrar por rol" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}>
              <option value="ALL">Todos los privilegios</option><option value="ADMIN">Administradores</option><option value="MANAGER">Gerentes</option><option value="EMPLOYEE">Empleados</option>
            </select>
            <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="ALL">Todos los estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option>
            </select>
            <button onClick={() => { setQuery(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}><Icon name="filter" />Limpiar filtros</button>
          </div>

          <div className={styles.tableScroll}>
            <table>
              <thead><tr><th>Usuario</th><th>Privilegios</th><th>Sucursal</th><th>Estado</th><th>Última actualización</th><th>Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className={styles.empty}>Cargando usuarios...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className={styles.empty}>No hay usuarios que coincidan con los filtros.</td></tr> : filtered.map((user) => {
                  const ownAccount = user.id === currentUserId;
                  return <tr key={user.id} className={!user.active ? styles.inactiveRow : ""}>
                    <td><div className={styles.userCell}><i>{initials(user)}</i><span><b>{user.firstName} {user.lastName}{ownAccount && <em>Tú</em>}</b><small>{user.email}</small></span></div></td>
                    <td><select className={`${styles.roleSelect} ${styles[user.role.toLowerCase()]}`} value={user.role} disabled={ownAccount} onChange={(event) => void updateUser(user, { role: event.target.value as Role })}><option value="ADMIN">Administrador</option><option value="MANAGER">Gerente</option><option value="EMPLOYEE">Empleado</option></select><small className={styles.roleHint}>{roleDescriptions[user.role]}</small></td>
                    <td><span className={styles.store}><Icon name="store" />{user.store?.name ?? "Todas"}</span></td>
                    <td><span className={`${styles.status} ${user.active ? styles.active : styles.inactive}`}><i />{user.active ? "Activo" : "Inactivo"}</span></td>
                    <td>{new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(user.updatedAt))}</td>
                    <td><div className={styles.actions}><button title="Editar" onClick={() => openEdit(user)}><Icon name="edit" /></button><button title={user.active ? "Desactivar" : "Activar"} disabled={ownAccount} onClick={() => void updateUser(user, { active: !user.active })}><Icon name={user.active ? "eye-off" : "check"} /></button><button className={styles.delete} title="Eliminar" disabled={ownAccount} onClick={() => void remove(user)}><Icon name="trash" /></button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <footer>Mostrando {filtered.length} de {summary.total} usuarios <span><Icon name="shield" />Solo administradores pueden modificar accesos.</span></footer>
        </section>

        <section className={styles.permissions}>
          <header><Icon name="lock" /><div><h2>Niveles de privilegio</h2><p>Asigna únicamente el acceso necesario para cada integrante.</p></div></header>
          <div>{(["ADMIN", "MANAGER", "EMPLOYEE"] as Role[]).map((role) => <article key={role}><i className={styles[role.toLowerCase()]}><Icon name={role === "ADMIN" ? "shield" : role === "MANAGER" ? "clipboard" : "users"} /></i><span><b>{roleLabels[role]}</b><small>{roleDescriptions[role]}</small></span></article>)}</div>
        </section>
      </main>

      {modalOpen && <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><form className={styles.modal} onSubmit={(event) => void save(event)}>
        <header><div><h2>{draft.id ? "Editar usuario" : "Crear usuario"}</h2><p>{draft.id ? "Actualiza los datos, el estado o los privilegios." : "Agrega una cuenta para un integrante del equipo."}</p></div><button type="button" aria-label="Cerrar" onClick={() => setModalOpen(false)}><Icon name="close" /></button></header>
        <div className={styles.formGrid}><label><span>Nombre</span><input value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} minLength={2} required /></label><label><span>Apellidos</span><input value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} minLength={2} required /></label></div>
        <label><span>Correo electrónico</span><input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required /></label>
        <label><span>{draft.id ? "Nueva contraseña (opcional)" : "Contraseña"}</span><input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} minLength={8} required={!draft.id} placeholder={draft.id ? "Déjala vacía para conservar la actual" : "Mínimo 8 caracteres"} /></label>
        <div className={styles.formGrid}><label><span>Privilegios</span><select value={draft.role} disabled={draft.id === currentUserId} onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}><option value="ADMIN">Administrador</option><option value="MANAGER">Gerente</option><option value="EMPLOYEE">Empleado</option></select><small>{roleDescriptions[draft.role]}</small></label><label><span>Estado</span><select value={draft.active ? "ACTIVE" : "INACTIVE"} disabled={draft.id === currentUserId} onChange={(event) => setDraft({ ...draft, active: event.target.value === "ACTIVE" })}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></select><small>Los inactivos no pueden iniciar sesión.</small></label></div>
        <footer><button type="button" onClick={() => setModalOpen(false)}>Cancelar</button><button disabled={saving}><Icon name="check" />{saving ? "Guardando..." : "Guardar usuario"}</button></footer>
      </form></div>}
      {userToDelete && (
        <DeleteConfirmDialog
          subject={`${userToDelete.firstName} ${userToDelete.lastName}`}
          title="Eliminar usuario"
          description={<>¿Seguro que deseas eliminar definitivamente a <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>? Esta cuenta perderá el acceso al sistema.</>}
          loading={deleting}
          onCancel={() => setUserToDelete(null)}
          onConfirm={confirmRemove}
        />
      )}
      {toast && <div className={styles.toast}><Icon name="check" />{toast}</div>}
    </div>
  );
}
