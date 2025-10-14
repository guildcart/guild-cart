import { Events, Guild, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger';
import { apiClient } from '../utils/apiClient';

export const name = Events.GuildCreate;
export const once = false;

export async function execute(guild: Guild) {
  logger.info(`✅ Bot ajouté au serveur: ${guild.name} (${guild.id})`);

  try {
    // 1️⃣ Récupérer le propriétaire du serveur
    const owner = await guild.fetchOwner();

    // 2️⃣ Créer automatiquement le serveur et l'utilisateur dans la BDD
    try {
      await apiClient.createGuildInDatabase({
        guildId: guild.id,
        guildName: guild.name,
        ownerId: owner.id,
        ownerUsername: owner.user.username,
        ownerAvatar: owner.user.displayAvatarURL(),
      });

      logger.info(`✅ Serveur ${guild.name} créé dans la base de données`);
    } catch (error: any) {
      // Si le serveur existe déjà ou autre erreur, on log mais on continue
      if (error.response?.status === 409 || error.message?.includes('already exists')) {
        logger.warn(`⚠️ Le serveur ${guild.name} existe déjà dans la BDD`);
      } else {
        logger.error(`❌ Erreur lors de la création du serveur dans la BDD:`, error);
      }
    }

    // 3️⃣ Envoyer le message de bienvenue
    const channel = guild.systemChannel || guild.channels.cache.find(
      (c) => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has('SendMessages')
    );

    if (!channel || !channel.isTextBased()) {
      logger.warn('Impossible de trouver un salon pour envoyer le message de bienvenue');
      return;
    }

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👋 Merci d\'avoir ajouté Guild Cart !')
      .setDescription(
        'Transforme ton serveur Discord en boutique en ligne !\n\n' +
        '**✅ Ton serveur a été automatiquement enregistré !**\n\n' +
        '**Pour commencer :**\n' +
        '1️⃣ Connecte-toi au panel web avec Discord\n' +
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

    await channel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    logger.error('Erreur dans l\'événement guildCreate:', error);
  }
}