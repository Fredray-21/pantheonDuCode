import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    CacheType,
    ComponentType,
    User,
    ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../command";
import { pocBotClient } from "..";

const tictactoeCommand = new Command({
    name: "tictactoe",
    description: "Lance une partie de Tic Tac Toe.",
    options: [
        {
            name: "adversaire",
            description: "L'utilisateur que vous voulez défier.",
            type: ApplicationCommandOptionType.User,
            required: false
        },
    ],
    async run(interaction: ChatInputCommandInteraction<CacheType>, client: pocBotClient): Promise<void> {

        // Déférer l'interaction pour éviter une erreur d'attente
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser("adversaire");
            const isAgainstBot = !targetUser;

            if (targetUser) {
                // si ce n'est pas moi
                if (targetUser.id === client.user.id) {
                    await interaction.followUp({ content: "Je ne peux pas jouer contre moi-même.", ephemeral: true });
                    return;
                }

                // Si ce n'est pas un bot
                if (targetUser.bot) {
                    await interaction.followUp({ content: "Je ne peux pas jouer contre un bot.", ephemeral: true });
                    return;
                }

                const inviteEmbed = new EmbedBuilder()
                    .setTitle("Défi Tic Tac Toe")
                    .setDescription(`${interaction.user.username} vous défie à un jeu de Tic Tac Toe ! Acceptez-vous ?`)
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

                const inviteMessage = await interaction.followUp({
                    embeds: [inviteEmbed],
                    components: [row],
                    fetchReply: true,
                });

                const collector = inviteMessage.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 60000,
                });

                collector.on("collect", async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== targetUser.id) {
                        await buttonInteraction.reply({ content: "Ce défi n'est pas pour vous.", ephemeral: true });
                        return;
                    }

                    if (buttonInteraction.customId === "accept") {
                        await buttonInteraction.update({ content: "Défi accepté !", embeds: [], components: [] });
                        await startGame(interaction, targetUser, isAgainstBot, client);
                    } else {
                        await buttonInteraction.update({ content: "Défi refusé.", embeds: [], components: [] });
                    }
                    collector.stop();
                });

                collector.on("end", async (_, reason) => {
                    if (reason === "time") {
                        await interaction.followUp({ content: "Le défi a expiré.", ephemeral: true });
                    }
                });
            } else {
                await startGame(interaction, null, isAgainstBot, client);
            }

        } catch (e) {
            console.error(e);
            await interaction.followUp({ content: "Une erreur s'est produite lors du lancement du jeu.", ephemeral: true });
        }
    },
});

// Fonction pour démarrer le jeu
async function startGame(interaction: ChatInputCommandInteraction<CacheType>, player2: User | null, isAgainstBot: boolean, client: pocBotClient): Promise<void> {
    let board = ["⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜", "⬜"];
    const playerSymbol = "❌";
    const opponentSymbol = "⭕";

    let currentPlayer = interaction.user;

    const generateBoardEmbed = (board: string[]): EmbedBuilder => {
        return new EmbedBuilder()
            .setTitle("Tic Tac Toe")
            .setDescription(
                `${board[0]} | ${board[1]} | ${board[2]}\n` +
                `---------\n` +
                `${board[3]} | ${board[4]} | ${board[5]}\n` +
                `---------\n` +
                `${board[6]} | ${board[7]} | ${board[8]}`
            )
            .setColor(0x00AE86)
            .setFooter({ text: `C'est au tour de ${currentPlayer.username}.` });
    };

    const checkWinner = (board: string[], symbol: string): boolean => {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winConditions.some(combination =>
            combination.every(index => board[index] === symbol)
        );
    };

    const generateBoardButtons = (board: string[]): ActionRowBuilder<ButtonBuilder>[] => [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...board.slice(0, 3).map((val, index) =>
                new ButtonBuilder()
                    .setCustomId(index.toString())
                    .setLabel(val)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(val !== "⬜")
            )
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...board.slice(3, 6).map((val, index) =>
                new ButtonBuilder()
                    .setCustomId((index + 3).toString())
                    .setLabel(val)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(val !== "⬜")
            )
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...board.slice(6, 9).map((val, index) =>
                new ButtonBuilder()
                    .setCustomId((index + 6).toString())
                    .setLabel(val)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(val !== "⬜")
            )
        ),
    ];

    const embed = generateBoardEmbed(board);
    const message = await interaction.followUp({
        embeds: [embed],
        components: generateBoardButtons(board),
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
        // Vérifier si c'est le tour du bon joueur
        if (buttonInteraction.user.id !== currentPlayer.id) {
            await buttonInteraction.reply({ content: "Ce n'est pas votre tour.", ephemeral: true });
            return;
        }
    
        const playerMove = parseInt(buttonInteraction.customId);
    
        // Assurez-vous que la case est vide
        if (board[playerMove] !== "⬜") return;
    
        // Placez le symbole du joueur actuel
        const currentSymbol = currentPlayer.id === interaction.user.id ? playerSymbol : opponentSymbol;
        board[playerMove] = currentSymbol;
    
        // Vérifiez si le joueur actuel a gagné
        if (checkWinner(board, currentSymbol)) {
            collector.stop("winner");
            await buttonInteraction.update({
                embeds: [generateBoardEmbed(board).setFooter({ text: `${currentPlayer.username} a gagné !` }).setColor(0x00FF00)],
                components: [],
            });
            return;
        }
    
        // Vérifiez si la partie est un match nul
        if (!board.includes("⬜")) {
            collector.stop("draw");
            await buttonInteraction.update({
                embeds: [generateBoardEmbed(board).setFooter({ text: "Égalité !" }).setColor(0xFFFF00)],
                components: [],
            });
            return;
        }
    
        // Changez le joueur actuel pour le tour suivant
        currentPlayer = currentPlayer.id === interaction.user.id ? (player2 || client.user) : interaction.user;
    
        // Si c'est le bot qui joue, effectuez son mouvement
        if (isAgainstBot && currentPlayer.id === client.user.id) {
            const botMoveIndex = botMove(board);
            board[botMoveIndex] = opponentSymbol;
    
            if (checkWinner(board, opponentSymbol)) {
                collector.stop("bot_wins");
                await buttonInteraction.update({
                    embeds: [generateBoardEmbed(board).setFooter({ text: `${client.user.username} a gagné !` }).setColor(0xFF0000)],
                    components: [],
                });
                return;
            }
    
            if (!board.includes("⬜")) {
                collector.stop("draw");
                await buttonInteraction.update({
                    embeds: [generateBoardEmbed(board).setFooter({ text: "Égalité !" }).setColor(0xFFFF00)],
                    components: [],
                });
                return;
            }
    
            // Redéfinir `currentPlayer` pour le prochain tour
            currentPlayer = interaction.user;
        }
    
        await buttonInteraction.update({
            embeds: [generateBoardEmbed(board)],
            components: generateBoardButtons(board),
        });
    });
    

    collector.on("end", async (_, reason) => {
        if (reason === "time") {
            await interaction.followUp({ content: "La partie a expiré.", ephemeral: true });
        } else if (reason === "draw") {
            await interaction.followUp({ content: "Égalité !", ephemeral: true });
        }
    });
};

function botMove(board: string[]): number {
    const availableMoves = board.map((val, index) => (val === "⬜" ? index : null)).filter(val => val !== null) as number[];
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

export default tictactoeCommand;
