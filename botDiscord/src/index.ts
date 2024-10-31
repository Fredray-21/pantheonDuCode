import {
    Client,
    ClientOptions,
    GatewayIntentBits,

} from "discord.js";
import path from "path";
import dotenv from 'dotenv';
import consola from 'consola';
import { Command } from "./command";
import { getAllFiles } from './utils/getAllFiles';
import { loadCountryFlags } from "./commands/guessflags";

dotenv.config();

const isLinux = process.platform === 'linux';

const token = process.env.BOT_TOKEN;

export class pocBotClient extends Client {
    constructor(options: ClientOptions) {
        super(options);
        this.on("error", console.error);
    }
}

const client = new pocBotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
    ],
});

const commandList: Command[] = [];

client.once("ready", async () => {
    consola.success(`${client.user.tag} is ready !`);

    client.user.setPresence({
        activities: [{ name: process.env.STATUSBOT }],
        status: "online",
    });

    const endsWithTsOrJs = (str: string) => str.endsWith("ts") || str.endsWith("js");
    const commandsFiles = getAllFiles(path.join(__dirname, `commands`), endsWithTsOrJs).map((file) => file.replace(__dirname, ''));
    consola.info(`Loading ${commandsFiles.length} commands...`)

    for (const file of commandsFiles) {
        const { default: command } = !isLinux ? await import(`.${file.replace('\\', '/')}`) : await import(`.${file}`)

        consola.info(`Loading command ${command.name}...`);

        commandList.push(command);
    }

    await client.application.commands.set(commandList.map((command) => command.toJSON()));
    consola.success(`All commands loaded !`);


    await loadCountryFlags(client);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { guildId, commandName } = interaction;

    try {
        consola.info(`Command ${commandName} called by ${interaction.user.tag} in guild ${guildId}`);

        const command = commandList.find((cmd) => cmd.name === commandName);
        if (!command) return;

        await command.execute(interaction, client);
    } catch (error) {
        console.error(`Error handling interaction for command ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'There was an error while processing this interaction!', ephemeral: true });
    }
});

client.login(token).then(_ => {
    consola.info(`Running on ${isLinux ? 'Linux' : 'Windows'}`);
    consola.success(`Logged in as ${client.user.tag} !`);
});
