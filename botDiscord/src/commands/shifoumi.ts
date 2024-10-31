import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    CommandInteraction,
    CacheType,
    ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../command";
import { pocBotClient } from "..";

const sfmCommand = new Command({
    name: "shifoumi",
    description: "Lance un duel de Pierre-Feuille-Ciseaux avec un autre joueur.",
    options: [
        {
            name: "adversaire",
            description: "L'utilisateur que vous voulez défier.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async run(interaction: CommandInteraction<CacheType>, client: pocBotClient): Promise<void> {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        
        const initiator = interaction.user;
        const adversaire = interaction.options.getUser("adversaire");

        if (!adversaire || adversaire.bot) {
            await interaction.reply("Veuillez mentionner un utilisateur valide qui n'est pas un bot.");
            return;
        }

        if (adversaire.id === initiator.id) {
            await interaction.reply("Vous ne pouvez pas vous défier vous-même !");
            return;
        }

        const duelEmbed = new EmbedBuilder()
            .setTitle("Duel de Pierre-Feuille-Ciseaux")
            .setDescription(`${initiator} a défié ${adversaire} à un duel de Pierre-Feuille-Ciseaux !`)
            .setColor(0x1abc9c);

        const acceptDenyButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("accept").setLabel("Accepter").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("decline").setLabel("Refuser").setStyle(ButtonStyle.Danger)
        );

        const duelMessage = await interaction.reply({
            embeds: [duelEmbed],
            components: [acceptDenyButtons],
            fetchReply: true,
        });

        const collector = duelMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.user.id !== adversaire.id) {
                return buttonInteraction.reply({
                    content: "Ce bouton n'est pas pour vous.",
                    ephemeral: true,
                });
            }

            if (buttonInteraction.customId === "decline") {
                collector.stop("declined");
                return buttonInteraction.update({
                    embeds: [duelEmbed.setDescription(`${adversaire} a refusé le duel.`).setColor(0xe74c3c)],
                    components: [],
                });
            }

            if (buttonInteraction.customId === "accept") {
                collector.stop("accepted");

                const choices = ["Pierre", "Feuille", "Ciseaux"];
                const userChoices: { [key: string]: string | null } = {
                    [initiator.id]: null,
                    [adversaire.id]: null,
                };

                for (const player of [initiator, adversaire]) {
                    await player.send({
                        content: "Faites votre choix !",
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                choices.map((choice) =>
                                    new ButtonBuilder()
                                        .setCustomId(choice)
                                        .setLabel(choice)
                                        .setStyle(ButtonStyle.Primary)
                                )
                            ),
                        ],
                    }).then((msg) => {
                        const dmCollector = msg.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 30000,
                            max: 1,
                        });

                        dmCollector.on("collect", (dmInteraction) => {
                            userChoices[player.id] = dmInteraction.customId;
                            dmInteraction.reply({ content: `Vous avez choisi : ${dmInteraction.customId}`, ephemeral: true });

                            if (userChoices[initiator.id] && userChoices[adversaire.id]) {
                                const initiatorChoice = userChoices[initiator.id]!;
                                const adversaireChoice = userChoices[adversaire.id]!;

                                let resultMessage = "";

                                if (initiatorChoice === adversaireChoice) {
                                    resultMessage = "Egalité !";
                                } else if (
                                    (initiatorChoice === "Pierre" && adversaireChoice === "Ciseaux") ||
                                    (initiatorChoice === "Feuille" && adversaireChoice === "Pierre") ||
                                    (initiatorChoice === "Ciseaux" && adversaireChoice === "Feuille")
                                ) {
                                    resultMessage = `${initiator} a gagné avec ${initiatorChoice} contre ${adversaireChoice} !`;
                                } else {
                                    resultMessage = `${adversaire} a gagné avec ${adversaireChoice} contre ${initiatorChoice} !`;
                                }

                                interaction.channel?.send(resultMessage);
                            }
                        });
                    });
                }

                return buttonInteraction.update({
                    embeds: [duelEmbed.setDescription("Le duel a commencé ! Vérifiez vos messages privés pour faire votre choix.")],
                    components: [],
                });
            }
        });

        collector.on("end", (_, reason) => {
            if (!["accepted","declined"].includes(reason)) {
                duelEmbed.setDescription("Le duel a expiré. Personne n'a répondu.");
                interaction.editReply({ embeds: [duelEmbed], components: [] });
            }
        });
    },
});

export default sfmCommand;
