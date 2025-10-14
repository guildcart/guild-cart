import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { BotApiKeyGuard } from '../auth/guards/bot-api-key.guard';

@Controller('bot')
@UseGuards(BotApiKeyGuard)
export class BotController {
  constructor(private botService: BotService) {}

  /**
   * Endpoint appelé par le bot Discord quand il est ajouté à un serveur
   * Crée automatiquement l'utilisateur et le serveur dans la BDD
   */
  @Post('guild-create')
  @HttpCode(HttpStatus.CREATED)
  async handleGuildCreate(
    @Body()
    body: {
      guildId: string;
      guildName: string;
      ownerId: string;
      ownerUsername: string;
      ownerAvatar?: string;
    },
  ) {
    return this.botService.handleGuildCreate(body);
  }
}