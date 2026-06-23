import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSupplierDto, SupplierQueryDto, UpdateSupplierDto } from "./dto/supplier.dto";
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: SupplierQueryDto) { const where={deletedAt:null,...(query.status&&{status:query.status}),...(query.search&&{OR:[{name:{contains:query.search,mode:"insensitive" as const}},{contactName:{contains:query.search,mode:"insensitive" as const}}]})}; const [data,total]=await this.prisma.$transaction([this.prisma.supplier.findMany({where,include:{_count:{select:{products:true}}},orderBy:{name:"asc"},skip:(query.page-1)*query.limit,take:query.limit}),this.prisma.supplier.count({where})]); return {data,meta:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}}; }
  async findOne(id:string){const supplier=await this.prisma.supplier.findFirst({where:{id,deletedAt:null},include:{products:{include:{product:{select:{id:true,name:true,sku:true,brand:true}}}}}});if(!supplier)throw new NotFoundException("Proveedor no encontrado");return supplier;}
  create(dto:CreateSupplierDto,userId:string){return this.prisma.$transaction(async tx=>{const supplier=await tx.supplier.create({data:dto});await tx.auditLog.create({data:{entity:"Supplier",entityId:supplier.id,action:"CREATE",data:{...dto},userId}});return supplier})}
  async update(id:string,dto:UpdateSupplierDto,userId:string){await this.findOne(id);return this.prisma.$transaction(async tx=>{const supplier=await tx.supplier.update({where:{id},data:dto});await tx.auditLog.create({data:{entity:"Supplier",entityId:id,action:"UPDATE",data:{...dto},userId}});return supplier})}
  async remove(id:string,userId:string){await this.findOne(id);return this.prisma.$transaction(async tx=>{const supplier=await tx.supplier.update({where:{id},data:{deletedAt:new Date()}});await tx.auditLog.create({data:{entity:"Supplier",entityId:id,action:"DELETE",userId}});return supplier})}
}
