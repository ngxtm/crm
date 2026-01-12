import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { order_status } from '@prisma/client';

// Define valid status transitions
const STATUS_TRANSITIONS: Record<order_status, order_status[]> = {
  pending: ['designing', 'cancelled'],
  designing: ['approved', 'pending', 'cancelled'],
  approved: ['printing', 'designing', 'cancelled'],
  printing: ['completed', 'approved', 'cancelled'],
  completed: ['delivered', 'printing'],
  delivered: [], // Final state, no transitions allowed
  cancelled: ['pending'], // Can reopen cancelled orders
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Validate status transition
  private validateStatusTransition(currentStatus: order_status, newStatus: order_status): void {
    if (currentStatus === newStatus) {
      return; // Same status, no change needed
    }

    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      const statusLabels: Record<order_status, string> = {
        pending: 'Chờ xử lý',
        designing: 'Đang thiết kế',
        approved: 'Đã duyệt',
        printing: 'Đang in',
        completed: 'Hoàn thành',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
      };
      throw new BadRequestException(
        `Không thể chuyển từ "${statusLabels[currentStatus]}" sang "${statusLabels[newStatus]}". ` +
        `Các trạng thái hợp lệ: ${allowedTransitions.map(s => statusLabels[s]).join(', ') || 'Không có'}`
      );
    }
  }

  async findAll(filters?: {
    status?: string;
    salesEmployeeId?: number;
    customerId?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.salesEmployeeId) {
      where.sales_employee_id = filters.salesEmployeeId;
    }
    if (filters?.customerId) {
      where.customer_id = filters.customerId;
    }

    return this.prisma.orders.findMany({
      where,
      include: {
        customers: true,
        sales_employees: true,
        product_groups: true,
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        customers: true,
        sales_employees: true,
        product_groups: true,
        payments: true,
        design_files: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async create(data: CreateOrderDto) {
    const orderCode = `ORD${Date.now().toString().slice(-8)}`;

    return this.prisma.orders.create({
      data: {
        order_code: orderCode,
        customer_id: data.customerId,
        product_group_id: data.productGroupId,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        specifications: data.specifications,
        unit_price: data.unitPrice,
        total_amount: data.totalAmount,
        discount: data.discount || 0,
        tax_amount: data.taxAmount || 0,
        final_amount: data.finalAmount,
        status: 'pending',
        sales_employee_id: data.salesEmployeeId,
        expected_delivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
      },
      include: {
        customers: true,
        sales_employees: true,
        product_groups: true,
      },
    });
  }

  async update(id: number, data: UpdateOrderDto) {
    const order = await this.findOne(id);

    // Validate status transition if status is being changed
    if (data.status && data.status !== order.status) {
      this.validateStatusTransition(order.status, data.status as order_status);
    }

    return this.prisma.orders.update({
      where: { id },
      data: {
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        specifications: data.specifications,
        unit_price: data.unitPrice,
        total_amount: data.totalAmount,
        discount: data.discount,
        tax_amount: data.taxAmount,
        final_amount: data.finalAmount,
        status: data.status as order_status,
        expected_delivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
        actual_delivery: data.actualDelivery ? new Date(data.actualDelivery) : undefined,
      },
      include: {
        customers: true,
        sales_employees: true,
        product_groups: true,
        payments: true,
      },
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.prisma.orders.delete({ where: { id } });
  }

  async addPayment(orderId: number, data: { amount: number; content: string; method?: string }) {
    const order = await this.findOne(orderId);
    const paymentCode = `PAY${Date.now().toString().slice(-8)}`;

    return this.prisma.payments.create({
      data: {
        payment_code: paymentCode,
        customer_id: order.customer_id,
        order_id: orderId,
        amount: data.amount,
        payment_method: data.method || 'transfer',
        notes: data.content,
        status: 'paid',
        paid_at: new Date(),
      },
    });
  }

  async getPayments(orderId: number) {
    return this.prisma.payments.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
  }

  // Get allowed status transitions for an order
  getAllowedTransitions(currentStatus: order_status): order_status[] {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }
}
