import { SupplierStatus } from "@prisma/client";
import { PartialType } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";
export class CreateSupplierDto {
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(100) contactName: string;
  @IsOptional() @IsString() contactRole?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() @Min(0) creditDays?: number;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsEnum(SupplierStatus) status?: SupplierStatus;
}
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
export class SupplierQueryDto extends PaginationDto { @IsOptional() @IsString() search?: string; @IsOptional() @IsEnum(SupplierStatus) status?: SupplierStatus; }
