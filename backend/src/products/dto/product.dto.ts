import { PartialType } from "@nestjs/swagger";
import { ProductStatus } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
