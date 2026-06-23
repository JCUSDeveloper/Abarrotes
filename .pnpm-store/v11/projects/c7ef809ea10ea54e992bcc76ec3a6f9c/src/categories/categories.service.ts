import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: CategoryQueryDto) {
    const where = { deletedAt: null, ...(query.status && { status: query.status }), ...(query.search && { name: { contains: query.search, mode: "insensitive" as const } }) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({ where, include: { _count: { select: { products: true } }, priceRules: { where: { active: true } } }, orderBy: { name: "asc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
      this.prisma.category.count({ where }),
    ]);
    return { data, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  }
  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { products: true } }, priceRules: true } });
    if (!category) throw new NotFoundException("Categoría no encontrada"); return category;
  }
  create(dto: CreateCategoryDto, userId: string) { return this.prisma.$transaction(async (tx) => { const category = await tx.category.create({ data: dto }); await tx.auditLog.create({ data: { entity: "Category", entityId: category.id, action: "CREATE", data: { ...dto }, userId } }); return category; }); }
  async update(id: string, dto: UpdateCategoryDto, userId: string) { await this.findOne(id); return this.prisma.$transaction(async (tx) => { const category = await tx.category.update({ where: { id }, data: dto }); await tx.auditLog.create({ data: { entity: "Category", entityId: id, action: "UPDATE", data: { ...dto }, userId } }); return category; }); }
  async remove(id: string, userId: string) { await this.findOne(id); return this.prisma.$transaction(async (tx) => { const category = await tx.category.update({ where: { id }, data: { deletedAt: new Date() } }); await tx.auditLog.create({ data: { entity: "Category", entityId: id, action: "DELETE", userId } }); return category; }); }
}
