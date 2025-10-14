import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscordService } from './discord.service';

@Controller('discord')
@UseGuards(AuthGuard('jwt'))
export class DiscordController {
  constructor(private discordService: DiscordService) {}

  /**
   * GET /discord/:guildId/roles
   * Récupère la liste des rôles d'un serveur Discord
   */
  @Get(':guildId/roles')
  async getGuildRoles(@Param('guildId') guildId: string) {
    return this.discordService.getGuildRoles(guildId);
  }
}