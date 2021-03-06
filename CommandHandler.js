const { Collection } = require("discord.js");
const config = require("./config");
const PrefixSupplier = require("./PrefixSupplier");
const fs = require("fs");
const Command = require("./Command");

module.exports = class CommandHandler {
	constructor(client, {
		handleEdits = true,
		prefix = config.prefix,
	} = {}) {

		this.client = client;

		this.prefix = typeof prefix === "function" ? prefix.bind(this) : prefix;

		this.prefixes = new Collection();

		this.handleEdits = Boolean(handleEdits);

		this.commands = new Collection();

		this.categories = new Collection();

		this.startup();

	}

	startup() {
		this.client.once("ready", () => {
			console.log("Commandhandler | Loaded");

			const CommandsWithPrefixes = this.commands.filter((v) => v.prefix[0] !== null);

			this.client.dictionary = {};
			CommandsWithPrefixes.forEach((v) => v.aliases.map((a) => this.client.dictionary[`${v.prefix}${a}`] = v));

			this.client.on("message", async (message) => {
				if (message.partial) await message.fetch();
				this.handle(message, CommandsWithPrefixes);
			});

			if (this.handleEdits) {
				this.client.on("messageUpdate", async (oldMessage, newMessage) => {
					if (oldMessage.partial) await oldMessage.fetch();
					if (newMessage.partial) await newMessage.fetch();
					if (oldMessage.content === newMessage.content) return;
					if (this.handleEdits) this.handle(newMessage);
				});
			}
		});
	}

	async handle(message) {

		let prefix = PrefixSupplier(message);
		const commands = this.commands;

		if (message.author.bot || message.webhookID) return;

		// This checks wether the message matches a command using a static prefix
		let commandName;
		const dictMatch = message.client.dictionary[message.content.trim().split(/ +/)[0]];
		if (dictMatch) {
			commandName = dictMatch.name;
			prefix = dictMatch.prefix[0];
		}

		if (!message.content.startsWith(prefix) && !dictMatch) return;

		const args = message.content.slice(prefix.length).trim().split(/ +/);

		commandName = args.shift().toLowerCase();

		const command = commands.get(commandName)
			|| commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) return;

		// check if ownerOnly: true on a command object
		if (command.ownerOnly && !config.ownerID.includes(message.member.id)) {
			return;
		}

		// check if guildOnly: true on a command object
		if (command.guildOnly && message.channel.type === "dm") {
			return message.reply("I can't execute that command inside DMs!");
		}

		// // TODO: permissions check method. //TODONE xd kms
		if (command.userPermissions || command.clientPermissions) {

			if (command.userPermissions) {
				if (!(this.checkPermissions(command.userPermissions, message.member))) {
					return message.client.emit("MissingPermissions", command, args, message.author, message);
				}
			}

			if (command.clientPermissions) {
				if (!(this.checkPermissions(command.clientPermissions, message.guild.me))) {
					return message.client.emit("ClientMissingPermissions", command, args, message.author, message);
				}
			}
		}

		if (command.nsfw && !message.channel.nsfw) {
			return message.reply("I can't execute that command outside of a NSFW channel!");
		}

		// check if args: true
		if (command.args && !args.length) {
			let reply = "You didn't provide any arguments.";

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			return message.channel.send(reply);
		}

		try {

			if (command.typing) {
				message.channel.startTyping();
			}

			command.execute(message, args);
			this.client.emit("CommandFinished", command, args, message.author);

		}
		catch (error) {
			console.error(error);
			message.reply("there was an error trying to execute that command!");
		}
		finally {
			if (command.typing) {
				message.channel.stopTyping();
			}
		}
	}
	// Function to do it all xd
	register() {

		const commandFiles = fs.readdirSync("./modules").filter(file => file.endsWith(".js"));

		commandFiles.forEach(file => {
			const exported = require(`./modules/${file}`);

			Object.entries(exported).forEach(cmd => {

				const cmdName = cmd[0],
					cmdObject = cmd[1];

				if (!(cmdObject instanceof Command)) {
					throw new Error(`Command is not instance of a Command class. | ${cmdName} | ${file}`);
				}

				cmdObject.client = this.client;
				cmdObject.category = cmdObject.category ? cmdObject.category : file.slice(0, file.indexOf("."));
				cmdObject.name = cmdName;
				!cmdObject.aliases.length > 0 ? cmdObject.aliases = [cmdName] : cmdObject.aliases.push(cmdName);

				this.commands.set(cmdName, cmdObject);
			});
		});
	}

	checkPermissions(perms, member) {
		return perms.every((perm) => {
			if (member.permissions.has(perm, true)) {
				return true;
			}
			return false;
		});
	}
};
