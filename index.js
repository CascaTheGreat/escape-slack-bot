import pkg from "@slack/bolt";
const { App } = pkg;

const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app started");
})();

app.event("app_mention", async ({ event, context }) => {
  try {
    await app.client.chat.postMessage({
      channel: event.channel,
      text: `Hello <@${event.user}>! How can I assist you today?`,
      token: context.botToken,
    });
  } catch (error) {
    console.error(error);
  }
});
