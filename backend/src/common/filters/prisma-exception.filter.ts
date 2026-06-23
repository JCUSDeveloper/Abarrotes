import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === "P2002") {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: "Conflict",
        message: "Ya existe un registro con esos datos únicos.",
      });
      return;
    }

    if (exception.code === "P2003") {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: "Conflict",
        message: "El registro está relacionado con otros datos y no puede modificarse así.",
      });
      return;
    }

    if (exception.code === "P2025") {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        error: "Not Found",
        message: "El registro solicitado no existe.",
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "No fue posible completar la operación en la base de datos.",
    });
  }
}
