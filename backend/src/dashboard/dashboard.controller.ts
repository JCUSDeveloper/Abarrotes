import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ProductStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("summary")
  async summary() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      promotion,
      hidden,
      categories,
      suppliers,
      productsForReview,
      priceChanges,
      recentLogs,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE, deletedAt: null } }),
      this.prisma.product.count({ where: { status: ProductStatus.PROMOTION, deletedAt: null } }),
      this.prisma.product.count({ where: { status: ProductStatus.HIDDEN, deletedAt: null } }),
      this.prisma.category.count({ where: { deletedAt: null } }),
      this.prisma.supplier.count({ where: { deletedAt: null } }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { minimumStock: true, inventories: { select: { stock: true } } },
      }),
      this.prisma.priceHistory.findMany({
        where: { createdAt: { gte: monthStart } },
        select: { createdAt: true },
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const productIds = recentLogs
      .filter((log) => log.entity === "Product" && log.entityId !== "BULK")
      .map((log) => log.entityId);
    const recentProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNames = new Map(recentProducts.map((product) => [product.id, product.name]));

    const weeklyPriceChanges = [0, 0, 0, 0, 0];
    for (const change of priceChanges) {
      const week = Math.min(4, Math.floor((change.createdAt.getDate() - 1) / 7));
      weeklyPriceChanges[week] += 1;
    }

    const pendingReview = productsForReview.filter((product) => (
      product.inventories.length === 0
      || product.inventories.some((inventory) => inventory.stock <= product.minimumStock)
    )).length;

    return {
      products: { total, active, promotion, hidden },
      categories,
      suppliers,
      inventory: { pendingReview },
      priceChangesThisMonth: priceChanges.length,
      weeklyPriceChanges,
      recent: recentLogs.map((log) => ({
        id: log.id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        createdAt: log.createdAt,
        user: `${log.user.firstName} ${log.user.lastName}`,
        productName: productNames.get(log.entityId) ?? null,
      })),
    };
  }
}
