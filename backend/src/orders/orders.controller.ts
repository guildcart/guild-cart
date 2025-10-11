import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('server/:serverId')
  @UseGuards(AuthGuard('jwt'))
  async getServerOrders(@Param('serverId') serverId: string) {
    return this.ordersService.getServerOrders(serverId);
  }

  @Get('user/my-orders')
  @UseGuards(AuthGuard('jwt'))
  async getMyOrders(@Req() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  // NOUVELLE ROUTE pour le bot (sans JWT, avec API key)
  @Get('user/:userId')
  async getUserOrdersByUserId(@Param('userId') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }
}