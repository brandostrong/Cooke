const assert = require('assert');
const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token, owner } = require('./config.json');
const path = require('path');
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

db.defaults({ commands: [], whitelist: [], test: [] })
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


let {PythonShell} = require('python-shell')



function runString() {
	PythonShell.run('script.py', options, function(err, results) {
		if (err) throw err;
		// results is an array consisting of messages collected during execution
		console.log(results.join('\n'));
	});
}



// function replyText(string, type, message) {
// 	console.log("reply string is: " + string);
// 	if(string == null) { return; }
// 	var multiline = string.includes("\n");

// 	if (type == "channel" && multiline) {
// 		message.channel.send("\`\`\`" + string + "\`\`\`");
// 		return;
// 	}
// 	if (type == "channel" && !multiline) {
// 		message.channel.send(string);
// 		return;
// 	}
// 	if (type == "reply" && multiline) {
// 		message.reply("\`\`\`" + string + "\`\`\`");
// 	}
// 	if (type == "reply" && !multiline) {
// 		message.reply(string);
// 	}
// 	message.reply("err on replyText()");
// 	console.log("err on reply string \n" + string + "\n type : " + type);
// }


function ping(string, message) {
	if(string == null) { message.channel.send("NullStringError in reply()"); return; }

	var multiline = string.includes("\n");

	if (multiline) {
		message.reply("\`\`\`" + string + "\`\`\`");
	} else {
		message.reply(string);
	}
}

function reply(string, message) {
	if(string == null) { message.channel.send("NullStringError in reply()"); return; }

	var multiline = string.includes("\n");

	if (multiline) {
		message.channel.send("\`\`\`" + string + "\`\`\`");
		return;
	} else {
		message.channel.send(string);
		return;
	}
}



//command.name has command name
//command.command has command
//command.lastMessage
//command.pingMessage
//command.args has everything after name

function parseAddorEdit(command) {

	command.args = command.msgArr;
	command.lastMessage = false;
	command.pingMessage = false;
	
	if(command.args.length < 3) {
		reply('I need more information to add your command, see !help add', message);
		return;
	}
	command.name = command.msgArr[0]
	command.msgArr.shift();
	command = getArgs(command);
	return command;
}

function getArgs(command) {
	command.arguments = [];
	var argsCounter = 0;
	for(const arg of command.args) {
		if(arg.startsWith('-')) {
			argsCounter++;
			console.log(arg);
			command.arguments.push(arg.replace('-', ''));
			switch(arg) {
				case('-py'):
					command.type = 'py';
					break;
				case('-text'):
					command.type = 'text';
					break;
				case('-last'):
					command.lastMessage = true;
					break;
				case('-ping'):
					command.pingMessage = true;
					break;
				default:
			}
		} else {
			break;
		}
	}
	//javascript acts weird when you shift() within a loop? All cases fail after a shift operations
	//if you were wondering why this bit of code is right here. 
	//Don't worry I hate it too. I can't be bothered though. I messed with it for far too long wondering why my cases kept fucking up
	for(i = 0; i < argsCounter; i++) {
		command.args.shift();
	}
	return command;
}

function addCommand(command, message) {

	command = parseAddorEdit(command);

	if(isProtected(command.name, message)) {
		reply("This is a protected command", message);
 		return;
	}

	const find = db.get('commands')
		.find({ name: command.name })
		.value();
	if(find) {
		message.reply("There is already a command named " + command.name);
		return;
	} else {
		//db.get('commands')
  		//	.push({ id: shortid.generate(), name: command.name, type: command.type, text: command.msgArr.join(' '), last: command.lastMessage, ping: command.pingMessage  })
		//	.write();
		command.text = command.args;
		delete command.msgArr;
		delete command.args;
		delete command.command;
		delete command.lastMessage;
		delete command.pingMessage;
		command = Object.assign({id: shortid.generate()}, command);
		db.get('commands')
			.push(command)
			.write();
	}
	// commands.push(new Command(name, type, args.join(' ')));
	reply('Created command ' + command.name + ' of type ' + command.type + '.', message);
}

function editCommand(command, message) {

	let command = parseAddorEdit(command);

	const edit = db.get('commands')
  		.find({ name: command.name })
 		.assign({ type: command.type, text: command.args.join(' ') })
 		.write();
 	if(edit.id == undefined) {
 		reply('Could not find command to edit', message);
 	}
	else {
		if(command.type == 'py') {
			fs.writeFile('.\\pyscripts\\' + command.name + '.py', command.args.join(' '), function (err) {
  				if (err) throw err;
  				console.log('Edited command file: ' + command.name + '.py');
			});
		}
 		reply('Successfully edited command', message);
 	}
 	console.log(edit);
}


function showCommand(command, message) {
	const find = db.get('commands')
		.find({ name: command.msgArr[0] })
		.value();
	if(find) {
		message.channel.send(`name: ${find.name} type: ${find.type} arguments: { ${find.arguments} } text: \`\`\`${find.text}\`\`\``);
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

function findCommand(command, message) {

	const find = db.get('commands')
  		.find({ name: command.name })
  		.value();
  	console.log(find);
	if(find != undefined) {
		runCommand(find, message);
	}
	else {
		reply('No command found named: ' + command.name, message);
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
				reply(err.message, message);
			}
			// results is an array consisting of messages collected during execution
			reply(results, message);
			console.log('Running command from file: ' + command.name);
		});
	} else {
		fs.appendFile('.\\pyscripts\\' + command.name + '.py', command.text, function (err) {
			if(err) {
				reply(err.message, message);
			}
  			console.log('Saved command to file: ' + command.name);
		});

		PythonShell.run(command.name + '.py', options, function(err, results) {
			if(err) {
				reply(err.message, message);
			}
		// results is an array consisting of messages collected during execution
			reply(results, message);
		});
	}
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


function addWhitelist(message) {
	let id = message.mentions.users.first().id;
	console.log(message.mentions.users.first().id);
	db.get('whitelist')
	.push({ ids: id })
	.write();
}

function removeWhiteList(message) {
	let id = message.mentions.users.first().id;
	console.log(message.mentions.users.first().id);
	const remove = db.get('whitelist')
		.remove({ ids: id })
		.write();
	if(remove[0]) {
		reply("@" + id + " has been removed from whitelist", message);
	} else {
		reply("Could not find user in whitelist", message);
	}
}



function checkWhitelist(message) {
	let id = message.author.id;
	const find = db.get('whitelist')
	.find({ ids: id })
	.value();
	return find;
}

function parseMessage(message) {
	if(checkWhitelist(message)) { } else { return; }
	let command = {};
	command.msgArr = message.content.split(' ');
	command.command = command.msgArr[0].replace(`${prefix}`, '');
	command.name = command.command;
	command.msgArr.shift();
	console.log('Recieved command: ' + command.name);

	switch(command.command) {
		case('add'):
			addCommand(command, message);
			return;
		case('whitelist'):
			addWhitelist(message);
			return
		case('rwhitelist'):
			removeWhiteList(message);
			return;
		case('edit'):
			editCommand(command, message);
			return;
		case('remove'):
			removeCommand(command, message);
			return;
		case('show'):
			showCommand(command, message);
			return;
		default:
			findCommand(command, message);
	}
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
			parseMessage(message);
		}
	});


client.login(token);

