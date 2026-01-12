import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { DesignOrdersService } from './design-orders.service';
import { CreateDesignOrderDto, UpdateDesignOrderDto } from './dto/design-order.dto';

@Controller('design-orders')
export class DesignOrdersController {
  constructor(private readonly designOrdersService: DesignOrdersService) {}

  @Get()
  findAll() {
    return this.designOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designOrdersService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateDesignOrderDto) {
    return this.designOrdersService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDesignOrderDto) {
    return this.designOrdersService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designOrdersService.remove(id);
  }
}
