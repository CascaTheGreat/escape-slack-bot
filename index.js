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
    if (event.text.includes("escapees")) {
      //make API call to Eventbrite
      const response = await fetch(
        `https://www.eventbriteapi.com/v3/events/${process.env.EVENTBRITE_EVENT_ID}/capacity_tier/`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EVENTBRITE_API_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      const quantitySold = data.quantity_sold;
      //creates a progress bar with the 🟩 and ⬜ emojis, 20 total emojis with a cap of 350
      const progress = Math.min(Math.floor((quantitySold / 350) * 20), 20);
      const progressBar = "🟩".repeat(progress) + "⬜".repeat(20 - progress);

      await app.client.chat.postMessage({
        channel: event.channel,
        text: `We've registered ${quantitySold} attendees for the event.\n${progressBar}`,
        token: context.botToken,
      });
    } else {
      await app.client.chat.postMessage({
        channel: event.channel,
        text: `Hello <@${event.user}>! How can I assist you today?`,
        token: context.botToken,
      });
    }
  } catch (error) {
    console.error(error);
  }
});
