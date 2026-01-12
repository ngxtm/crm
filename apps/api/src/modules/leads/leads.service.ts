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
          product_groups: {
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
        product_groups: {
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
        product_groups: {
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

    // Update basic fields
    if (updateLeadDto.full_name !== undefined) data.full_name = updateLeadDto.full_name;
    if (updateLeadDto.phone !== undefined) data.phone = updateLeadDto.phone;
    if (updateLeadDto.email !== undefined) data.email = updateLeadDto.email;
    if (updateLeadDto.demand !== undefined) data.demand = updateLeadDto.demand;
    if (updateLeadDto.source_id !== undefined) data.source_id = updateLeadDto.source_id;
    if (updateLeadDto.campaign_id !== undefined) data.campaign_id = updateLeadDto.campaign_id;
    if (updateLeadDto.customer_group !== undefined) data.customer_group = updateLeadDto.customer_group;
    if (updateLeadDto.interested_product_group_id !== undefined)
      data.interested_product_group_id = updateLeadDto.interested_product_group_id;
    if (updateLeadDto.status !== undefined) data.status = updateLeadDto.status;

    // Handle sales assignment
    if (updateLeadDto.assigned_sales_id !== undefined) {
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
        product_groups: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async convertToCustomer(leadId: number) {
    // Get lead info
    const lead = await this.prisma.leads.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.is_converted) {
      throw new Error('Lead đã được chuyển đổi trước đó');
    }

    // Check if customer with same phone already exists
    let customer = await this.prisma.customers.findFirst({
      where: { phone: lead.phone },
    });

    if (!customer) {
      // Create new customer
      const customerCode = `KH${Date.now().toString().slice(-8)}`;
      customer = await this.prisma.customers.create({
        data: {
          customer_code: customerCode,
          full_name: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          original_lead_id: leadId,
          account_manager_id: lead.assigned_sales_id,
        },
      });
    }

    // Update lead as converted
    await this.prisma.leads.update({
      where: { id: leadId },
      data: {
        is_converted: true,
        converted_at: new Date(),
        status: 'closed',
      },
    });

    return { customer_id: customer.id };
  }

  async remove(id: number) {
    // Delete related interaction_logs first to avoid foreign key constraint
    await this.prisma.interaction_logs.deleteMany({
      where: { lead_id: id },
    });

    // Delete related assignment_logs
    await this.prisma.assignment_logs.deleteMany({
      where: { lead_id: id },
    });

    // Now delete the lead
    return this.prisma.leads.delete({
      where: { id },
    });
  }

  async createOrderFromLead(
    leadId: number,
    orderData: {
      description: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      totalAmount: number;
      finalAmount: number;
    },
  ) {
    // Get lead info
    const lead = await this.prisma.leads.findUnique({
      where: { id: leadId },
      include: {
        product_groups: true,
        sales_employees: true,
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Find or create customer based on phone
    let customer = await this.prisma.customers.findFirst({
      where: { phone: lead.phone },
    });

    if (!customer) {
      const customerCode = `KH${Date.now().toString().slice(-8)}`;
      customer = await this.prisma.customers.create({
        data: {
          customer_code: customerCode,
          full_name: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          original_lead_id: lead.id,
        },
      });
    }

    // Create order
    const orderCode = `ORD${Date.now().toString().slice(-8)}`;
    const order = await this.prisma.orders.create({
      data: {
        order_code: orderCode,
        customer_id: customer.id,
        product_group_id: lead.interested_product_group_id,
        description: orderData.description,
        quantity: orderData.quantity,
        unit: orderData.unit || 'cái',
        unit_price: orderData.unitPrice,
        total_amount: orderData.totalAmount,
        final_amount: orderData.finalAmount,
        status: 'pending',
        sales_employee_id: lead.assigned_sales_id,
      },
      include: {
        customers: true,
        product_groups: true,
        sales_employees: true,
      },
    });

    // Update lead as converted
    await this.prisma.leads.update({
      where: { id: leadId },
      data: {
        is_converted: true,
        status: 'closed',
      },
    });

    return {
      order_id: order.id,
      order_code: order.order_code,
      customer_id: customer.id,
      customer_code: customer.customer_code,
      order,
    };
  }
}
