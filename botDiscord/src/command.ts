import {
    ApplicationCommandOptionData,
    ApplicationCommandOption,
    APIApplicationCommandOption,
    CacheType,
    Interaction, ChatInputCommandInteraction, ApplicationCommandOptionType,
} from "discord.js";
import {pocBotClient} from ".";

type CommandOptions = ApplicationCommandOptionData[] | APIApplicationCommandOption[] | ApplicationCommandOption[];

export class Command {
    readonly name: string;
    private readonly description: string;
    private options: CommandOptions;
    private readonly run: (Interaction: ChatInputCommandInteraction<CacheType>, client: pocBotClient) => Promise<void>;

    constructor(options: {
        name: string,
        description: string,
        options?: CommandOptions,
        run: (Interaction: ChatInputCommandInteraction<CacheType>, client: pocBotClient) => Promise<void>
    }) {
        this.name = options.name;
        this.description = options.description;
        this.options = options.options || [];
        this.run = options.run;
    }

    toJSON() {
        return {
            name: this.name,
            description: this.description,
            options: this.options.map(option => {
                if (option.type === ApplicationCommandOptionType.Subcommand ||
                    option.type === ApplicationCommandOptionType.SubcommandGroup) {
                    return {
                        name: option.name,
                        description: option.description,
                        type: option.type,
                        options: option.options ? option.options.map(subOption => {
                            return {
                                name: subOption.name,
                                description: subOption.description,
                                type: subOption.type,
                                required: subOption.required,
                                choices: subOption.choices,
                            };
                        }) : [],
                    };
                }

                return {
                    name: option.name,
                    description: option.description,
                    type: option.type,
                    channelTypes: option.channelTypes,
                    required: option.required,
                    minValue: option.minValue,
                    maxValue: option.maxValue,
                    choices: option.choices,
                };
            })
        };
    }

    async execute(interaction:  ChatInputCommandInteraction<CacheType>, client: pocBotClient) {
        try {
            await this.run(interaction, client);
        } catch (error) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}
