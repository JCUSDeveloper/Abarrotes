import { PrismaClient, Role, ProductStatus, CategoryStatus, SupplierStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.upsert({
    where: { code: "CENTRO" },
    update: {},
    create: { code: "CENTRO", name: "Tienda Centro" },
  });

  await prisma.user.upsert({
    where: { email: "admin@abarrotes.mx" },
    update: {},
    create: {
      email: "admin@abarrotes.mx",
      passwordHash: await hash("admin123", 12),
      firstName: "Juan",
      lastName: "Pérez",
      role: Role.ADMIN,
      storeId: store.id,
    },
  });

  const categories = await Promise.all([
    ["Bebidas", "Refrescos, aguas, jugos y bebidas."],
    ["Abarrotes", "Productos básicos y de despensa."],
    ["Lácteos", "Leche, quesos, yogures y lácteos."],
    ["Botanas", "Snacks, frituras y golosinas."],
  ].map(([name, description]) => prisma.category.upsert({
    where: { name }, update: {}, create: { name, description, status: CategoryStatus.ACTIVE },
  })));

  const suppliers = await Promise.all([
    { name: "FEMSA", contactName: "Mariana López", email: "mariana.lopez@femsa.com.mx", phone: "55 1234 5678", creditDays: 30 },
    { name: "La Costeña", contactName: "Javier Ramírez", email: "javier.ramirez@lacostena.com.mx", phone: "55 2345 6789", creditDays: 30 },
    { name: "LALA", contactName: "Ana Torres", email: "ana.torres@lala.com.mx", phone: "55 3456 7890", creditDays: 15 },
  ].map((supplier) => prisma.supplier.upsert({
    where: { name: supplier.name }, update: {}, create: { ...supplier, status: SupplierStatus.ACTIVE },
  })));

  const products = [
    { sku: "7501055300086", barcode: "7501055300086", name: "Coca-Cola 600 ml", brand: "Coca-Cola", purchasePrice: 11, salePrice: 16, minimumStock: 20, categoryId: categories[0].id, supplierId: suppliers[0].id, stock: 48 },
    { sku: "7503000413125", barcode: "7503000413125", name: "Frijol pinto 1 kg", brand: "La Costeña", purchasePrice: 21, salePrice: 28.5, minimumStock: 18, categoryId: categories[1].id, supplierId: suppliers[1].id, stock: 12 },
    { sku: "7501020531300", barcode: "7501020531300", name: "Leche entera 1 L", brand: "LALA", purchasePrice: 17, salePrice: 22, minimumStock: 15, categoryId: categories[2].id, supplierId: suppliers[2].id, stock: 35 },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        sku: item.sku, barcode: item.barcode, name: item.name, brand: item.brand,
        purchasePrice: item.purchasePrice, salePrice: item.salePrice,
        minimumStock: item.minimumStock, categoryId: item.categoryId, status: ProductStatus.ACTIVE,
      },
    });
    await prisma.productSupplier.upsert({
      where: { productId_supplierId: { productId: product.id, supplierId: item.supplierId } },
      update: {}, create: { productId: product.id, supplierId: item.supplierId, isPrimary: true, cost: item.purchasePrice },
    });
    await prisma.inventory.upsert({
      where: { storeId_productId: { storeId: store.id, productId: product.id } },
      update: {}, create: { storeId: store.id, productId: product.id, stock: item.stock },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
