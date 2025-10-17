// bot/src/services/deliveryService.ts
// ✅ CORRIGÉ : ACCOUNT remplacé par SERIAL

import { Client, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { logger } from '../utils/logger';
import { apiClient } from '../utils/apiClient';
import { sendEmail } from './emailService';
import axios from 'axios';

export async function deliverProduct(
  client: Client,
  data: {
    orderId: string;
    userId: string;
    productId: string;
    productType: string;
    deliveryData: any;
  }
) {
  const { orderId, userId, productId, productType, deliveryData } = data;

  try {
    const user = await client.users.fetch(userId);
    const product = await apiClient.getProduct(productId);

    let dmSent = false;
    let emailSent = false;

    try {
      await sendDM(user, product, productType, deliveryData);
      dmSent = true;
      logger.info(`✅ Produit livré en DM à ${user.tag}`);
    } catch (error: any) {
      logger.warn(`⚠️ Impossible d'envoyer en DM à ${user.tag}:`, error.message);
      
      if (error.code === 50007 || error.message.includes('Cannot send messages')) {
        try {
          await sendEmailDelivery(user, product, productType, deliveryData);
          emailSent = true;
          logger.info(`📧 Produit livré par email à ${user.tag}`);
        } catch (emailError) {
          logger.error('Erreur lors de l\'envoi par email:', emailError);
          throw new Error('Impossible de livrer le produit (DM et email échoués)');
        }
      } else {
        throw error;
      }
    }

    await apiClient.markOrderAsDelivered(orderId, JSON.stringify({
      dmSent,
      emailSent,
      deliveredAt: new Date().toISOString(),
    }));

    return { success: true, dmSent, emailSent };
  } catch (error) {
    logger.error('Erreur lors de la livraison du produit:', error);
    throw error;
  }
}

async function sendDM(
  user: any,
  product: any,
  productType: string,
  deliveryData: any
) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Achat confirmé !')
    .setDescription(`Merci pour ton achat de **${product.name}** !`)
    .setTimestamp();

  let files: AttachmentBuilder[] = [];

  switch (productType) {
    case 'PDF':
      if (product.fileUrl) {
        embed.addFields({
          name: '📄 Fichier PDF',
          value: 'Ton fichier est joint à ce message.',
        });

        try {
          const response = await axios.get(product.fileUrl, {
            responseType: 'arraybuffer',
          });
          const buffer = Buffer.from(response.data);
          const attachment = new AttachmentBuilder(buffer, {
            name: `${product.name}.pdf`,
          });
          files.push(attachment);
        } catch (error) {
          logger.error('Erreur lors du téléchargement du PDF:', error);
          embed.addFields({
            name: '🔗 Lien de téléchargement',
            value: product.fileUrl,
          });
        }
      }
      break;

    case 'SERIAL':  // ✅ SERIAL au lieu de ACCOUNT
      if (deliveryData) {
        // ✅ Format nouveau : Array de strings
        const serialInfo = typeof deliveryData === 'string' 
          ? JSON.parse(deliveryData) 
          : deliveryData;

        // Si c'est un array de strings (nouveau format)
        if (Array.isArray(serialInfo) && typeof serialInfo[0] === 'string') {
          embed.addFields({
            name: '🔑 Ton Serial / Clé',
            value: '```' + serialInfo[0] + '```',
          });
        }
        // Rétrocompatibilité ancien format login:password
        else if (serialInfo.login && serialInfo.password) {
          embed.addFields({
            name: '🔑 Informations de connexion',
            value: '```' + 
              `Login: ${serialInfo.login}\n` +
              `Password: ${serialInfo.password}` +
              '```',
          });
        }
        
        embed.addFields({
          name: '⚠️ Important',
          value: 'Garde ces informations en sécurité. Ne les partage avec personne.',
        });
      }
      break;

    case 'ROLE':
      embed.addFields({
        name: '👑 Rôle Discord',
        value: `Le rôle a été automatiquement ajouté à ton compte !\nTu peux maintenant accéder aux salons VIP.`,
      });
      break;
  }

  embed.setFooter({ 
    text: 'Support disponible • Utilise /inventory pour revoir tes achats' 
  });

  await user.send({ 
    embeds: [embed],
    files: files.length > 0 ? files : undefined,
  });
}

async function sendEmailDelivery(
  user: any,
  product: any,
  productType: string,
  deliveryData: any
) {
  let emailContent = `
    <h2>✅ Achat confirmé !</h2>
    <p>Merci pour ton achat de <strong>${product.name}</strong> !</p>
  `;

  switch (productType) {
    case 'PDF':
      emailContent += `
        <p>📄 <strong>Fichier PDF :</strong></p>
        <p><a href="${product.fileUrl}" style="background-color: #5865F2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger le fichier</a></p>
      `;
      break;

    case 'SERIAL':  // ✅ SERIAL au lieu de ACCOUNT
      if (deliveryData) {
        const serialInfo = typeof deliveryData === 'string' 
          ? JSON.parse(deliveryData) 
          : deliveryData;

        if (Array.isArray(serialInfo) && typeof serialInfo[0] === 'string') {
          emailContent += `
            <p>🔑 <strong>Ton serial / clé :</strong></p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; font-family: monospace;">
              ${serialInfo[0]}
            </div>
            <p>⚠️ <strong>Important :</strong> Garde cette clé en sécurité.</p>
          `;
        } else if (serialInfo.login && serialInfo.password) {
          emailContent += `
            <p>🔑 <strong>Informations de connexion :</strong></p>
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; font-family: monospace;">
              <strong>Login:</strong> ${serialInfo.login}<br>
              <strong>Password:</strong> ${serialInfo.password}
            </div>
            <p>⚠️ <strong>Important :</strong> Garde ces informations en sécurité.</p>
          `;
        }
      }
      break;

    case 'ROLE':
      emailContent += `
        <p>👑 Le rôle Discord a été automatiquement ajouté à ton compte !</p>
        <p>Connecte-toi à Discord pour accéder aux salons VIP.</p>
      `;
      break;
  }

  emailContent += `
    <hr>
    <p style="color: #888; font-size: 12px;">
      ℹ️ Ce produit a été envoyé par email car tes messages privés Discord sont désactivés.<br>
      Pour recevoir les prochains achats en DM, active les messages privés sur Discord.
    </p>
  `;

  await sendEmail({
    to: user.email || `${user.id}@discord-fallback.com`,
    subject: `✅ Ton achat : ${product.name}`,
    html: emailContent,
  });
}