import type { IconName } from "@/components/inventory/icon";

export type ActivityStatus = "Completado" | "Activo";

export type Activity = {
  id: number;
  product: string;
  icon: string;
  iconTone: string;
  action: string;
  before: string;
  after: string;
  user: string;
  date: string;
  status: ActivityStatus;
};

export const recentActivity: Activity[] = [
  { id: 1, product: "Coca-Cola 600 ml", icon: "🥤", iconTone: "#eef5f4", action: "Precio actualizado", before: "$16.00", after: "$17.50", user: "María López", date: "Hoy 10:24", status: "Completado" },
  { id: 2, product: "Leche entera 1 L", icon: "🥛", iconTone: "#edf4f8", action: "Producto editado", before: "Lácteos", after: "Lácteos", user: "Juan Pérez", date: "Hoy 09:15", status: "Completado" },
  { id: 3, product: "Sabritas clásicas 45 g", icon: "🍟", iconTone: "#fff1c9", action: "Precio actualizado", before: "$18.00", after: "$19.00", user: "Ana Martínez", date: "Ayer 18:40", status: "Completado" },
  { id: 4, product: "Arroz súper extra 1 kg", icon: "🌾", iconTone: "#f4efe2", action: "Producto creado", before: "—", after: "—", user: "Carlos Ramírez", date: "Ayer 17:10", status: "Activo" },
  { id: 5, product: "Azúcar estándar 1 kg", icon: "🧂", iconTone: "#f1f3f4", action: "Producto ocultado", before: "Visible", after: "Oculto", user: "Jorge Herrera", date: "Ayer 15:05", status: "Completado" },
];

export const quickActions: { label: string; icon: IconName; target?: string }[] = [
  { label: "Nuevo producto", icon: "plus", target: "/productos" },
  { label: "Cambio de precio", icon: "tag", target: "/productos#edicion-rapida" },
  { label: "Actualización masiva", icon: "chart", target: "/inventario#actualizacion-lote" },
  { label: "Importar catálogo", icon: "upload", target: "/productos" },
  { label: "Exportar catálogo", icon: "download", target: "/productos" },
  { label: "Ver movimientos", icon: "list" },
];

export const alerts: { label: string; count: number; icon: IconName; tone: string }[] = [
  { label: "productos sin precio", count: 6, icon: "warning", tone: "red" },
  { label: "productos sin categoría", count: 3, icon: "tag", tone: "amber" },
  { label: "productos duplicados", count: 2, icon: "copy", tone: "purple" },
  { label: "cambios pendientes de aprobación", count: 5, icon: "clock", tone: "blue" },
];
