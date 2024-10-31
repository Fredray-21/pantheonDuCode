import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    CacheType,
    ComponentType,
} from "discord.js";
import fs from "fs";
import path from "path";
import { Command } from "../command";

// Charger un mot au hasard depuis le dictionnaire en ISO-8859-1
function getRandomWord(): string {
    const filePath = path.resolve(__dirname, "../../public/dico_fr.txt");
    const words = fs.readFileSync(filePath, { encoding: "latin1" }).split("\n").map(word => word.trim());
    return words[Math.floor(Math.random() * words.length)];
}

// Fonction pour normaliser les lettres, en retirant les accents et en passant en majuscule
function normalize(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const hangmanCommand = new Command({
    name: "hangman",
    description: "Joue au jeu du pendu en solo contre le bot.",
    async run(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        // Initialiser le jeu
        const word = getRandomWord().toUpperCase();
        console.log(`Mot à deviner : ${word}`);

        const normalizedWord = normalize(word);
        let displayWord = word.split("").map(char => /[A-Z]/.test(normalize(char)) ? "_" : char).join(" ");
        let attemptsLeft = 6;
        let guessedLetters: string[] = [];

        // Créer un embed initial
        const embed = new EmbedBuilder()
            .setTitle("Jeu du Pendu")
            .setDescription(`Mot à deviner : \`${displayWord}\`\nTentatives restantes : ${attemptsLeft}\nLettres déjà devinées : \`${guessedLetters.join("|") || "Aucune"}\``)
            .setColor(0x00AE86);

        // Envoyer l'état initial du jeu
        const message = await interaction.reply({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("guess_letter")
                        .setLabel("Deviner une lettre")
                        .setStyle(ButtonStyle.Primary)
                )
            ],
            fetchReply: true,
        });

        // Gestion de l'interaction bouton pour deviner une lettre
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000,
        });

        collector.on("collect", async (buttonInteraction) => {
            const modal = new ModalBuilder()
                .setCustomId("letter_modal")
                .setTitle("Devinez une lettre");

            const letterInput = new TextInputBuilder()
                .setCustomId("letter_input")
                .setLabel("Entrez une lettre")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(1)
                .setRequired(true);

            const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(letterInput);
            modal.addComponents(modalRow);

            await buttonInteraction.showModal(modal);

            // Gérer la réponse du modal
            const modalSubmit = await buttonInteraction.awaitModalSubmit({ time: 60000 }).catch(console.error);
            if (!modalSubmit) return;

            const guessedLetter = normalize(modalSubmit.fields.getTextInputValue("letter_input"));

            // Vérifier si la lettre est valide (lettre alphabétique)
            if (!/^[A-Z]$/.test(guessedLetter)) {
                await modalSubmit.reply({ content: "Veuillez entrer une seule lettre alphabétique.", ephemeral: true });
                return; // Sortir si l'entrée est invalide
            }

            // Vérifier si la lettre a déjà été devinée
            if (!guessedLetters.includes(guessedLetter)) {
                guessedLetters.push(guessedLetter); // Ajouter la lettre devinée

                if (normalizedWord.includes(guessedLetter)) {
                    displayWord = word.split("").map(char => guessedLetters.includes(normalize(char)) ? char : "_").join(" ");
                    if (!displayWord.includes("_")) {
                        collector.stop("win");
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Victoire ! 🎉")
                                    .setDescription(`Félicitations, vous avez deviné le mot : **${word}**`)
                                    .setColor(0x00FF00)
                            ],
                            components: []
                        });
                        await modalSubmit.deferUpdate(); // Fermer le modal
                        return;
                    }
                } else {
                    attemptsLeft--; // Réduire les tentatives seulement si la lettre n'était pas devinée avant
                    if (attemptsLeft === 0) {
                        collector.stop("lose");
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Défaite 😢")
                                    .setDescription(`Vous avez perdu ! Le mot était : **${word}**`)
                                    .setColor(0xFF0000)
                            ],
                            components: []
                        });
                        await modalSubmit.deferUpdate(); // Fermer le modal
                        return;
                    }
                }
            } else {
                // Si la lettre a déjà été devinée, ne pas ajouter de tentatives et simplement mettre à jour l'affichage
                await modalSubmit.deferUpdate(); // Fermer le modal

                // Informer l'utilisateur de la lettre déjà devinée sans causer d'échec
                const newEmbed = new EmbedBuilder()
                    .setTitle("Jeu du Pendu")
                    .setDescription(`Mot à deviner : \`${displayWord}\`\nTentatives restantes : ${attemptsLeft}\nLettres déjà devinées : \`${guessedLetters.join("|") || "Aucune"}\`\n\nVous avez déjà deviné la lettre : \`${guessedLetter}\``)
                    .setColor(0xFFA500); // Couleur orange pour l'avertissement

                await interaction.editReply({ embeds: [newEmbed] });
                return; // Sortir de la fonction pour éviter d'autres mises à jour
            }

            // Mettre à jour l'affichage du jeu
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Jeu du Pendu")
                        .setDescription(`Mot à deviner : \`${displayWord}\`\nTentatives restantes : ${attemptsLeft}\nLettres déjà devinées : \`${guessedLetters.join("|") || "Aucune"}\``)
                        .setColor(0x00AE86)
                ]
            });

            await modalSubmit.deferUpdate(); // Fermer le modal
        });

        // Fin du jeu si expiration
        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                await interaction.editReply({
                    content: "La partie a expiré !",
                    components: []
                });
            }
        });
    },
});

export default hangmanCommand;
