import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Voir tes achats');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Récupérer les commandes de l'utilisateur
    const orders = await apiClient.getUserOrders(interaction.user.id);

    if (!orders || orders.length === 0) {
      return interaction.editReply({
        content: '📦 Ton inventaire est vide.\n\nUtilise `/shop` pour voir les produits disponibles !',
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📦 Ton Inventaire')
      .setDescription('Retrouve tous tes achats ici')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: `${orders.length} achat(s) au total` })
      .setTimestamp();

    // Grouper par statut
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING');

    if (completedOrders.length > 0) {
      const ordersList = completedOrders.slice(0, 10).map((order: any) => {
        const emoji = order.product.type === 'PDF' ? '📄' : 
                     order.product.type === 'ROLE' ? '👑' : '🔑';
        const date = new Date(order.createdAt).toLocaleDateString('fr-FR');
        return `${emoji} **${order.product.name}** - ${date}`;
      }).join('\n');

      embed.addFields({
        name: '✅ Achats livrés',
        value: ordersList,
        inline: false,
      });
    }

    if (pendingOrders.length > 0) {
      const pendingList = pendingOrders.map((order: any) => {
        return `⏳ **${order.product.name}** - En cours...`;
      }).join('\n');

      embed.addFields({
        name: '⏳ En attente',
        value: pendingList,
        inline: false,
      });
    }

    embed.addFields({
      name: 'ℹ️ Info',
      value: 'Les produits sont livrés en DM privé.\nSi tu ne les as pas reçus, vérifie tes messages ou contacte le support.',
      inline: false,
    });

    await interaction.editReply({ embeds: [embed] });

    logger.info(`Inventaire consulté par ${interaction.user.tag}`);
  } catch (error) {
    logger.error('Erreur dans la commande /inventory:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de la récupération de ton inventaire.',
    });
  }
}