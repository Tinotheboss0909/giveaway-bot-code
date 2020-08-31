let Discord = require('discord.js')
let client = new Discord.Client()
let data = require('./config.json')
let prefix = data.prefix;
let ms = require('ms')

if (data.token == 'YOUR_TOKEN_HERE') {
  console.log('Please set your token')
}
client.login(data.token)

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const { GiveawaysManager } = require("discord-giveaways");
// Starts updating currents giveaways
const manager = new GiveawaysManager(client, {
    storage: "./giveaways.json",
    updateCountdownEvery: 6000,
    default: {
        botsCanWin: false,
        embedColor: "#FF0000",
        reaction: "🎉"
    }
});
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager; 


client.on('message', async message => {
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
	if (!prefixRegex.test(message.content) || message.author.bot) return;

	const [, matchedPrefix] = message.content.match(prefixRegex);
	const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
	const c = args.shift().toLowerCase();
  
 if (c == 'giveaway') {
    if (message.author.id !== message.guild.ownerID) {
    if (!message.member.hasPermission("ADMINISTRATOR") || !message.member.hasPermission("MANAGE_GUILD") && !message.member.roles.cache.has(role => role.name.toLowerCase().includes('giveaways'))) {
return message.channel.send('You need the `MANAGE_GUILD` permission or a role called giveaways to use this command!')
    }
    }
    if (!args[0]) {
    return message.channel.send('You need to follow this command with one of these sub commands, `end`, `edit`, `start`, or `reroll`')
    }
    if (args[0].toLowerCase() == 'start') {
      if (!args[1]) {  
        return message.channel.send('Please follow the fomat of `s!giveaway start winners time <channel> item`.\n `<>` means its optional')
            }
      let slicenum = 4;
      let channel = message.mentions.channels.first()
    if (!channel) {
      channel = message.channel
      slicenum = 3;
    }
    let winners = args[1].toString().replace('w','')
    let time = ms(args[2])
    let prize = args.slice(slicenum).join(' ')
        if (!winners || !time || !prize) {
      return message.channel.send('Please follow the fomat of `s!giveaway start winners time <channel> item`.\n `<>` means its optional')
    }
    if (isNaN(winners) || winners <= 0) {
      return message.channel.send(`Your amount of winners is invalid`)
    }
   let msg = await client.giveawaysManager.start(channel || message.channel, {
            time: time,
            prize: prize,
            winnerCount: winners,
         embedColor: "008000",
       embedColorEnd: "#FF0000",
       hostedBy:  message.author,
      messages: {
         giveaway: "<a:A_arrowRight:748983335845363843> Giveaway Started!! <a:A_arrowLeft:748983387880030349>",
         giveawayEnded: "❌ Giveaway Ended ❌",
        timeRemaining: "Time remaining: **{duration}**!",
            inviteToParticipate: "React with 🎉 to enter!",
            winMessage: "Congratulations, {winners}! You won **{prize}**!",
            embedFooter: "Giveaways",
            noWinner: "Giveaway cancelled\nNot enough reactions!",
            hostedBy: "Hosted by: {user}",
            winners: "Winners",
            endedAt: "Ended at",
            units: {
                seconds: "seconds",
                minutes: "minutes",
                hours: "hours",
                days: "days",
                pluralS: false // Not needed, because units end with a S so it will automatically removed if the unit value is lower than 2
            }
        }
        }).then((giveaway) => {
          let msgid = giveaway.messageID
          let link = `https://discordapp.com/channels/${message.guild.id}/${giveaway.channelID}/${giveaway.messageID}`
         message.author.send(`Giveaway created with the ID of \`${msgid}\`!\n\nCheck it out here ${link}`)
         message.delete()
        })
    } else if (args[0].toLowerCase() == 'reroll') {
      if (!args[1]) {
  return message.channel.send('You need to specify a message id')
      }
      let msgid = args[1]
      client.giveawaysManager.reroll(msgid).catch((err) => {
            message.channel.send("No giveaway found for "+msgid+", please check and try again");
        });
    } else if (args[0].toLowerCase() == 'end') {
      if (!args[1]) {
  return message.channel.send('You need to specify a message id')
      }
      let msgid = args[1]
      client.giveawaysManager.end(msgid).catch((err) => {
            message.channel.send("No giveaway found for "+msgid+", please check and try again");
        });

  } else if (args[0].toLowerCase() == 'edit') {
    if (!args[1]) return message.channel.send('You need to specify a message id!')
    if (!args[2]) return message.channel.send('Please follow the format of `newWinnerCount newPrize`. eg.\n`s!giveaway edit 3 2 roles each!!`')
    let msgid = args[1]
    let winners = args[2].toString().replace('w', '')
    let item = args.slice(3).join(' ')
    if (!winners || !item) {
    return message.channel.send('Please follow the format of `newWinnerCount newPrize`. eg.\n`s!giveaway edit 3 2 roles each!!')
    }
    if (isNaN(winners)) {
      return message.channel.send('Your amount of winners is invalid')
    }
    client.giveawaysManager.edit(msgid, {
      newWinnerCount: winners,
      newPrize: item
    }).then(() => {
    message.channel.send('Giveaway will be edited in about 6 seconds')
    }).catch(err => {
      message.channel.send('That is not a valid message id!')
    })
    }
    else {
        return message.channel.send('You need to follow this command with one of these sub commands, `end`, `start`, or `reroll`')

  }
  } 
  })
 
  client.giveawaysManager.on('giveawayEnded', (giveaway, winners) => {
    winners.forEach((member) => {
      let guild = client.guilds.resolve(giveaway.guildID)
      let user = client.users.resolve(giveaway.hostedBy.replace('<@', '').replace('>', '').replace('!', ''))
      let host = guild.members.resolve(user)
      let link = `https://discordapp.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}`
      let embed = new Discord.MessageEmbed()
      .setTitle('You won a giveaway!!')
      .setDescription(`DM ${host} to claim. [Giveaway](${link})`)
      let embed2 = new Discord.MessageEmbed()
      .setTitle('Your giveaway has ended!')
      .setDescription(`Winners: ${winners}. [Giveaway](${link})`)
        member.send(embed);
        host.send(embed2)
      });
});

  client.giveawaysManager.on('giveawayRerolled', (giveaway, winners) => {
    winners.forEach((member) => {
      let guild = client.guilds.resolve(giveaway.guildID)
      let user = client.users.resolve(giveaway.hostedBy.replace('<@', '').replace('>', '').replace('!', ''))
      let host = guild.members.resolve(user)
      let link = `https://discordapp.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}`
      let embed = new Discord.MessageEmbed()
      .setTitle('You won a giveaway!!')
      .setDescription(`DM ${host} to claim. [Giveaway](${link})`)
      let embed2 = new Discord.MessageEmbed()
      .setTitle('Your giveaway has been rerolled!')
      .setDescription(`Winners: ${winners}. [Giveaway](${link})`)
        member.send(`Congratulations, ${member.user.username}, you won: ${giveaway.prize}`);
        host.send(`Your giveaway has been rerolled, the winners were ${member}\n${link}`)
    });
  
})

client.on('ready', () => {
  client.user.setActivity('Made by ThatGuyTino#0001')
})

client.on('message', async message => {
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
	if (!prefixRegex.test(message.content) || message.author.bot) return;

	const [, matchedPrefix] = message.content.match(prefixRegex);
	const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
	const c = args.shift().toLowerCase();

    if (c == 'ping') {
			message.channel.send(`\`${(Date.now() - message.createdTimestamp)}\`ms`) 
    } else if (message.content == `<@!${client.user.id}>`) {
      message.reply(`Hello! My prefix is \`${prefix}\``)
    } else if (c == 'prefix') {
    message.reply(`you can either ping me or use \`${prefix}\` as my prefix.`);
    }
})