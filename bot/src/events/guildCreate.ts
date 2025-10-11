import { Events, Guild, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger';

export const name = Events.GuildCreate;
export const once = false;

export async function execute(guild: Guild) {
  logger.info(`✅ Bot ajouté au serveur: ${guild.name} (${guild.id})`);

  // Essayer de trouver un salon où envoyer le message de bienvenue
  const channel = guild.systemChannel || guild.channels.cache.find(
    (c) => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has('SendMessages')
  );

  if (!channel || !channel.isTextBased()) {
    logger.warn('Impossible de trouver un salon pour envoyer le message de bienvenue');
    return;
  }

  const welcomeEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('👋 Merci d\'avoir ajouté Discord Shop Bot !')
    .setDescription(
      'Transforme ton serveur Discord en boutique en ligne !\n\n' +
      '**Pour commencer :**\n' +
      '1️⃣ Configure ta boutique sur le panel web\n' +
      '2️⃣ Ajoute tes produits (PDF, comptes, rôles)\n' +
      '3️⃣ Tes membres pourront acheter avec `/shop`\n\n' +
      '**Commandes disponibles :**\n' +
      '• `/shop` - Voir la boutique\n' +
      '• `/inventory` - Voir ses achats\n' +
      '• `/setup` - Configurer la boutique (admin)'
    )
    .addFields(
      {
        name: '🔗 Panel Web',
        value: `[Accéder au dashboard](${process.env.FRONTEND_URL || 'http://localhost:5173'})`,
        inline: true,
      },
      {
        name: '💰 Commissions',
        value: 'Plan FREE : 5%\nUpgrade disponible',
        inline: true,
      }
    )
    .setFooter({ text: 'Besoin d\'aide ? Utilise /setup' })
    .setTimestamp();

  try {
    await channel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du message de bienvenue:', error);
  }
}