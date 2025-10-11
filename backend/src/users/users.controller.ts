import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req) {
    return req.user;
  }

  @Get('my-servers')
  async getMyServers(@Req() req) {
    return this.usersService.getOwnedServers(req.user.id);
  }

  @Get('my-orders')
  async getMyOrders(@Req() req) {
    return this.usersService.getOrders(req.user.id);
  }
}