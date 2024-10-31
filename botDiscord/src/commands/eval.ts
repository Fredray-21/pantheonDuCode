import {ApplicationCommandOptionType, EmbedBuilder, codeBlock} from "discord.js";
import {Command} from "../command";
import {inspect} from "util";

const evalCommand = new Command({
    name: 'eval',
    description: 'Evaluate code (Super-User Only)',
    options: [
        {
            name: "code",
            description: "Code à exécuter",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "ephemeral",
            description: "Réponse ephemeral ?",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        }
    ],
    async run(interaction, client) {
        const code = interaction.options.getString("code");
        const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;
        if (interaction.user.id !== "325674117833424911") {
            await interaction.reply({content: "no.", ephemeral: true});
            return;
        }
        await interaction.deferReply({ephemeral, fetchReply: true});
        try {
            let evaled = await eval(code);
            let content = inspect(evaled);
            interaction
                .editReply({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            codeBlock("js", content.length > 4087
                                ? `${content.substring(0, 4084)}...`
                                : content)
                        ),
                    ],
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