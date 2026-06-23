import type { Role } from "@prisma/client";
export type JwtPayload = { sub: string; email: string; role: Role; storeId: string | null };
export type JwtRefreshPayload = JwtPayload & { tokenId: string };
