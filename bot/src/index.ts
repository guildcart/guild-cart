import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { loadCommands } from './utils/commandLoader';
import { initializeQueue } from './services/queueService';
import { initializeEmailService } from './services/emailService';
import path from 'path';
import fs from 'fs';

// Charger les variables d'environnement
dotenv.config();

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

// Collection pour stocker les commandes
client.commands = new Collection();

// Initialisation
async function init() {
  try {
    logger.info('🤖 Démarrage du bot Discord Shop...');

    // Initialiser le service email
    initializeEmailService();

    // Charger les commandes
    await loadCommands(client);
    logger.info(`✅ ${client.commands.size} commandes chargées`);

    // Initialiser la queue de livraison
    await initializeQueue(client);
    logger.info('✅ Queue de livraison initialisée');

    // Charger les event handlers
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = ['ready', 'interactionCreate', 'guildCreate'];

    for (const file of eventFiles) {
      try {
        const event = await import(`./events/${file}`);
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        logger.info(`✅ Event ${event.name} chargé`);
      } catch (error) {
        logger.error(`❌ Erreur lors du chargement de l'event ${file}:`, error);
      }
    }

    // Se connecter à Discord
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Démarrer le bot
init();

// Export pour TypeScript
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}