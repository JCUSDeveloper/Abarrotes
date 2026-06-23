import { CategoryStatus } from "@prisma/client";
import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsHexColor, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class CreateCategoryDto {
  @IsString() @MaxLength(80) name: string;
  @IsOptional() @IsString() @MaxLength(250) description?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsString() @MaxLength(40) icon?: string;
  @IsOptional() @IsEnum(CategoryStatus) status?: CategoryStatus;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
export class CategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: CategoryStatus }) @IsOptional() @IsEnum(CategoryStatus) status?: CategoryStatus;
}
