import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { apiClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configurer la boutique (admin uniquement)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guildId || !interaction.guild) {
      return interaction.editReply({
        content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
      });
    }

    // Vérifier si le serveur existe déjà
    let server;
    try {
      server = await apiClient.getServer(interaction.guildId);
    } catch (error) {
      // Le serveur n'existe pas encore, on va le créer
      server = null;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('⚙️ Configuration de la Boutique')
      .setThumbnail(interaction.guild.iconURL())
      .setTimestamp();

    if (server) {
      embed.setDescription(
        '✅ **Ta boutique est déjà configurée !**\n\n' +
        'Pour la gérer, utilise le panel web.'
      );

      embed.addFields(
        {
          name: '📊 Informations',
          value: 
            `**Nom:** ${server.shopName}\n` +
            `**Plan:** ${server.subscriptionTier}\n` +
            `**Commission:** ${server.commissionRate}%\n` +
            `**Actif:** ${server.active ? '✅' : '❌'}`,
          inline: true,
        },
        {
          name: '📈 Statistiques',
          value: 
            `**Produits:** ${server._count?.products || 0}\n` +
            `**Commandes:** ${server._count?.orders || 0}`,
          inline: true,
        }
      );
    } else {
      embed.setDescription(
        '🎉 **Bienvenue dans Discord Shop Bot !**\n\n' +
        'Pour configurer ta boutique, suis ces étapes :'
      );

      embed.addFields(
        {
          name: '1️⃣ Accède au Panel Web',
          value: `[Ouvrir le dashboard](${process.env.FRONTEND_URL || 'http://localhost:5173'})`,
          inline: false,
        },
        {
          name: '2️⃣ Connecte-toi avec Discord',
          value: 'Utilise ton compte Discord pour te connecter',
          inline: false,
        },
        {
          name: '3️⃣ Configure Stripe',
          value: 'Connecte ton compte Stripe pour recevoir les paiements',
          inline: false,
        },
        {
          name: '4️⃣ Ajoute des produits',
          value: 'PDFs, comptes, rôles Discord... tout est possible !',
          inline: false,
        }
      );

      // Essayer de créer le serveur automatiquement
      try {
        await apiClient.createServer({
          discordServerId: interaction.guildId,
          shopName: interaction.guild.name + ' Shop',
          description: 'Boutique du serveur',
          ownerId: interaction.user.id,
        });

        embed.addFields({
          name: '✅ Serveur enregistré',
          value: 'Ton serveur a été automatiquement enregistré. Tu peux maintenant le configurer sur le panel web !',
          inline: false,
        });
      } catch (error) {
        logger.error('Erreur lors de la création du serveur:', error);
      }
    }

    embed.addFields(
      {
        name: '💰 Plans disponibles',
        value: 
          '**FREE** - 5% de commission\n' +
          '**STARTER** - 3.5% - 9€/mois\n' +
          '**PRO** - 2% - 29€/mois\n' +
          '**BUSINESS** - 1% - 99€/mois',
        inline: false,
      },
      {
        name: '📚 Commandes utiles',
        value: 
          '`/shop` - Afficher la boutique\n' +
          '`/inventory` - Voir ses achats\n' +
          '`/setup` - Cette commande',
        inline: false,
      }
    );

    embed.setFooter({ text: 'Besoin d\'aide ? Contacte le support' });

    await interaction.editReply({ embeds: [embed] });

    logger.info(`Setup consulté par ${interaction.user.tag} sur ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Erreur dans la commande /setup:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de la configuration.',
    });
  }
}