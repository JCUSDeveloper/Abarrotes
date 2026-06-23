import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import type { JwtPayload } from "../auth/types/jwt-payload";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.usersService.findAll(actor);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: JwtPayload) {
    return this.usersService.create(dto, actor);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() actor: JwtPayload) {
    return this.usersService.remove(id, actor);
  }
}
