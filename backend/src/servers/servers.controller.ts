import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Req() req,
    @Body()
    body: {
      discordServerId: string;
      shopName: string;
      description?: string;
    },
  ) {
    return this.serversService.create({
      ...body,
      ownerId: req.user.id,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serversService.findOne(id);
  }

  @Get('discord/:discordServerId')
  async findByDiscordId(@Param('discordServerId') discordServerId: string) {
    return this.serversService.findByDiscordId(discordServerId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Req() req,
    @Body()
    body: Partial<{
      shopName: string;
      description: string;
      active: boolean;
    }>,
  ) {
    return this.serversService.update(id, req.user.id, body);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Param('id') id: string) {
    return this.serversService.getStats(id);
  }
}