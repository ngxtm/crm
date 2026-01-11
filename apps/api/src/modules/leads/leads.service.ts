import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { lead_status } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    status?: lead_status;
    source_id?: number;
    assigned_sales_id?: number;
    limit?: number;
    offset?: number;
  }) {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.source_id) where.source_id = filters.source_id;
    if (filters?.assigned_sales_id) where.assigned_sales_id = filters.assigned_sales_id;

    const [data, count] = await Promise.all([
      this.prisma.leads.findMany({
        where,
        include: {
          lead_sources: {
            select: {
              name: true,
              type: true,
            },
          },
          campaigns: {
            select: {
              name: true,
            },
          },
          sales_employees: {
            select: {
              full_name: true,
              employee_code: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.leads.count({ where }),
    ]);

    return { data, count };
  }

  async findOne(id: number) {
    return this.prisma.leads.findUnique({
      where: { id },
      include: {
        lead_sources: {
          select: {
            name: true,
            type: true,
          },
        },
        campaigns: {
          select: {
            name: true,
          },
        },
        sales_employees: {
          select: {
            full_name: true,
            employee_code: true,
          },
        },
      },
    });
  }

  async create(createLeadDto: CreateLeadDto) {
    // Create lead with status 'new'
    const lead = await this.prisma.leads.create({
      data: {
        ...createLeadDto,
        status: 'new',
      },
      include: {
        lead_sources: {
          select: {
            name: true,
            type: true,
          },
        },
        campaigns: {
          select: {
            name: true,
          },
        },
      },
    });

    // Call auto-assign function (if exists in database)
    try {
      await this.prisma.$queryRaw`SELECT auto_assign_lead(${lead.id})`;
    } catch (error) {
      // Function might not exist yet, ignore error
      console.log('Auto-assign function not available:', error.message);
    }

    return lead;
  }

  async update(id: number, updateLeadDto: UpdateLeadDto) {
    const data: any = {};

    if (updateLeadDto.status) data.status = updateLeadDto.status;
    if (updateLeadDto.demand) data.demand = updateLeadDto.demand;
    if (updateLeadDto.assigned_sales_id) {
      data.assigned_sales_id = updateLeadDto.assigned_sales_id;
      data.assigned_at = new Date();
      data.assignment_method = updateLeadDto.assignment_method || 'manual';
    }

    return this.prisma.leads.update({
      where: { id },
      data,
      include: {
        lead_sources: {
          select: {
            name: true,
            type: true,
          },
        },
        campaigns: {
          select: {
            name: true,
          },
        },
        sales_employees: {
          select: {
            full_name: true,
            employee_code: true,
          },
        },
      },
    });
  }

  async convertToCustomer(leadId: number) {
    // Call convert function (if exists in database)
    try {
      const result = await this.prisma.$queryRaw<{ customer_id: number }[]>`
        SELECT convert_lead_to_customer(${leadId}) as customer_id
      `;
      return { customer_id: result[0]?.customer_id };
    } catch (error) {
      throw new Error(`Failed to convert lead to customer: ${error.message}`);
    }
  }

  async remove(id: number) {
    return this.prisma.leads.delete({
      where: { id },
    });
  }
}
