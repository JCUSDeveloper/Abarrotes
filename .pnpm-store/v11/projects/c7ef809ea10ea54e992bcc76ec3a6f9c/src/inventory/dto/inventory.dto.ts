import { MovementType, ProductStatus } from "@prisma/client";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateMovementDto {
  @IsString()
  productId: string;

  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class BulkPriceUpdateDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  productIds: string[];

  @IsIn(["PERCENTAGE", "AMOUNT"])
  mode: "PERCENTAGE" | "AMOUNT";

  @IsNumber()
  adjustment: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  rounding = 0.1;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
