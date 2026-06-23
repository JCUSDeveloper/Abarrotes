import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from "./dto/product.dto";

const productInclude = {
  category: true,
  suppliers: { include: { supplier: true } },
  inventories: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.supplierId && {
        suppliers: { some: { supplierId: query.supplierId } },
      }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { sku: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...productInclude,
        priceHistory: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!product) throw new NotFoundException("Producto no encontrado");
    return product;
  }

  create(
    dto: CreateProductDto,
    userId: string,
  ) {
    const { supplierId, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data });

      if (supplierId) {
        await tx.productSupplier.create({
          data: {
            productId: product.id,
            supplierId,
            isPrimary: true,
            cost: dto.purchasePrice,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "Product",
          entityId: product.id,
          action: "CREATE",
          data: { ...data, supplierId },
          userId,
        },
      });

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: productInclude,
      });
    });
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const current = await this.findOne(id);
    const { supplierId, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      if (dto.salePrice !== undefined && Number(current.salePrice) !== dto.salePrice) {
        await tx.priceHistory.create({
          data: {
            productId: id,
            changedById: userId,
            oldPrice: current.salePrice,
            newPrice: dto.salePrice,
            reason: "Actualización de producto",
          },
        });
      }

      if (supplierId) {
        await tx.productSupplier.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false },
        });
        await tx.productSupplier.upsert({
          where: { productId_supplierId: { productId: id, supplierId } },
          update: {
            isPrimary: true,
            ...(dto.purchasePrice !== undefined && { cost: dto.purchasePrice }),
          },
          create: {
            productId: id,
            supplierId,
            isPrimary: true,
            cost: dto.purchasePrice,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "Product",
          entityId: id,
          action: "UPDATE",
          data: { ...data, supplierId },
          userId,
        },
      });

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.auditLog.create({
        data: { entity: "Product", entityId: id, action: "DELETE", userId },
      });
      return product;
    });
  }
}
