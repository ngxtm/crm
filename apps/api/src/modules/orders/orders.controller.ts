import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, AddPaymentDto } from './dto/order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders with optional filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'salesEmployeeId', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('salesEmployeeId') salesEmployeeId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.ordersService.findAll({
      status,
      salesEmployeeId: salesEmployeeId ? parseInt(salesEmployeeId) : undefined,
      customerId: customerId ? parseInt(customerId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.delete(id);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Add payment to order' })
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPaymentDto: AddPaymentDto,
  ) {
    return this.ordersService.addPayment(id, addPaymentDto);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get payment history for order' })
  getPayments(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getPayments(id);
  }

  @Get(':id/allowed-transitions')
  @ApiOperation({ summary: 'Get allowed status transitions for order' })
  async getAllowedTransitions(@Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.findOne(id);
    const allowedTransitions = this.ordersService.getAllowedTransitions(order.status);
    return {
      currentStatus: order.status,
      allowedTransitions,
    };
  }
}
