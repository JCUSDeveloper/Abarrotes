import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { JwtPayload } from "../auth/types/jwt-payload";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateSupplierDto, SupplierQueryDto, UpdateSupplierDto } from "./dto/supplier.dto";
import { SuppliersService } from "./suppliers.service";

@ApiTags("suppliers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  findAll(@Query() query: SupplierQueryDto) { return this.service.findAll(query); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: JwtPayload) { return this.service.create(dto, user.sub); }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param("id") id: string, @Body() dto: UpdateSupplierDto, @CurrentUser() user: JwtPayload) { return this.service.update(id, dto, user.sub); }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.MANAGER)
  remove(@Param("id") id: string, @CurrentUser() user: JwtPayload) { return this.service.remove(id, user.sub); }
}
