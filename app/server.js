// code for example bot taken from CS52 assignment 2 GitHub repo: https://github.com/dartmouth-cs52/slackattack
// example bot
import botkit from 'botkit';
import Yelp from 'yelp';
//
const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

// const yelp = new Yelp({
//   consumer_key: 'm-dYPN9X5jH3sCvnZatOkg',
//   consumer_secret: 'AWvR11AXQvzM-C98tf7uD-R9F3A',
//   token: '9hht0thMOLNM-myL2rxlDhUoeHIc8HSm',
//   token_secret: 'rnZMC5fMTj5UKcPYvAGVcXNsopM',
// });

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// example hello response
// controller.on('message_received', (bot, message) => {
//   bot.reply(message, 'I heard... something!');
// });

// hello response
controller.hears(['hello', 'hi', 'howdy', 'hey'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

controller.hears(['your favorite color'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'My favorite color is red.');
});

// start a conversation to handle this response.
controller.hears(['hungry', 'food'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Are you hungry? Reply "yes" or "no".', [
      {
        pattern: bot.utterances.yes,
        callback: (response, convo2) => {
          convo.say('Awesome!');
          convo.ask('What kind of food are you in the mood for?', (food, convo3) => {
            convo.ask('Where are you?', (place, convo4) => {
              convo.say(`Sounds good.  Finding ${food.text} near you.`);
              yelp.search({ term: food.text, location: place.text, limit: 1 })
                .then((data) => {
                  bot.reply(message,
                    {
                      // username: `${data.businesses[0].name}`,
                      text: `rating: ${data.businesses[0].rating} stars out of 5`,
                      attachments: [
                        {
                          title: `${data.businesses[0].name}`,
                          title_link: `${data.businesses[0].url}`,
                          text: `${data.businesses[0].snippet_text}`,
                          image_url: `${data.businesses[0].image_url}`,
                        },
                      ],
                    });
                }).catch((err) => {
                  console.error(err);
                });
              convo.next();
            });
            convo.next();
          });
          convo.next();
        },
          //  convo.next();
      },
      {
        pattern: bot.utterances.no,
        callback: (response, convo5) => {
          convo.ask('Can I help you with anything else?', [
            {
              pattern: bot.utterances.no,
              callback: (response2, convo7) => {
                convo.say('Ok! You know where to find me if you need help later!');
                convo.next();
              },
            },
            {
              pattern: bot.utterances.yes,
              callback: (response2, convo8) => {
                convo.say('Cool! What can I help you with?');
                convo.next();
              },
            },
          ]);
          convo.next();
        },
      },
      {
        default: true,
        callback: (response, convo6) => {
          convo.repeat();
          convo.next();
        },
      },
    ]);
      // convo.say(`so you said: ${response.text}`);
      // convo.next();
  });
});
// yelp.search({ term: 'food', location: 'Montreal' })
// .then((data) => {
//   console.log(data);
//   // console.log(data.businesses[0].name);
// }).catch((err) => { // There was an error with the API call
//   console.error(err); // Log the API call error to the console
// });

// controller.on('user_typing', (bot, message) => {
//   bot.reply(message, 'stop typing!');
// });
// code for Yelp functionality inspired by Yelp-sponsored GtiHub repo: https://github.com/olalonde/node-yelp


// });
// .catch(function (err) {
//   console.error(err);
// });
//
// // See http://www.yelp.com/developers/documentation/v2/business
// yelp.business('yelp-san-francisco')
//   .then(console.log)
//   .catch(console.error);
//
// yelp.phoneSearch({ phone: '+15555555555' })
//   .then(console.log)
//   .catch(console.error);

// A callback based API is also available:
// yelp.business('yelp-san-francisco', function(err, data) {
//   if (err) return console.log(error);
//   console.log(data);
// });
// example hello response
controller.on(['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Hmmm...I don\'t quite understand that.  What are you talking about?');
  bot.reply(message, 'Ask for help if you want to know what I can do!');
});
