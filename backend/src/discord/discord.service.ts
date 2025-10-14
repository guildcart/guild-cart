import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DiscordService {
  private readonly discordApiUrl = 'https://discord.com/api/v10';

  /**
   * Récupère les rôles d'un serveur Discord
   * Filtre pour ne retourner que les rôles que le bot peut assigner
   */
  async getGuildRoles(guildId: string) {
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const clientId = process.env.DISCORD_CLIENT_ID;
      
      if (!botToken) {
        throw new Error('DISCORD_BOT_TOKEN non défini dans .env');
      }

      if (!clientId) {
        throw new Error('DISCORD_CLIENT_ID non défini dans .env');
      }

      // 1️⃣ Récupérer tous les rôles du serveur
      const rolesResponse = await axios.get(
        `${this.discordApiUrl}/guilds/${guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      // 2️⃣ Récupérer les informations du bot dans le serveur
      const botMemberResponse = await axios.get(
        `${this.discordApiUrl}/guilds/${guildId}/members/${clientId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      const botRoleIds = botMemberResponse.data.roles;

      // 3️⃣ Trouver la position la plus élevée du bot
      const botRoles = rolesResponse.data.filter((role: any) => 
        botRoleIds.includes(role.id)
      );

      const highestBotPosition = Math.max(
        ...botRoles.map((role: any) => role.position),
        0
      );

      // 4️⃣ Filtrer les rôles que le bot peut assigner
      const assignableRoles = rolesResponse.data
        .filter((role: any) => {
          // Exclure @everyone
          if (role.name === '@everyone') return false;
          
          // Exclure les rôles managés (bots, boosts, intégrations)
          if (role.managed) return false;
          
          // Ne garder que les rôles en dessous du bot
          if (role.position >= highestBotPosition) return false;
          
          return true;
        })
        .map((role: any) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
        }))
        .sort((a: any, b: any) => b.position - a.position); // Trier par position (haut en bas)

      return assignableRoles;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Erreur lors de la récupération des rôles Discord',
        error.response?.status || 500
      );
    }
  }
}