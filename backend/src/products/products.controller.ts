import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { ProductType } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post('server/:serverId')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Param('serverId') serverId: string,
    @Req() req,
    @Body()
    body: {
      name: string;
      description: string;
      price: number;
      type: ProductType;
      fileUrl?: string;
      discordRoleId?: string;
      stock?: number;
    },
  ) {
    return this.productsService.create(serverId, req.user.id, body);
  }

  @Get('server/:serverId')
  async findAll(
    @Param('serverId') serverId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.productsService.findAll(serverId, activeOnly !== 'false');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Req() req,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      price: number;
      fileUrl: string;
      discordRoleId: string;
      stock: number;
      active: boolean;
    }>,
  ) {
    return this.productsService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string, @Req() req) {
    return this.productsService.delete(id, req.user.id);
  }
}