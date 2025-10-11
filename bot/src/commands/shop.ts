import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Afficher la boutique du serveur');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    if (!interaction.guildId) {
      return interaction.editReply({
        content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
      });
    }

    // Récupérer les produits du serveur
    const products = await apiClient.getServerProducts(interaction.guildId);

    if (!products || products.length === 0) {
      return interaction.editReply({
        content: '🛒 Cette boutique est vide pour le moment.\n\nℹ️ Si tu es propriétaire du serveur, utilise `/setup` pour configurer ta boutique.',
      });
    }

    // Créer l'embed principal
    const shopEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🛍️ Boutique - ' + interaction.guild?.name)
      .setDescription('Découvre nos produits exclusifs !\n\n')
      .setThumbnail(interaction.guild?.iconURL() || '')
      .setFooter({ text: 'Paiements sécurisés via Stripe' })
      .setTimestamp();

    // Ajouter les produits à l'embed (max 10 produits)
    const displayProducts = products.slice(0, 10);
    
    for (const product of displayProducts) {
      const emoji = product.type === 'PDF' ? '📄' : product.type === 'ROLE' ? '👑' : '🔑';
      const stock = product.stock !== null ? `\n📦 Stock: ${product.stock}` : '';
      
      shopEmbed.addFields({
        name: `${emoji} ${product.name}`,
        value: `${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n💰 **${product.price}€**${stock}\n🛒 ${product.salesCount} ventes`,
        inline: false,
      });
    }

    // Créer les boutons (max 5 boutons par row)
    const rows = [];
    const productsPerRow = Math.min(5, displayProducts.length);
    
    for (let i = 0; i < displayProducts.length; i += productsPerRow) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      const chunk = displayProducts.slice(i, i + productsPerRow);
      
      for (const product of chunk) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_product:${product.id}`)
            .setLabel(`Acheter ${product.name.substring(0, 20)}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛒')
        );
      }
      rows.push(row);
    }

    // Ajouter un bouton pour ouvrir la mini-app (bientôt)
    const miniAppRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('open_miniapp')
        .setLabel('Ouvrir la boutique (Mini-App)')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀')
        .setDisabled(true) // Désactivé pour l'instant
    );
    rows.push(miniAppRow);

    await interaction.editReply({
      embeds: [shopEmbed],
      components: rows,
    });

    logger.info(`Boutique affichée pour ${interaction.user.tag} sur ${interaction.guild?.name}`);
  } catch (error) {
    logger.error('Erreur dans la commande /shop:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de la récupération de la boutique. Le serveur n\'est peut-être pas encore configuré.',
    });
  }
}