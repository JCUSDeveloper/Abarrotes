import type { ApiProductStatus, CatalogStatus } from "@/components/products/products-data";

export type OperationalStatus = CatalogStatus;

export type ApiInventory = {
  id: string;
  storeId: string;
  stock: number;
  reserved: number;
  updatedAt: string;
  suggestedPrice: number;
  changePercent: number;
  lastEditedAt: string;
  responsible: { firstName: string; lastName: string } | null;
  product: {
    id: string;
    name: string;
    sku: string;
    salePrice: string | number;
    minimumStock: number;
    status: ApiProductStatus;
    updatedAt: string;
    categoryId: string | null;
    category: { id: string; name: string } | null;
    suppliers: Array<{
      supplierId: string;
      isPrimary: boolean;
      supplier: { id: string; name: string };
    }>;
  };
};

export type InventorySummary = {
  visibleProducts: number;
  pendingReview: number;
  bulkChangesThisMonth: number;
  activePriceRules: number;
  trends: {
    visibleProducts: number;
    pendingReview: number;
    bulkChanges: number;
    activePriceRules: number;
  };
};

export type OperationalProduct = {
  id: string;
  inventoryId: string;
  name: string;
  sku: string;
  categoryId: string;
  category: string;
  supplierId: string;
  supplier: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  stock: number;
  minimumStock: number;
  lastEdited: string;
  lastEditedAt: string;
  responsible: string;
  initials: string;
  status: OperationalStatus;
  apiStatus: ApiProductStatus;
  icon: string;
  iconTone: string;
};

const statusLabels: Record<ApiProductStatus, OperationalStatus> = {
  ACTIVE: "Activo",
  PROMOTION: "Promoción",
  HIDDEN: "Oculto",
};

const categoryIcons: Record<string, { icon: string; tone: string }> = {
  Bebidas: { icon: "🥤", tone: "#eef5f4" },
  Abarrotes: { icon: "🫘", tone: "#f4eee7" },
  "Lácteos": { icon: "🥛", tone: "#edf4f8" },
  Botanas: { icon: "🍟", tone: "#fff1c9" },
  Conservas: { icon: "🥫", tone: "#e6f2f5" },
  Aceites: { icon: "🫗", tone: "#fff2cf" },
};

export function mapInventory(item: ApiInventory): OperationalProduct {
  const primarySupplier = item.product.suppliers.find((supplier) => supplier.isPrimary)
    ?? item.product.suppliers[0];
  const category = item.product.category?.name ?? "Sin categoría";
  const visual = categoryIcons[category] ?? { icon: "📦", tone: "#e8f3f1" };
  const responsible = item.responsible
    ? `${item.responsible.firstName} ${item.responsible.lastName}`
    : "Sin asignar";
  const initials = item.responsible
    ? `${item.responsible.firstName[0] ?? ""}${item.responsible.lastName[0] ?? ""}`.toUpperCase()
    : "—";

  return {
    id: item.product.id,
    inventoryId: item.id,
    name: item.product.name,
    sku: item.product.sku,
    categoryId: item.product.categoryId ?? "",
    category,
    supplierId: primarySupplier?.supplierId ?? "",
    supplier: primarySupplier?.supplier.name ?? "Sin proveedor",
    currentPrice: Number(item.product.salePrice),
    suggestedPrice: Number(item.suggestedPrice),
    changePercent: Number(item.changePercent),
    stock: item.stock,
    minimumStock: item.product.minimumStock,
    lastEdited: new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(item.lastEditedAt)),
    lastEditedAt: item.lastEditedAt,
    responsible,
    initials,
    status: statusLabels[item.product.status],
    apiStatus: item.product.status,
    icon: visual.icon,
    iconTone: visual.tone,
  };
}

export function toProductStatus(status: OperationalStatus) {
  if (status === "Promoción") return "PROMOTION" as const;
  if (status === "Oculto") return "HIDDEN" as const;
  return "ACTIVE" as const;
}
