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


const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');


const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ commands: [], whitelist: [], test: [] })
	.write();


const protectedCommands = ['add', 'edit', 'delete', 'list', 'remove', 'show', 'help', 'whitelist'];

console.log(protectedCommands);


/**
 * Checks if a command is protected and provides a message if it is.
 * @param {string} command - The command to check.
 * @param {string} message - The message object to reply to.
 * @returns {boolean} - True if the command is protected, false otherwise.
 */
function isProtected(command, message) {
  // List of protected commands
  const protectedCommands = ['command1', 'command2', 'command3'];
  
  // Check if the command is in the list of protected commands
  if (protectedCommands.includes(command)) {
    // Reply with a message indicating that the command is protected
    message.reply('That is a protected command, cannot edit, add, or remove.');
    
    // Return true to indicate that the command is protected
    return true;
  }
  
  // Return false to indicate that the command is not protected
  return false;
}



let {PythonShell} = require('python-shell')


/**
 * Sends a ping message to the specified channel.
 *
 * @param {string} string - The message to be sent.
 * @param {object} message - The message object containing the channel to send the message to.
 * @return {undefined} The function does not return a value.
 */
function ping(string, message) {
	if(string == null) { message.channel.send("NullStringError in reply()"); return; }

	var multiline = string.includes("\n");

	if (multiline) {
		message.reply("\`\`\`" + string + "\`\`\`");
	} else {
		message.reply(string);
	}
}

/**
 * Reply to a message with a string.
 *
 * @param {string} string - The string to reply with.
 * @param {object} message - The message object to reply to.
 * @return {undefined} There is no return value.
 */
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

/**
 * Parses the command for adding or editing and returns the modified command object.
 *
 * @param {object} command - The command object to be modified.
 * @return {object} The modified command object.
 */
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

/**
 * Generates a function comment for the given function body.
 *
 * @param {string} command - the command to process
 * @return {object} command - the processed command object
 */
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

/**
 * Adds a command to the database.
 *
 * @param {string} command - The command to be added.
 * @param {object} message - The message object.
 * @return {void} This function does not return anything.
 */
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

/**
 * Edits a command based on the given command and message.
 *
 * @param {string} command - The command to be edited.
 * @param {string} message - The message associated with the command.
 * @return {undefined} - This function does not return a value.
 */
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


/**
 * Retrieves a command from the database and sends a message containing its details.
 *
 * @param {string} command - The name of the command to retrieve.
 * @param {object} message - The message object used to send the response.
 * @return {undefined} This function does not return a value.
 */
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

/**
 * Removes a command from the database and deletes the corresponding file if it exists.
 *
 * @param {Array} args - An array containing the command name and type.
 * @param {Object} message - The message object.
 * @return {undefined} The function does not return a value.
 */
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

/**
 * Finds a command in the database and runs it if found, or sends an error message if not found.
 *
 * @param {object} command - The command object to search for in the database.
 * @param {object} message - The message object containing information about the command execution.
 * @return {undefined}
 */
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

/**
 * Executes a command based on its type and sends a response message.
 *
 * @param {object} command - The command object.
 * @param {object} message - The message object.
 * @return {undefined} - There is no return value.
 */
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

/**
 * Returns the content of the last message sent by a specific user.
 *
 * @param {string} userID - The ID of the user.
 * @param {Array} messageCollection - The collection of messages.
 * @param {Object} message - The message object.
 * @return {string} The content of the last message sent by the user.
 */
function getLastMessageFromID(userID, messageCollection, message) {
	return messageCollection.filter(m => m.author.id === userID).array()[0].content;
}

/**
 * Executes a script with the given command and arguments.
 *
 * @param {string} command - The command to execute.
 * @param {Array} messageArray - An array of messages.
 * @param {string} message - The message.
 * @return {undefined}
 */
function runScript(command, messageArray, message) {
	//let messageCollection = message.channel.messages;
	let arr = message.content.split(' ');
	//shift off the command so only left with arguments
	arr.shift();
	//join with lastmessage, lastidmessage
	arr = messageArray.concat(arr);
	console.log("last is: " + arr[0]);
	console.log("ping is: " + arr[1]);

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

/**
 * Runs a Python command with a given message.
 *
 * @param {string} command - The Python command to run.
 * @param {string} message - The message to use when running the command.
 */
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


/**
 * Adds the specified user ID to the whitelist.
 *
 * @param {Object} message - The message object.
 * @return {undefined}
 */
function addWhitelist(message) {
	let id = message.mentions.users.first().id;
	console.log(message.mentions.users.first().id);
	db.get('whitelist')
	.push({ ids: id })
	.write();
}

/**
 * Removes a user from the whitelist.
 *
 * @param {Object} message - The message object.
 * @return {undefined}
 */
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



/**
 * Checks if the given message author's ID is whitelisted.
 *
 * @param {Object} message - The message object.
 * @return {Object} The whitelisted object if the author's ID is found, otherwise undefined.
 */
function checkWhitelist(message) {
	let id = message.author.id;
	const find = db.get('whitelist')
	.find({ ids: id })
	.value();
	return find;
}

/**
 * Parses a message and performs various commands based on the content of the message.
 *
 * @param {string} message - The message to be parsed.
 * @return {undefined} - This function does not return a value.
 */
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