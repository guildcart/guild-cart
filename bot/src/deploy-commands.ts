import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function deployCommands() {
  const commands = [];

  // Charger toutes les commandes
  const commandFiles = ['shop', 'inventory', 'setup'];

  for (const file of commandFiles) {
    try {
      const command = await import(`./commands/${file}`);
      commands.push(command.data.toJSON());
      console.log(`✅ Commande chargée: ${command.data.name}`);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${file}:`, error);
    }
  }

  // Construire et déployer les commandes
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log(`🚀 Déploiement de ${commands.length} commandes...`);

    const data: any = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands },
    );

    console.log(`✅ ${data.length} commandes déployées avec succès !`);
    
    data.forEach((cmd: any) => {
      console.log(`  - /${cmd.name}: ${cmd.description}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes:', error);
    process.exit(1);
  }
}

deployCommands();