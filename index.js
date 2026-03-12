const { Client, GatewayIntentBits, Partials, Events } = require("discord.js");
const axios = require("axios");
require("dotenv").config();
const cron = require("node-cron");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
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

client.on(Events.MessageCreate, (mensaje) => {
  validarMensaje(mensaje, "C");
});

client.on(Events.MessageUpdate, (mensaje) => {
  validarMensaje(mensaje, "U");
});

async function validarMensaje(mensaje, act) {
  console.log(mensaje);

  if (mensaje.author?.bot || mensaje.canalId == process.env.SILENT_CANAL)
    return;

  let author;
  let content;

  if (act == "C") {
    author = mensaje.author?.id;
    content = mensaje.content;
  } else if (act == "U") {
    author = mensaje.reactions.message.author.id;
    content = mensaje.reactions.message.content;
  }

  const regexUrl = /https?:\/\/[^\s\)]+/gi;
  const enlacesEncontrados = content.match(regexUrl);

  let resultados;
  let urlLimpia;

  if (enlacesEncontrados) {
    for (const url of enlacesEncontrados) {
      urlLimpia = url.replace(/\)$/, "");

      resultados = await validarUrl(urlLimpia);

      if (resultados.esPeligrosa) {
        await mensaje.delete();
        break;
      }
    }
  }
}

async function validarUrl(url) {
  const urlBase64 = Buffer.from(url).toString("Base64").replace(/=/g, "");

  try {
    const response = await axios.get(process.env.URL_VALIDATOR + urlBase64, {
      headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY },
    });

    const status = response.data.data.attributes.last_analysis_stats;

    const reportes = status.malicious || 0 + status.phishing || 0;

    return {
      esPeligrosa: reportes > 0,
      cantidadAlertas: reportes,
      detalles: status,
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("URL nueva, no hay análisis previo en VirusTotal.");
    } else {
      console.error("Error en la API de VirusTotal:", error.message);
    }
    return { esPeligrosa: false };
  }
}

client.login(process.env.TOKEN);
