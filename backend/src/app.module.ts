import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    SuppliersModule,
    ProductsModule,
    InventoryModule,
    DashboardModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
