import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    CacheType,
    ComponentType,
} from "discord.js";
import { Command } from "../command";

const MAX_PLAYERS = 6; // Nombre maximum de joueurs

const rouletteRussianCommand = new Command({
    name: "rouletterusse",
    description: "Jouez à la roulette russe !",
    async run(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const players: string[] = [interaction.user.id]; // Ajout de l'initiateur du jeu
        const ownerId = interaction.user.id; // Garder une référence au propriétaire de la commande

        const embed = new EmbedBuilder()
            .setTitle("Roulette Russe")
            .setDescription(`🔫 Un nouveau jeu de roulette russe a commencé !\n\nCliquez sur "Rejoindre" pour participer !\nJoueurs : ${players.length}/${MAX_PLAYERS}`)
            .setColor(0x00AE86);

        // Envoyer le message de jeu
        const message = await interaction.reply({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("join")
                        .setLabel("Rejoindre")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("start")
                        .setLabel("Démarrer le jeu")
                        .setStyle(ButtonStyle.Success)
                )
            ],
            fetchReply: true,
        });

        // Gestion des interactions de bouton
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000, // Le temps d'inscription est de 60 secondes
        });

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.customId === "join") {
                if (!players.includes(buttonInteraction.user.id)) {
                    players.push(buttonInteraction.user.id); // Ajouter le joueur
                    await buttonInteraction.reply({ content: "Vous avez rejoint le jeu !", ephemeral: true });
                } else {
                    await buttonInteraction.reply({ content: "Vous êtes déjà dans le jeu.", ephemeral: true });
                }

                // Mettre à jour l'embed pour afficher le nombre de joueurs
                const updatedEmbed = new EmbedBuilder()
                    .setTitle("Roulette Russe")
                    .setDescription(`🔫 Un nouveau jeu de roulette russe a commencé !\n\nCliquez sur "Rejoindre" pour participer !\nJoueurs : ${players.length}/${MAX_PLAYERS}`)
                    .setColor(0x00AE86);
                
                await interaction.editReply({ embeds: [updatedEmbed] });

            } else if (buttonInteraction.customId === "start") {
                if (buttonInteraction.user.id !== ownerId) {
                    await buttonInteraction.reply({ content: "Vous ne pouvez pas démarrer le jeu.", ephemeral: true });
                    return;
                }

                if (players.length < 2) {
                    await buttonInteraction.reply({ content: "Vous devez être au moins 2 joueurs pour commencer.", ephemeral: true });
                    return;
                }

                await buttonInteraction.reply({ content: "Le jeu a commencé !", ephemeral: false });
                // Commencer le jeu
                collector.stop("startGame");
                await playGame(players, interaction);
            }
        });

        // Fin de la phase d'inscription
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                if (players.length > 1) {
                    await interaction.followUp({ content: "Le temps d'inscription est écoulé, le jeu commence !", ephemeral: false });
                    await playGame(players, interaction);
                } else {
                    await interaction.followUp({ content: "Pas assez de joueurs pour commencer le jeu.", ephemeral: false });
                }
            }
        });
    },
});

// Fonction pour gérer le jeu
async function playGame(players: string[], interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const activePlayers = [...players]; // Les joueurs encore en vie

    while (activePlayers.length > 1) {
        // Message de chargement
        const loadingMessage = await interaction.followUp({ content: "🔄 Choisir un joueur à éliminer...", ephemeral: false });

        // Afficher des noms aléatoires pendant 5 secondes
        const loadingInterval = setInterval(() => {
            const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            loadingMessage.edit({ content: `🔄 Choisir un joueur à éliminer...\nJoueur: <@${randomPlayer}>` });
        }, 500); // Changer de joueur toutes les 500 ms

        // Attendre 5 secondes
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Arrêter le défilement
        clearInterval(loadingInterval);

        // Choisir un joueur à éliminer
        const randomPlayerIndex = Math.floor(Math.random() * activePlayers.length); // Choisir un joueur aléatoire
        const eliminatedPlayer = activePlayers[randomPlayerIndex]; // Joueur à éliminer
        const embed = new EmbedBuilder()
            .setTitle("Roulette Russe")
            .setDescription(`🔫 Le joueur <@${eliminatedPlayer}> a été éliminé...\n\nJoueurs restants : ${activePlayers.length - 1}`)
            .setColor(0x00AE86);

        // Informer le canal du résultat
        await interaction.followUp({ embeds: [embed] });

        // Retirer le joueur éliminé
        activePlayers.splice(randomPlayerIndex, 1); // Retirer le joueur éliminé

        // Attendre un certain temps avant d'éliminer le prochain joueur
        await new Promise(resolve => setTimeout(resolve, 3000)); // Délai de 3 secondes entre les éliminations
    }

    // Déclarer le gagnant
    if (activePlayers.length === 1) {
        await interaction.followUp({ content: `<@${activePlayers[0]}> est le gagnant ! 🎉`, ephemeral: false });
    }
}

export default rouletteRussianCommand;
