import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, codeBlock } from "discord.js";
import { Command } from "../command";

const evalCommand = new Command({
    name: 'ping',
    description: 'Ping the bot',
    async run(interaction) {
        await interaction.deferReply({ ephemeral: false, fetchReply: true });
        try {
            const pingembed = new EmbedBuilder()
                .setColor("#5865f4")
                .setTitle(`🏓  P${"o".repeat(Math.round(interaction.client.ws.ping)/20)}ong!`)
                .addFields({
                    name: "**Api** latency",
                    value: `> **${Math.round(interaction.client.ws.ping)}**ms`,
                    inline: false,
                })
                .setTimestamp();

            const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel("Discord Ping")
                    .setStyle(5)
                    .setEmoji("💻")
                    .setURL("https://discordstatus.com/")
            );

            interaction
                .editReply({
                    embeds: [pingembed],
                    components: [button],
                })
                .catch((e) => console.log(e));
        } catch (e) {
            interaction
                .editReply({
                    embeds: [
                        new EmbedBuilder().setDescription(codeBlock("fix", e))
                    ],
                })
                .catch((e) => console.log(e));
            return;
        }
    },
});

export default evalCommand;