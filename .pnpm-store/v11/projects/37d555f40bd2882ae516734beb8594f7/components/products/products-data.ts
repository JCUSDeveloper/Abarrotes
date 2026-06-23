export type ApiProductStatus = "ACTIVE" | "PROMOTION" | "HIDDEN";
export type CatalogStatus = "Activo" | "Promoción" | "Oculto";

export type ApiCategory = {
  id: string;
  name: string;
  status: "ACTIVE" | "PROMOTION" | "HIDDEN";
};

export type ApiSupplier = {
  id: string;
  name: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
};

export type ApiProduct = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  unit: string;
  purchasePrice: string | number;
  salePrice: string | number;
  minimumStock: number;
  status: ApiProductStatus;
  categoryId: string | null;
  category: ApiCategory | null;
  suppliers: Array<{
    supplierId: string;
    isPrimary: boolean;
    supplier: ApiSupplier;
  }>;
  inventories: Array<{ id: string; stock: number; storeId: string }>;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
  category: string;
  supplierId: string;
  supplier: string;
  purchasePrice: number;
  price: number;
  stock: number;
  minimumStock: number;
  lastUpdated: string;
  status: CatalogStatus;
  apiStatus: ApiProductStatus;
  icon: string;
  iconTone: string;
};

const statusLabels: Record<ApiProductStatus, CatalogStatus> = {
  ACTIVE: "Activo",
  PROMOTION: "Promoción",
  HIDDEN: "Oculto",
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toCatalogProduct(product: ApiProduct): CatalogProduct {
  const primarySupplier = product.suppliers.find((item) => item.isPrimary)
    ?? product.suppliers[0];

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? "",
    brand: product.brand ?? "",
    categoryId: product.categoryId ?? "",
    category: product.category?.name ?? "Sin categoría",
    supplierId: primarySupplier?.supplierId ?? "",
    supplier: primarySupplier?.supplier.name ?? "Sin proveedor",
    purchasePrice: Number(product.purchasePrice),
    price: Number(product.salePrice),
    stock: product.inventories[0]?.stock ?? 0,
    minimumStock: product.minimumStock,
    lastUpdated: formatDate(product.updatedAt),
    status: statusLabels[product.status],
    apiStatus: product.status,
    icon: "📦",
    iconTone: "#e8f3f1",
  };
}

export function toApiStatus(status: CatalogStatus): ApiProductStatus {
  if (status === "Promoción") return "PROMOTION";
  if (status === "Oculto") return "HIDDEN";
  return "ACTIVE";
}
