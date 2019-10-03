const assert = require('assert');
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token, owner } = require('./config.json');
const path = require('path');
const sqlite = require('sqlite');
const shortid = require('shortid');
var fs = require('fs');
const commands = [];
const types = [];

types.push('py');
types.push('text');


// database stuff

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');


const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ commands: [], whitelist: [] })
	.write();


const protectedCommands = ['add', 'edit', 'delete', 'list', 'remove', 'show', 'help', 'whitelist'];
console.log(protectedCommands);


function isProtected(command, message) {
	if(protectedCommands.includes(command)) {
		message.reply('That is a protected command, cannot edit add or remove');
		
		return true;
	}
	return false;
}


// /NEW PYTHON ATTEMPS


const { PythonShell } = require('python-shell');



function runString() {
	PythonShell.run('script.py', options, function(err, results) {
		if (err) throw err;
		// results is an array consisting of messages collected during execution
		console.log(results.join('\n'));
	});
}



function replyText(string, type, message) {
	console.log("reply string is: " + string);
	if(string == null) { return; }
	var multiline = string.includes("\n");

	if (type == "channel" && multiline) {
		message.channel.send("\`\`\`" + string + "\`\`\`");
		return;
	}
	if (type == "channel" && !multiline) {
		message.channel.send(string);
		return;
	}
	if (type == "reply" && multiline) {
		message.reply("\`\`\`" + string + "\`\`\`");
	}
	if (type == "reply" && !multiline) {
		message.reply(string);
	}
	message.reply("err on replyText()");
	console.log("err on reply string \n" + string + "\n type : " + type);
}


function addCommand(args, message) {
	var name;
	var type;
	var lastMessage = false;
	var pingMessage = false;
	var flags;
	console.log("lastMessage is: " + lastMessage);
	console.log("PingMessage is: " + pingMessage);

	if(args.length < 3) {
		message.reply('I need more information to add your command, see !help add');
		return;
	}

	name = args[0];
	args.shift();
	//const type = args[1];
	//args2 = args;
	//args2.shift();
	//args2.shift();
	//needs commenting really fucking bad
	var argsCounter = 0;
	for(const arg of args) {
		if(arg.startsWith('-')) {
			argsCounter++;
			console.log(arg);
			switch(arg) {
				case('-py'):
					type = 'py';
					break;
				case('-text'):
					type = 'text';
					break;
				case('-last'):
					lastMessage = true;
					break;
				case('-ping'):
					pingMessage = true;
					break;
				default:
			}
		} else {
			break;
		}
	}

	//javascript acts weird when you shift() within an array? All cases fail after a shift operations
	//if you were wondering why this bit of code is right here. 
	//Don't worry I hate it too. I can't be bothered though. I messed with it for far too long wondering why my cases kept fucking up
	for(i = 0; i < argsCounter; i++) {
		args.shift();
	}


	console.log(name);
	if(isProtected(name, message)) {
 		return;
	}

	const find = db.get('commands')
		.find({ name: name })
		.value();
	if(find) {
		message.reply("There is already a command named " + name);
		return;
	} else {
		db.get('commands')
  			.push({ id: shortid.generate(), name: name, type: type, text: args.join(' '), last: lastMessage, ping: pingMessage  })
  			.write();
	}
	// commands.push(new Command(name, type, args.join(' ')));
	message.reply('Created command ' + name + ' of type ' + type + '.');
}

function editCommand(args, message) {
	const name = args[0];
	const type = args[1];
	args.shift();
	args.shift();

	const edit = db.get('commands')
  		.find({ name: name })
 		.assign({ type: type, text: args.join(' ') })
 		.write();
 	if(edit.id == undefined) {
 		message.reply('Could not find command to edit');
 	}
	else {
		if(type == 'py') {
			fs.writeFile('.\\pyscripts\\' + name + '.py', args.join(' '), function (err) {
  				if (err) throw err;
  				console.log('Edited command file: ' + name + '.py');
			});
		}
 		message.reply('Successfully edited command');
 	}
 	console.log(edit);
}


function showCommand(args, message) {
	const name = args[0];
	const find = db.get('commands')
		.find({ name: name })
		.value();
	if(find) {
		message.channel.send(`name: ${find.name} type: ${find.type} text: \`\`\`${find.text}\`\`\``);
	}
	else {
		message.reply('Could not find command');
	}

}

function removeCommand(args, message) {
	const name = args[0];
	const type = args[1];
	const remove = db.get('commands')
  		.remove({ name: name })
  		.write();
	console.log(remove[0]);
  	if(remove[0]) {
  		if(remove[0].type == 'py') {
  			fs.unlink('.\\pyscripts\\' + name + '.py', (err) => {
  				if (err) throw err;
 				console.log('Successfully deleted command file: ' + name + '.py');
			});
  		}
  		message.reply('Successfully deleted command');
  	}
	else {
  		message.reply('Could not find command to delete');
  	}
}


function findCommand(command, args, message) {

	const find = db.get('commands')
  		.find({ name: command })
  		.value();

  	console.log(find);
	if(find != undefined) {
		runCommand(find, message);
	}
	else {
		message.reply('No command found named: ' + command);
	}
}


function runCommand(command, message) {
	switch(command.type) {
	case('text'):
		console.log(command.text);
		message.reply(command.text);
		break;
	case('py'):
		runPy(command, message);
		break;
	default:
		message.reply('command type not found');
	}
}

// const getMessageCollection = (channel) => {
// 	channel.fetchMessages({ limit: 10 })
// 		.then( message => {
// 			return message.array;
// 		});
// }


// function getMessageCollection() {

// }

function getLastMessageFromID(userID, messageCollection, message) {
	return messageCollection.filter(m => m.author.id === userID).array()[0].content;
}


function runScript(command, messageArray, message) {
	//let messageCollection = message.channel.messages;
	let arr = message.content.split(' ');
	//shift off the command so only left with arguments
	arr.shift();
	//join with lastmessage, lastidmessage
	arr = messageArray.concat(arr);

	console.log("last is: " + arr[0]);
	console.log("ping is: " + arr[1]);

	// let arr = message.channel.fetchMessages({ limit: 10 })
	// 	.then(message => return message.array(););
	// console.log(arr);
	// console.log(arr.array());
	// console.log(JSON.stringify(arr));
	// arr = messageArr.concat(arr);

	// if(messageArr.length > 1) {
	// 	messageArr.shift();
	// }
	
	const options = {
		mode: 'json',
		pythonPath: '',
		pythonOptions: ['-u'], // get print results in real-time
		scriptPath: '.\\pyscripts',
		args: arr
	};


	console.log(command);
	console.log('/pyscripts/' + command.name + '.py');
	//check for file.py if not make one
	if (fs.existsSync('.\\pyscripts\\' + command.name + '.py')) {
   		PythonShell.run(command.name + '.py', options, function(err, results) {
			if(err) {
				replyText(err.message, 'channel', message);
			}
		// results is an array consisting of messages collected during execution
			replyText(results, 'channel', message);
			console.log('Running command from file: ' + command.name);
		});
	} else {
		fs.appendFile('.\\pyscripts\\' + command.name + '.py', command.text, function (err) {
			if(err) {
				replyText(err.message, 'channel', message);
			}
  			console.log('Saved command to file: ' + command.name);
		});

		PythonShell.run(command.name + '.py', options, function(err, results) {
			if(err) {
				replyText(err.message, 'channel', message);
			}
			
		// results is an array consisting of messages collected during execution
			replyText(results, 'channel', message);
		});
	}

	// axios.post('https://pyfiddle.io/api/', {
	// 	code: `${command.text}`,
	// 	commands: `${args}`,
	// }).then(function(response) {
	// 	message.reply(response.data.output);
	// }).catch(function(error) {
	// 	console.log(error);
	// });
}

function runPy(command, message) {
	var lastMessage;
	var mentionUserID;
	var lastMessageFromID;
	//array containing mention last message and last message
	var messageArray = [];
	message.channel.fetchMessages({ limit: 10 })
  		.then(messages => {
  			//last said message besides command
  			lastMessage = messages.array()[1].content;
  			mentionUserID = messages.array()[0].mentions.users.array()[0];
  			messageArray.push(lastMessage);

  			if(mentionUserID != undefined ) {
  				mentionUserID = mentionUserID.id;
  				lastMessageFromID = getLastMessageFromID(mentionUserID, messages, message);
  				messageArray.push(lastMessageFromID);
  			}
  			
  			
  			console.log(messageArray);

  			runScript(command, messageArray, message);

  			// console.log(lastMessage.content);
  			// console.log(lastMessageFromID);

  		})
  		.catch(console.error);

}


function addWhitelist(id) {
	db.get('whitelist')
	.push({ ids: id })
	.write();
}

function checkWhitelist(message) {
	let id = message.author.id;
	const find = db.get('whitelist')
	.find({ ids: id })
	.value();
	return find;
}

function readMessage(message) {

	if(checkWhitelist(message)) {
	} else {
		return;
	}

	const msgArr = message.content.split(' ');
	let command = msgArr[0];
	command = command.replace(`${prefix}`, '');
	console.log('Recieved command: ' + command);


	if(command == 'add') {
		// remove the add command
		msgArr.shift();
		addCommand(msgArr, message);
		return;
	}

	if(command == 'whitelist') {
		msgArr.shift();
		let id = message.mentions.users.first().id;
		console.log(message.mentions.users.first().id);
		addWhitelist(id);
		return;
	}

	if(command == 'list') {
		if(commands.length == 0) {
			message.reply('There are no commands yet');
			return;
		}
		let reply = '\n';
		commands.forEach(function commandPrint(item) { reply += item.name + ' : ' + item.type + '\n';});
		message.reply(reply);
		return;
	}

	if(command == 'edit') {
		msgArr.shift();
		editCommand(msgArr, message);
		return;
	}

	if(command == 'remove') {
		msgArr.shift();
		removeCommand(msgArr, message);
		return;
	}
	if(command == 'show') {
		msgArr.shift();
		showCommand(msgArr, message);
		return;
	}
	if(command == 'runstring') {
		printReply(message);
		return;
	}

	findCommand(command, msgArr, message);

}


client
	.on('error', console.error)
	.on('warn', console.warn)
	.on('debug', console.log)
	.on('ready', () => {
		console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', () => { console.warn('Disconnected!'); })
	.on('reconnecting', () => { console.warn('Reconnecting...'); })
	.on('message', message => {
		if(message.content.startsWith(`${prefix}`)) {
			readMessage(message);
		}
	}

	)
	.on('commandError', (cmd, err) => {
		if(err instanceof commando.FriendlyError) return;
		console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	});


client.login(token);


const axios = require('axios');




class GivenCommand {
	constructor(message, args) {

		if(args.length < 3) {
			message.reply('I need more information to add your command, see !help add');
			return;
		}
		this.name = getName(message);
		this.type = getType(message);
		this.lastMessage = getLastMessage();
		this.pingMessage = getPingMessage();
		var flags;

	}



	getName() {
		name = args[0];
		args.shift();
	}

	getType() {

	}

	getLastMessage() {

	}

	getPingMessage() {

	}

}