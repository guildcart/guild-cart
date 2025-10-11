import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
export declare const data: SlashCommandBuilder;
export declare function execute(interaction: ChatInputCommandInteraction): Promise<import("discord.js").Message<boolean>>;
