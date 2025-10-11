import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export async function handleBuyButton(interaction: ButtonInteraction, productId: string) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Récupérer le produit
    const product = await apiClient.getProduct(productId);

    if (!product) {
      return interaction.editReply({
        content: '❌ Ce produit n\'existe plus.',
      });
    }

    // Vérifier le stock
    if (product.stock !== null && product.stock <= 0) {
      return interaction.editReply({
        content: '❌ Ce produit est en rupture de stock.',
      });
    }

    if (!product.active) {
      return interaction.editReply({
        content: '❌ Ce produit n\'est plus disponible.',
      });
    }

    // Créer le Payment Intent
    const payment = await apiClient.createPaymentIntent(productId, interaction.user.id);

    // Créer l'embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Commande initiée !')
      .setDescription(
        `Tu es sur le point d'acheter :\n` +
        `**${product.name}**\n\n` +
        `💰 **Prix:** ${product.price}€`
      )
      .addFields(
        {
          name: '📦 Description',
          value: product.description.substring(0, 200),
          inline: false,
        },
        {
          name: '💳 Paiement',
          value: 
            '🔒 Paiement sécurisé via Stripe\n' +
            '⏱️ Ce lien expire dans 30 minutes\n' +
            '📧 Tu recevras le produit en DM ou par email',
          inline: false,
        }
      )
      .setFooter({ text: 'Clique sur le bouton ci-dessous pour payer' })
      .setTimestamp();

    // Envoyer le lien de paiement en DM
    try {
      const dmChannel = await interaction.user.createDM();
      
      await dmChannel.send({
        embeds: [confirmEmbed],
        content: `🔗 **Lien de paiement :** ${payment.stripeCheckoutUrl || 'https://checkout.stripe.com/...'}`,
      });

      await interaction.editReply({
        content: '✅ Je t\'ai envoyé le lien de paiement en message privé !\n\nVérifie tes DM 📬',
      });

      logger.info(`Lien de paiement envoyé à ${interaction.user.tag} pour ${product.name}`);
    } catch (error) {
      // Si impossible d'envoyer en DM, envoyer dans le channel
      logger.warn(`Impossible d'envoyer en DM à ${interaction.user.tag}`);

      await interaction.editReply({
        embeds: [confirmEmbed],
        content: 
          `⚠️ Je ne peux pas t'envoyer de message privé.\n\n` +
          `🔗 **Lien de paiement :** ${payment.stripeCheckoutUrl || 'https://checkout.stripe.com/...'}\n\n` +
          `💡 Active les messages privés pour plus de discrétion à l'avenir.`,
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors du traitement du bouton d\'achat:', error);
    
    let errorMessage = '❌ Une erreur est survenue lors de la création du paiement.';
    
    if (error.response?.data?.message) {
      errorMessage += `\n\n${error.response.data.message}`;
    }

    await interaction.editReply({
      content: errorMessage,
    });
  }
}