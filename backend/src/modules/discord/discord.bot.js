import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import logger from "../../utils/logger.js";
import { config } from "../../config/index.js";

class DiscordBotService {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
            ],
        });
        this.isReady = false;
        this.logChannelId = config.discordBot?.logChannelId;

        this.client.once("ready", () => {
            logger.info(`Discord Bot connected as ${this.client.user.tag}`);
            this.isReady = true;
        });

        this.client.on("error", (error) => {
            logger.error(`Discord Bot Error: ${error.message}`);
        });

        // Uncomment slightly later when commands are needed
        /*
        this.client.on("messageCreate", async (message) => {
            if (message.author.bot) return;

            if (message.content === "!ping") {
                await message.reply("Pong from ScriptHub.id Backend! 🏓");
            }
        });
        */
    }

    async start() {
        if (!config.discordBot?.token) {
            logger.warn("Discord Bot token not configured. Bot will not start.");
            return;
        }

        try {
            await this.client.login(config.discordBot.token);
        } catch (error) {
            logger.error(`Failed to start Discord Bot: ${error.message}`);
        }
    }

    /**
     * Broadcasts a new script upload to the configured Discord channel
     * @param {Object} script - The script object containing title, description, slug, etc.
     * @param {Object} uploader - The user object of the uploader
     */
    async broadcastNewScript(script, uploader) {
        if (!this.isReady || !this.logChannelId) return;

        try {
            const channel = await this.client.channels.fetch(this.logChannelId);
            if (!channel) return;

            const scriptUrl = `${config.app.url}/s/${script.slug}`;
            
            const embed = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle(`🚀 New Script Uploaded: ${script.title}`)
                .setURL(scriptUrl)
                .setAuthor({ 
                    name: uploader.display_name || uploader.username,
                    iconURL: uploader.avatar_url ? `https://cdn.discordapp.com/avatars/${uploader.discord_id}/${uploader.avatar_url}.png` : null
                })
                .setDescription(script.description ? script.description.substring(0, 150) + "..." : "No description provided.")
                .addFields(
                    { name: '🔥 Link', value: `[Click here to view!](${scriptUrl})`, inline: true },
                    { name: '👤 Uploader', value: uploader.username, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "ScriptHub.id Auto-Notifier" });

            if (script.thumbnail_url) {
                embed.setImage(`https://cdn.scripthub.id/${script.thumbnail_url}`);
            }

            await channel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(`Failed to broadcast script to Discord: ${error.message}`);
        }
    }
}

// Export as singleton
export const discordBot = new DiscordBotService();
