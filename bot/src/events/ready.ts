import { Client, Events, ActivityType } from 'discord.js';
import { logger } from '../utils/logger';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
  if (!client.user) return;

  logger.info(`✅ Bot connecté en tant que ${client.user.tag}`);
  logger.info(`🔗 Sur ${client.guilds.cache.size} serveurs`);

  // Définir le statut du bot
  client.user.setPresence({
    activities: [{
      name: '/shop pour voir la boutique',
      type: ActivityType.Playing,
    }],
    status: 'online',
  });

  // Logger les serveurs
  client.guilds.cache.forEach(guild => {
    logger.debug(`- ${guild.name} (${guild.id}) - ${guild.memberCount} membres`);
  });
}