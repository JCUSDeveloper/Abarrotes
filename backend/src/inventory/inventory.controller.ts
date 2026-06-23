import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { JwtPayload } from "../auth/types/jwt-payload";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { BulkPriceUpdateDto, CreateMovementDto } from "./dto/inventory.dto";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get("summary")
  summary(@CurrentUser() user: JwtPayload) {
    return this.service.summary(user.storeId);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.storeId);
  }

  @Post("movements")
  movement(@Body() dto: CreateMovementDto, @CurrentUser() user: JwtPayload) {
    return this.service.movement(dto, user.sub, user.storeId);
  }

  @Post("bulk-price")
  @Roles(Role.ADMIN, Role.MANAGER)
  bulkPrice(@Body() dto: BulkPriceUpdateDto, @CurrentUser() user: JwtPayload) {
    return this.service.bulkPrice(dto, user.sub);
  }
}
