// imports needed
import botkit from 'botkit';
import Yelp from 'yelp';

// yelp api
const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

// code for starting up bot taken from CS52 assignment 2 GitHub repo: https://github.com/dartmouth-cs52/slackattack
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
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// help response
controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Ask me how I am, and I\'ll have a conversation with you!  Type in "food near me" and I can give you some killer recommendations.');
});

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

// favorite color response
controller.hears(['your favorite color'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'My favorite color is red.');
});

// small talk conversation
controller.hears(['how are you?'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Good.  Are you doing well?', [
      {
        pattern: bot.utterances.yes,
        callback: (response, convo2) => {
          convo.say('Good to hear!');
          convo.next();
        },
      },
      {
        pattern: bot.utterances.no,
        callback: (response, convo3) => {
          convo.ask('I\'m sorry to hear that.  Do you want to stress-eat the pain away?', [
            {
              pattern: bot.utterances.yes,
              callback: (response2, convo4) => {
                convo.say('Definitely the right decision.  Just type in "find me some food" and I\'ll get started on it right away.');
                convo.next();
              },
            },
            {
              pattern: bot.utterances.no,
              callback: (response3, convo5) => {
                convo.say('Ok.  But you\'re a star!  Say "help me" to see what I can do for you.');
                convo.next();
              },
            },
          ]);
          convo.next();
        },
      },
    ]);
    convo.next();
  });
});

// food recommendation conversation
controller.hears(['hungry', 'food'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Are you hungry? Reply "yes" or "no".', [
      {
        pattern: bot.utterances.yes,
        callback: (response, convo2) => {
          convo.say('Awesome! Let me give you some recommendations.');
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
  });
});

// outgoing webhook
controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, {
    pretext: 'Let me sleep.',
    attachments: [
      {
        image_url: 'http://i.giphy.com/26vULbbOhi45zev9S.gif',
      },
    ],
  });
});

// response for random messages
controller.on(['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Hmmm...I don\'t quite understand that.  What are you talking about?');
  bot.reply(message, 'Ask for help if you want to know what I can do!  Just say "help me".');
});
