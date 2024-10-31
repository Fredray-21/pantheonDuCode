import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    CacheType,
} from "discord.js";
import { Command } from "../command";
import { pocBotClient } from "..";
import consola from "consola";

export const loadCountryFlags = async (client: pocBotClient) => {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=flags,translations");
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des données des drapeaux");
        }
        const data = await response.json();
        client['countryFlags'] = data;
        consola.success(`Country flags loaded !`);
    } catch (error) {
        throw error;
    }
};

const guessFlagsCommand = new Command({
    name: "guessflags",
    description: "Devinez le pays à partir du drapeau !",
    async run(interaction: ChatInputCommandInteraction<CacheType>, client: pocBotClient): Promise<void> {
       
        await interaction.deferReply({ephemeral:false, fetchReply: true});
        // Vérifier si les données sont chargées
        if (!client['countryFlags'] || client['countryFlags'].length === 0) {
            // Si non, charger les données
            await loadCountryFlags(client);

            // Vérifier à nouveau après le chargement
            if (!client['countryFlags'] || client['countryFlags'].length === 0) {
                await interaction.editReply({ content: "Les données des drapeaux ne sont toujours pas disponibles."});
                return;
            }
        }

        const countryFlags = client['countryFlags']; // Récupérer les drapeaux du cache

        // Choisir un pays aléatoire
        const randomIndex = Math.floor(Math.random() * countryFlags.length);
        const selectedCountry = countryFlags[randomIndex];
        const correctAnswer = selectedCountry.translations.fra.common;

        // Générer des réponses incorrectes
        const incorrectCountries = countryFlags
            .filter((_, index) => index !== randomIndex) // Éliminer le pays choisi
            .sort(() => 0.5 - Math.random()) // Mélanger
            .slice(0, 3) // Prendre 3 pays
            .map(country => country.translations.fra.common);

        // Mélanger les réponses
        const options = [correctAnswer, ...incorrectCountries].sort(() => 0.5 - Math.random());

        // Créer le message avec le drapeau
        const embed = new EmbedBuilder()
            .setTitle("Devinez le Drapeau !")
            .setDescription("Identifiez le pays correspondant à ce drapeau.")
            .setImage(selectedCountry.flags.png)
            .setColor(0x00AE86);

        // Créer les boutons pour les réponses
        const buttons = options.map((option) => new ButtonBuilder()
            .setCustomId(option)
            .setLabel(option)
            .setStyle(ButtonStyle.Primary)
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

        // Envoyer le message
        await interaction.editReply({ embeds: [embed], components: [row] });

        // Créer un collector pour les interactions de bouton
        const filter = (buttonInteraction: any) => {
            return options.includes(buttonInteraction.customId) && buttonInteraction.user.id === interaction.user.id;
        };

        const collector = interaction.channel?.createMessageComponentCollector({
            filter,
            time: 60000, // Temps de réponse de 1m
        });

        collector.on("collect", async (buttonInteraction) => {
            const chosenOption = buttonInteraction.customId;

            if (chosenOption === correctAnswer) {
                await interaction.editReply({ embeds: [embed], components: [] });
                await buttonInteraction.reply({ content: "✅ Correct ! Vous avez deviné le bon pays ! C'était bien " + correctAnswer + "." });
            } else {
                await interaction.editReply({ embeds: [embed], components: [] });
                await buttonInteraction.reply({ content: `❌ Mauvaise réponse ! C'était ${correctAnswer}.` });
            }

            collector.stop(); // Arrêter le collector après une réponse
        });

        collector.on("end", async (_, reason) => {
            if (reason === "time") {
                embed.setDescription("Le temps est écoulé ! La bonne réponse était " + correctAnswer + ".");
                embed.setColor(0xFF0000);
                await interaction.editReply({ content: "⏳ Temps écoulé !", components: [], embeds: [embed] });
            }
        });
    },
});

export default guessFlagsCommand;
