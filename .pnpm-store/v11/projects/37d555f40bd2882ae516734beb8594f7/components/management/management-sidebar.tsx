import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Icon, type IconName } from "@/components/inventory/icon";
import styles from "./management-sidebar.module.css";

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

type Props = { active: string; open: boolean; onClose: () => void; onNotify: (message: string) => void };

export function ManagementSidebar({ active, open, onClose, onNotify }: Props) {
  return (
    <>
      <button className={`${styles.scrim} ${open ? styles.scrimVisible : ""}`} aria-label="Cerrar menú" onClick={onClose} />
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}><span><Icon name="cart" /></span><b>Abarrotes</b><button aria-label="Cerrar navegación" onClick={onClose}><Icon name="arrow-left" /></button></div>
        <nav className={styles.navigation} aria-label="Navegación principal">
          {navigation.map((item) => item.href ? <Link key={item.label} href={item.href} className={`${styles.navItem} ${active === item.label ? styles.active : ""}`} onClick={onClose}><Icon name={item.icon} />{item.label}</Link> : <button key={item.label} className={styles.navItem} onClick={() => onNotify(`${item.label}: módulo listo para conectar`)}><Icon name={item.icon} />{item.label}</button>)}
        </nav>
        <button className={styles.store} onClick={() => onNotify("Sucursal Tienda Centro seleccionada")}><span><Icon name="store" /></span><i><b>Tienda Centro</b><small>Abarrotes</small></i><Icon name="chevron-down" /></button>
        <form action={logout} className={styles.logout}><button><Icon name="logout" /> Cerrar sesión</button></form>
      </aside>
    </>
  );
}
