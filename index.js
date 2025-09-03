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
    }
    if (event.text.includes("retreats")) {
      //make API call to Eventbrite with pagination
      let page = "";
      let has_more = true;
      const dates = {
        "Saturday Sept. 27 - Sunday, Sept. 28": {
          num_attendees: 0,
          team: "Star",
          emoji: "⭐",
        },
        "Friday, Sept. 26 - Saturday, Sept. 27": {
          num_attendees: 0,
          team: "Hero",
          emoji: "⚔️",
        },
        "Friday, Oct. 24 - Saturday, Oct. 25 ": {
          num_attendees: 0,
          team: "Star",
          emoji: "⭐",
        },
        "Saturday, Oct. 25 - Sunday, Oct. 26": {
          num_attendees: 0,
          team: "Distance",
          emoji: "🏃",
        },
        "Friday, Nov. 14 - Saturday, Nov. 15 (Transfer Retreat)": {
          num_attendees: 0,
          team: "Distance",
          emoji: "🏃",
        },
        "Saturday, Nov. 15 - Sunday, Nov. 16": {
          num_attendees: 0,
          team: "Hero",
          emoji: "⚔️",
        },
      };
      while (has_more) {
        const response = await fetch(
          `https://www.eventbriteapi.com/v3/events/${process.env.EVENTBRITE_EVENT_ID}/attendees/?continuation=${page}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.EVENTBRITE_API_TOKEN}`,
            },
          }
        );
        const data = await response.json();

        for (const attendee of data.attendees) {
          const retreatDate = attendee.answers[0].answer;
          if (dates[retreatDate]) {
            dates[retreatDate].num_attendees++;
          }
        }

        has_more = data.has_more_items;
        page = data.pagination.continuation;
      }

      await app.client.chat.postMessage({
        channel: event.channel,
        text: `Here are the current retreat registrations:\n${Object.entries(
          dates
        )
          .map(
            ([date, info]) =>
              `${date} (${info.emoji} ${info.team}): *${info.num_attendees}*`
          )
          .join("\n")}`,
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
