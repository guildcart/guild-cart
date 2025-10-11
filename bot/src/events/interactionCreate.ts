import { Client, Events, Interaction } from 'discord.js';
import { logger } from '../utils/logger';
import { handleBuyButton } from '../handlers/buyHandler';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction, client: Client) {
  // Gérer les commandes slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Commande inconnue: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
      logger.info(`Commande ${interaction.commandName} exécutée par ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Erreur lors de l'exécution de ${interaction.commandName}:`, error);
      
      const errorMessage = {
        content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  // Gérer les boutons
  if (interaction.isButton()) {
    const [action, ...params] = interaction.customId.split(':');

    try {
      switch (action) {
        case 'buy_product':
          await handleBuyButton(interaction, params[0]);
          break;

        case 'open_miniapp':
          await interaction.reply({
            content: '🚀 Ouverture de la boutique...',
            ephemeral: true,
          });
          // TODO: Lancer la mini-app Discord
          break;

        default:
          logger.warn(`Action de bouton inconnue: ${action}`);
      }
    } catch (error) {
      logger.error('Erreur lors du traitement du bouton:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue.',
        ephemeral: true,
      });
    }
  }
}