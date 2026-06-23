import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "../src/auth/dto/login.dto";
import { PaginationDto } from "../src/common/dto/pagination.dto";
import { BulkPriceUpdateDto } from "../src/inventory/dto/inventory.dto";

describe("DTO validation", () => {
  it("rejects invalid login credentials", async () => {
    const dto = plainToInstance(LoginDto, { email: "correo-invalido", password: "123" });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["email", "password"]));
  });

  it("transforms pagination query values to numbers", async () => {
    const dto = plainToInstance(PaginationDto, { page: "2", limit: "25" });
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(25);
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("accepts a valid bulk price update", async () => {
    const dto = plainToInstance(BulkPriceUpdateDto, {
      productIds: ["product-id"],
      mode: "PERCENTAGE",
      adjustment: 5,
      rounding: 0.1,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
