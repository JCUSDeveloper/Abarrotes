import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MovementType, Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BulkPriceUpdateDto, CreateMovementDto } from "./dto/inventory.dto";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string | null) {
    if (!storeId) throw new BadRequestException("El usuario no tiene una tienda asignada");

    const inventories = await this.prisma.inventory.findMany({
      where: { storeId, product: { deletedAt: null } },
      include: {
        product: {
          include: {
            category: true,
            suppliers: { include: { supplier: true } },
          },
        },
      },
      orderBy: { product: { name: "asc" } },
    });

    const productIds = inventories.map((item) => item.productId);
    const activity = await this.prisma.auditLog.findMany({
      where: { entity: "Product", entityId: { in: productIds } },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });
    const latestActivity = new Map<string, (typeof activity)[number]>();
    for (const log of activity) {
      if (!latestActivity.has(log.entityId)) latestActivity.set(log.entityId, log);
    }

    return inventories.map((item) => {
      const currentPrice = Number(item.product.salePrice);
      const suggestedPrice = Math.max(
        0,
        Math.round((currentPrice * 1.03) / 0.5) * 0.5,
      );
      const lastActivity = latestActivity.get(item.productId);

      return {
        ...item,
        suggestedPrice,
        changePercent: currentPrice
          ? ((suggestedPrice - currentPrice) / currentPrice) * 100
          : 0,
        lastEditedAt: lastActivity?.createdAt ?? item.product.updatedAt,
        responsible: lastActivity?.user ?? null,
      };
    });
  }

  async summary(storeId: string | null) {
    if (!storeId) throw new BadRequestException("El usuario no tiene una tienda asignada");

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const previousMonthStart = new Date(monthStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

    const [inventories, bulkChanges, previousBulkChanges, activeRules] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { storeId, product: { deletedAt: null } },
        select: {
          stock: true,
          product: { select: { minimumStock: true, status: true } },
        },
      }),
      this.prisma.auditLog.count({
        where: { action: "BULK_PRICE_UPDATE", createdAt: { gte: monthStart } },
      }),
      this.prisma.auditLog.count({
        where: {
          action: "BULK_PRICE_UPDATE",
          createdAt: { gte: previousMonthStart, lt: monthStart },
        },
      }),
      this.prisma.priceRule.count({ where: { active: true } }),
    ]);

    return {
      visibleProducts: inventories.filter((item) => item.product.status !== ProductStatus.HIDDEN).length,
      pendingReview: inventories.filter((item) => item.stock <= item.product.minimumStock).length,
      bulkChangesThisMonth: bulkChanges,
      activePriceRules: activeRules,
      trends: {
        visibleProducts: 0,
        pendingReview: 0,
        bulkChanges: bulkChanges - previousBulkChanges,
        activePriceRules: 0,
      },
    };
  }

  async movement(
    dto: CreateMovementDto,
    userId: string,
    storeId: string | null,
  ) {
    if (!storeId) throw new BadRequestException("El usuario no tiene una tienda asignada");

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { storeId_productId: { storeId, productId: dto.productId } },
      });
      if (!inventory) throw new NotFoundException("Registro de inventario no encontrado");

      const delta = dto.type === MovementType.ENTRY
        ? dto.quantity
        : dto.type === MovementType.EXIT
          ? -dto.quantity
          : dto.quantity;
      const after = inventory.stock + delta;
      if (after < 0) throw new BadRequestException("El movimiento dejaría stock negativo");

      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: { stock: after, version: { increment: 1 } },
      });
      await tx.stockMovement.create({
        data: {
          ...dto,
          storeId,
          beforeStock: inventory.stock,
          afterStock: after,
          actorUserId: userId,
        },
      });
      return updated;
    });
  }

  async bulkPrice(dto: BulkPriceUpdateDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: dto.productIds }, deletedAt: null },
      });
      if (products.length !== dto.productIds.length) {
        throw new BadRequestException("Uno o más productos no existen");
      }

      for (const product of products) {
        const oldPrice = Number(product.salePrice);
        const raw = dto.mode === "PERCENTAGE"
          ? oldPrice * (1 + dto.adjustment / 100)
          : oldPrice + dto.adjustment;
        const next = Math.max(0, Math.round(raw / dto.rounding) * dto.rounding);

        await tx.product.update({
          where: { id: product.id },
          data: {
            salePrice: new Prisma.Decimal(next),
            ...(dto.status && { status: dto.status }),
          },
        });
        await tx.priceHistory.create({
          data: {
            productId: product.id,
            changedById: userId,
            oldPrice: product.salePrice,
            newPrice: new Prisma.Decimal(next),
            reason: dto.reason,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "Product",
          entityId: "BULK",
          action: "BULK_PRICE_UPDATE",
          data: {
            productIds: dto.productIds,
            mode: dto.mode,
            adjustment: dto.adjustment,
          },
          userId,
        },
      });
      return { updated: products.length };
    });
  }
}
