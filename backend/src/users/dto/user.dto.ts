import { PartialType } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
