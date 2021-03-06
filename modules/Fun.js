const Discord = require("discord.js");
const Command = require("../Command");
const { getUserFromMention } = require("../util");
const fetch = require("node-fetch");
const func = (member) => [`Yes, ${member} is quite smart.`, `No, ${member} is super duper dumb.`];

module.exports.eightball = new Command({
	aliases: ["8ball"],
	args: true,
	description: "Ask the 8ball a yes/no question.",
	example: ["are you a good bot?"],
	usage: "<question>",
	async execute(message, args) {

		if (!args[1]) return message.reply("Ask a full question.");

		const replies = ["Yes", "No", "I dont know", "Ask again later"];

		const result = replies[Math.floor((Math.random() * replies.length))];
		const question = args.join(" ");

		return message.channel.send(new Discord.MessageEmbed()
			.setAuthor(message.author.tag)
			.setColor("#FF9900")
			.addField("Question", question)
			.addField("Answer", result),
		);
	},
});

module.exports.smart = new Command({
	description: "Mention someone to check if they are smart.",
	example: ["@Drev"],
	usage: "<mention>",
	args: true,
	async execute(message, args) {
		const user = getUserFromMention(args[0], message);

		if (user) {
			const answers = func(user);
			const answer = answers[Math.floor((Math.random() * answers.length))];

			return message.reply(answer);
		}
		return message.reply("Please mention someone.");
	},
});

module.exports.megumin = new Command({
	typing: true,
	async execute(message) {
		message.channel.send(new Discord.MessageEmbed({ color: "#FF0000", image: { url: await fetch("https://waifu.pics/api/sfw/megumin").then(result => result.json()).then((data) => (data["url"])) } }));
	},
});

module.exports.neko = new Command({
	typing: true,
	async execute(message) {
		message.channel.send(new Discord.MessageEmbed({ color: "#FF0000", image: { url: await fetch("https://waifu.pics/api/sfw/neko").then(result => result.json()).then((data) => (data["url"])) } }));
	},
});

module.exports.cuddle = new Command({
	typing: true,
	async execute(message, args) {

		const user = getUserFromMention(args.join(""), message);

		message.channel.send(user ? `${message.author.username} cuddled ${user.username}, owo.` : null, new Discord.MessageEmbed({ color: "#FF0000", image: { url: await fetch("https://waifu.pics/api/sfw/cuddle").then(result => result.json()).then((data) => (data["url"])) } }));
	},
});

module.exports.shinobu = new Command({
	typing: true,
	async execute(message) {
		message.channel.send(new Discord.MessageEmbed({
			color: "#FFFF00",
			image: { url: await fetch("https://waifu.pics/api/sfw/shinobu")
				.then(result => result.json())
				.then((data) => (data["url"])),
			},
		}));
	},
});