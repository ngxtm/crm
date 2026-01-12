import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignOrderDto, UpdateDesignOrderDto } from './dto/design-order.dto';

@Injectable()
export class DesignOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.design_orders.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.design_orders.findUnique({
      where: { id },
    });
  }

  async create(data: CreateDesignOrderDto) {
    return this.prisma.design_orders.create({
      data,
    });
  }

  async update(id: string, data: UpdateDesignOrderDto) {
    return this.prisma.design_orders.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.design_orders.delete({
      where: { id },
    });
  }
}
