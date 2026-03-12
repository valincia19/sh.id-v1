import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import logger from "../../utils/logger.js";
import config from "../../config/index.js";

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

        this.client.once("clientReady", (readyClient) => {
            logger.info(`Discord Bot connected as ${readyClient.user.tag}`);
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
     * @param {Object} script - The script object containing title, description, slug, hub_id, etc.
     * @param {Object} uploader - The user object of the uploader
     */
    async broadcastNewScript(script, uploader) {
        if (!this.isReady || !this.logChannelId) return;

        try {
            const channel = await this.client.channels.fetch(this.logChannelId);
            if (!channel) return;

            const scriptUrl = `${config.appUrl}/s/${script.slug}`;
            const targetHubId = script.hub_id || script.hubId;
            
            logger.debug(`Discord Broadcast Debug: Script ID=${script.id}, Hub ID=${targetHubId}`);

            // Resolve Author (Hub or Uploader)
            let authorName = uploader.display_name || uploader.username;
            let authorIcon = uploader.avatar_url ? `https://cdn.discordapp.com/avatars/${uploader.discord_id}/${uploader.avatar_url}.png` : null;

            if (targetHubId) {
                try {
                    const { getHubById } = await import("../hubs/hubs.service.js");
                    const hub = await getHubById(targetHubId);
                    if (hub) {
                        logger.debug(`Discord Broadcast Debug: Found Hub="${hub.name}"`);
                        authorName = hub.name;
                        authorIcon = hub.logo_url ? `https://cdn.scripthub.id/${hub.logo_url}` : null;
                    } else {
                        logger.warn(`Discord Broadcast: Hub ID ${targetHubId} not found in database`);
                    }
                } catch (hubErr) {
                    logger.error(`Failed to fetch hub info for broadcast: ${hubErr.message}`);
                }
            } else {
                logger.debug(`Discord Broadcast Debug: No Hub ID found for script "${script.title}"`);
            }

            const embed = new EmbedBuilder()
                .setColor("#000000") // Black color
                .setTitle(`New Script Uploaded: ${script.title}`)
                .setURL(scriptUrl)
                .setAuthor({ 
                    name: authorName,
                    iconURL: authorIcon
                })
                .setDescription(script.description ? script.description.substring(0, 150) + "..." : "No description provided.")
                .addFields(
                    { name: 'Link', value: `[Click here to view!](${scriptUrl})`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: "ScriptHub.id Auto-Notifier" });

            // Set Hub Logo as Thumbnail if it's a hub script
            if (script.hub_id && authorIcon) {
                embed.setThumbnail(authorIcon);
            }

            // Only show uploader if NOT a hub script
            if (!script.hub_id) {
                embed.addFields({ name: 'Uploader', value: uploader.username, inline: true });
            }

            if (script.thumbnail_url) {
                embed.setImage(`https://cdn.scripthub.id/${script.thumbnail_url}`);
            }

            logger.info(`Broadcasting script to Discord: "${script.title}"`);
            await channel.send({ embeds: [embed] });
            logger.info(`Successfully broadcasted script "${script.title}" to Discord channel ${this.logChannelId}`);
        } catch (error) {
            logger.error(`Failed to broadcast script "${script.title}" to Discord: ${error.message}`);
        }
    }
}

// Export as singleton
export const discordBot = new DiscordBotService();
