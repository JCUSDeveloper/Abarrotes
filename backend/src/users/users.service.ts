import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import type { JwtPayload } from "../auth/types/jwt-payload";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";

const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  active: true,
  storeId: true,
  store: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private scope(actor: JwtPayload): Prisma.UserWhereInput {
    return actor.storeId ? { storeId: actor.storeId } : {};
  }

  private async target(id: string, actor: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.scope(actor) },
      select: {
        ...publicUser,
        _count: { select: { movements: true, priceChanges: true, auditLogs: true } },
      },
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user;
  }

  async findAll(actor: JwtPayload) {
    const where = this.scope(actor);
    const [data, total, active, inactive, administrators] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: publicUser, orderBy: [{ active: "desc" }, { firstName: "asc" }] }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, active: true } }),
      this.prisma.user.count({ where: { ...where, active: false } }),
      this.prisma.user.count({ where: { ...where, role: Role.ADMIN, active: true } }),
    ]);
    return { data, summary: { total, active, inactive, administrators } };
  }

  async create(dto: CreateUserDto, actor: JwtPayload) {
    const { password, email, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...data,
          email: email.trim().toLowerCase(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          passwordHash: await hash(password, 12),
          role: data.role ?? Role.EMPLOYEE,
          active: data.active ?? true,
          storeId: actor.storeId,
        },
        select: publicUser,
      });
      await tx.auditLog.create({
        data: { entity: "User", entityId: user.id, action: "CREATE", data: { email: user.email, role: user.role }, userId: actor.sub },
      });
      return user;
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: JwtPayload) {
    const current = await this.target(id, actor);
    if (id === actor.sub && (dto.active === false || (dto.role && dto.role !== Role.ADMIN))) {
      throw new BadRequestException("No puedes desactivar tu cuenta ni retirar tus propios privilegios");
    }
    if (current.role === Role.ADMIN && current.active && (dto.active === false || (dto.role && dto.role !== Role.ADMIN))) {
      await this.ensureAnotherAdministrator(id, actor);
    }

    const { password, email, firstName, lastName, ...rest } = dto;
    const data: Prisma.UserUpdateInput = {
      ...rest,
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(firstName !== undefined && { firstName: firstName.trim() }),
      ...(lastName !== undefined && { lastName: lastName.trim() }),
      ...(password && { passwordHash: await hash(password, 12) }),
    };

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data, select: publicUser });
      if (dto.active === false) {
        await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await tx.auditLog.create({
        data: { entity: "User", entityId: id, action: "UPDATE", data: { role: dto.role, active: dto.active }, userId: actor.sub },
      });
      return user;
    });
  }

  async remove(id: string, actor: JwtPayload) {
    const current = await this.target(id, actor);
    if (id === actor.sub) throw new BadRequestException("No puedes eliminar tu propia cuenta");
    if (current.role === Role.ADMIN && current.active) await this.ensureAnotherAdministrator(id, actor);
    if (current._count.movements || current._count.priceChanges || current._count.auditLogs) {
      throw new ConflictException("Este usuario tiene historial operativo. Desactívalo para conservar la auditoría");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({
        data: { entity: "User", entityId: id, action: "DELETE", data: { email: current.email }, userId: actor.sub },
      });
      return { id, deleted: true };
    });
  }

  private async ensureAnotherAdministrator(id: string, actor: JwtPayload) {
    const count = await this.prisma.user.count({
      where: { ...this.scope(actor), id: { not: id }, role: Role.ADMIN, active: true },
    });
    if (count === 0) throw new BadRequestException("Debe permanecer al menos un administrador activo");
  }
}
