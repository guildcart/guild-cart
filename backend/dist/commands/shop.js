"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const apiClient_1 = require("../utils/apiClient");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('shop')
    .setDescription('Afficher la boutique du serveur');
async function execute(interaction) {
    await interaction.deferReply();
    try {
        if (!interaction.guildId) {
            return interaction.editReply({
                content: '❌ Cette commande ne peut être utilisée que dans un serveur.',
            });
        }
        const products = await apiClient_1.apiClient.getServerProducts(interaction.guildId);
        if (!products || products.length === 0) {
            return interaction.editReply({
                content: '🛒 Cette boutique est vide pour le moment.\n\nℹ️ Si tu es propriétaire du serveur, utilise `/setup` pour configurer ta boutique.',
            });
        }
        const shopEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🛍️ Boutique - ' + interaction.guild?.name)
            .setDescription('Découvre nos produits exclusifs !\n\n')
            .setThumbnail(interaction.guild?.iconURL() || '')
            .setFooter({ text: 'Paiements sécurisés via Stripe' })
            .setTimestamp();
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
        const rows = [];
        const productsPerRow = Math.min(5, displayProducts.length);
        for (let i = 0; i < displayProducts.length; i += productsPerRow) {
            const row = new discord_js_1.ActionRowBuilder();
            const chunk = displayProducts.slice(i, i + productsPerRow);
            for (const product of chunk) {
                row.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`buy_product:${product.id}`)
                    .setLabel(`Acheter ${product.name.substring(0, 20)}`)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('🛒'));
            }
            rows.push(row);
        }
        const miniAppRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('open_miniapp')
            .setLabel('Ouvrir la boutique (Mini-App)')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🚀')
            .setDisabled(true));
        rows.push(miniAppRow);
        await interaction.editReply({
            embeds: [shopEmbed],
            components: rows,
        });
        logger_1.logger.info(`Boutique affichée pour ${interaction.user.tag} sur ${interaction.guild?.name}`);
    }
    catch (error) {
        logger_1.logger.error('Erreur dans la commande /shop:', error);
        await interaction.editReply({
            content: '❌ Erreur lors de la récupération de la boutique. Le serveur n\'est peut-être pas encore configuré.',
        });
    }
}
//# sourceMappingURL=shop.js.map