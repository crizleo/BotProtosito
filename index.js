const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
require("dotenv").config();
const cron = require("node-cron");

const client = new Client({
  intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel],
});

const canalId = process.env.CANAL_ID;
const userId = process.env.USER_ID;

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);

  cron.schedule(
    "0 10 * * 1",
    async () => {
      const canal = await client.channels.fetch(canalId);
      try {
        if (canal) {
          canal.send(
            `Hola <@${userId}>, seguimos esperando a que saques los aereos, atentamente tus compañeros de Star Craft`,
          );
        }
      } catch (error) {
        console.error("Error al enviar el mensaje semanal:", error);
      }
    },
    { timezone: "America/Bogota" },
  );
});

client.login(process.env.TOKEN);
