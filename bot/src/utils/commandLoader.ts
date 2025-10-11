import { Client } from 'discord.js';
import path from 'path';
import { logger } from './logger';

export async function loadCommands(client: Client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = ['shop', 'inventory', 'setup'];

  for (const file of commandFiles) {
    try {
      const command = await import(`${commandsPath}/${file}`);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.debug(`Commande chargée: ${command.data.name}`);
      } else {
        logger.warn(`La commande ${file} n'a pas de propriété 'data' ou 'execute'`);
      }
    } catch (error) {
      logger.error(`Erreur lors du chargement de la commande ${file}:`, error);
    }
  }
}