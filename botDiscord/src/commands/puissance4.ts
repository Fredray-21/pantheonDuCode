import {
    ApplicationCommandOptionType,
    CommandInteraction,
    ChatInputCommandInteraction,
    CacheType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from "discord.js";
import { Command } from "../command";
import { pocBotClient } from "..";

const COLS = 7;
const ROWS = 6;

const initBoard = (): string[][] => Array.from({ length: ROWS }, () => Array(COLS).fill("⚪"));

const checkWin = (board: string[][], symbol: string): boolean => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (
                c <= COLS - 4 &&
                board[r][c] === symbol &&
                board[r][c + 1] === symbol &&
                board[r][c + 2] === symbol &&
                board[r][c + 3] === symbol
            ) return true;
            if (
                r <= ROWS - 4 &&
                board[r][c] === symbol &&
                board[r + 1][c] === symbol &&
                board[r + 2][c] === symbol &&
                board[r + 3][c] === symbol
            ) return true;
            if (
                r <= ROWS - 4 &&
                c <= COLS - 4 &&
                board[r][c] === symbol &&
                board[r + 1][c + 1] === symbol &&
                board[r + 2][c + 2] === symbol &&
                board[r + 3][c + 3] === symbol
            ) return true;
            if (
                r >= 3 &&
                c <= COLS - 4 &&
                board[r][c] === symbol &&
                board[r - 1][c + 1] === symbol &&
                board[r - 2][c + 2] === symbol &&
                board[r - 3][c + 3] === symbol
            ) return true;
        }
    }
    return false;
};

const puissance4Command = new Command({
    name: "puissance4",
    description: "Jouez à Puissance 4 en duel ou contre un bot.",
    options: [
        {
            name: "adversaire",
            description: "L'utilisateur que vous voulez défier, ou laissez vide pour jouer contre le bot.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    async run(interaction: CommandInteraction<CacheType>, client: pocBotClient): Promise<void> {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;

        const adversaire = interaction.options.getUser("adversaire");
        const isVsBot = !adversaire;
        const player1 = interaction.user;
        const player2 = adversaire || client.user;

        if (adversaire) {
            if (adversaire.id === client.user.id) {
                await interaction.reply({ content: "Je ne peux pas jouer contre moi-même.", ephemeral: true });
                return;
            }

            if (adversaire.bot) {
                await interaction.reply({ content: "Je ne peux pas jouer contre un autre bot.", ephemeral: true });
                return;
            }

            const inviteEmbed = new EmbedBuilder()
                .setTitle("Défi Puissance 4")
                .setDescription(`<@${player2.id}> : ${player1.username} vous défie à Puissance 4 ! Acceptez-vous ?`)
                .setColor(0x00AE86);

            const acceptButton = new ButtonBuilder()
                .setCustomId("accept")
                .setLabel("Accepter")
                .setStyle(ButtonStyle.Success);

            const declineButton = new ButtonBuilder()
                .setCustomId("decline")
                .setLabel("Refuser")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, declineButton);

            await interaction.reply({
                embeds: [inviteEmbed],
                components: [row],
            });

            const inviteMessage = await interaction.fetchReply();
            const collector = inviteMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000,
            });

            collector.on("collect", async (buttonInteraction) => {
                if (buttonInteraction.user.id !== adversaire.id) {
                    await buttonInteraction.reply({ content: "Ce défi n'est pas pour vous.", ephemeral: true });
                    return;
                }

                if (buttonInteraction.customId === "accept") {
                    await buttonInteraction.update({ content: "Défi accepté ! Préparons le plateau de jeu...", components: [] });
                    await startGame(interaction, player1, player2, client, isVsBot);
                } else {
                    await buttonInteraction.update({ content: "Défi refusé.", components: [] });
                }
                collector.stop();
            });

            collector.on("end", async (_, reason) => {
                if (reason === "time") {
                    await interaction.editReply({ content: "Le défi a expiré.", components: [] });
                }
            });
        } else {
            await interaction.reply({ content: "Défi accepté ! Préparons le plateau de jeu...", ephemeral: false });
            await startGame(interaction, player1, player2, client, isVsBot);
        }
    },
});

async function startGame(interaction: CommandInteraction<CacheType>, player1, player2, client: pocBotClient, isVsBot: boolean) {

    try {

        const board = initBoard();
        let currentPlayer = player1;
        const symbols = { [player1.id]: "🔴", [player2!.id]: "🟡" };

        const updateBoardMessage = () => {
            const boardDisplay = board.map((row) => row.join(" ")).join("\n");
            const columnNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'].join(" ");
            return `${boardDisplay}\n${columnNumbers}`;
        };

        const playTurn = async (column: number) => {
            for (let row = ROWS - 1; row >= 0; row--) {
                if (board[row][column] === "⚪") {
                    board[row][column] = symbols[currentPlayer.id];
                    return true;
                }
            }
            return false;
        };

        const gameEmbed = new EmbedBuilder()
            .setTitle("Puissance 4")
            .setDescription(updateBoardMessage())
            .setFooter({ text: `${currentPlayer.username}, choisissez une colonne!` });

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...Array.from({ length: 4 }, (_, i) =>
                new ButtonBuilder()
                    .setCustomId(`${i}`)
                    .setLabel((i + 1).toString())
                    .setStyle(ButtonStyle.Primary)
            )
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...Array.from({ length: 3 }, (_, i) =>
                new ButtonBuilder()
                    .setCustomId(`${i + 4}`)
                    .setLabel((i + 5).toString())
                    .setStyle(ButtonStyle.Primary)
            )
        );

        const gameMessage = await interaction.followUp({
            embeds: [gameEmbed],
            components: [row1, row2],
            fetchReply: true,
        });

        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000,
        });

        collector.on("collect", async (btnInteraction) => {
            if (btnInteraction.user.id !== currentPlayer.id) {
                await btnInteraction.reply({ content: "Ce n'est pas votre tour!", ephemeral: true });
                return;
            }

            const column = parseInt(btnInteraction.customId, 10);
            if (!(await playTurn(column))) {
                await btnInteraction.reply({ content: "Cette colonne est pleine !", ephemeral: true });
                return;
            }

            gameEmbed.setDescription(updateBoardMessage());
            if (checkWin(board, symbols[currentPlayer.id])) {
                gameEmbed.setFooter(null);
                gameEmbed.setDescription(`🎉 ${currentPlayer} a gagné !\n\n` + updateBoardMessage());
                collector.stop("win");
                await gameMessage.edit({ embeds: [gameEmbed], components: [] });
                return;
            }

            currentPlayer = currentPlayer.id === player1.id ? player2 : player1;
            gameEmbed.setFooter({ text: `Tour de ${currentPlayer.username} : ${symbols[currentPlayer.id]}` });
            await btnInteraction.update({
                embeds: [gameEmbed],
                components: [row1, row2],
            });

            if (isVsBot && currentPlayer.id === client.user!.id) {
                // Boucle pour que le bot choisisse une colonne non pleine
                let botChoice;
                let botTurnSuccess = false;
                while (!botTurnSuccess) {
                    botChoice = Math.floor(Math.random() * COLS); // Choix de colonne aléatoire
                    botTurnSuccess = await playTurn(botChoice); // Exécute le tour du bot et vérifie s'il est réussi
                }
            
                gameEmbed.setDescription(updateBoardMessage());
               

                // Vérifie si le bot a gagné
                if (checkWin(board, symbols[currentPlayer.id])) {
                    gameEmbed.setFooter(null);
                    gameEmbed.setDescription(`🎉 ${currentPlayer} (Bot) a gagné !\n\n` + updateBoardMessage());
                    collector.stop("win");
                    await gameMessage.edit({ embeds: [gameEmbed], components: [] });
                    return;
                }
            
                currentPlayer = currentPlayer.id === player1.id ? player2 : player1;
                gameEmbed.setFooter({ text: `Tour de ${currentPlayer.username} : ${symbols[currentPlayer.id]}` });
                
                // Met à jour le plateau pour que le joueur humain voie le résultat du tour du bot
                await gameMessage.edit({
                    embeds: [gameEmbed],
                    components: [row1, row2],
                });
            
                // Retour au joueur humain
                currentPlayer = player1;
                gameEmbed.setFooter({ text: `Tour de ${currentPlayer.username}` });
            }
            
        });

        collector.on("end", async (_, reason) => {
            if (reason !== "win") {
                await gameMessage.edit({
                    embeds: [gameEmbed.setDescription("Temps écoulé ! Partie terminée.")],
                    components: [],
                });
            }
        });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: "Une erreur s'est produite lors de la création de la partie." });
    }
}



export default puissance4Command;
