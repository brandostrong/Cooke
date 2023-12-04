# Cooke
## Info
An extremely modular discord bot. [Inspired by an IRC bot named Shocky](https://github.com/clone1018/Shocky), [which in turn was inspired by an IRC bot named Crow](https://github.com/lahwran/skybot), [a fork of Skybot](https://github.com/rmmh/skybot). Instead of programming through the bot's internal code, program the bot through discord. Commands can be written in Python through the chat client, and are stored within an internal database. 

Features include adding, removing, and listing commands, and has a fully function user and command whitelist. Commands can be fed any number of inputs, and are fully featured(with the exception of security and sandboxing). Add help info to your commands to make them more understandable!

Not up to date, and unmaintained for now, DM for more info.

## Usage
# Adding commands within Discord
```
?add commandname -language -type text
```
Possible values for language are ```-py``` and ```-js```
Possible values for type are -last, -ping, -text
* ```-last``` will perform operations on the last message said in chat
* ```-ping``` will properly ping a mentioned user in command arguments, last, or if not mentioned, the most recent.
* ```-text``` will treat command text as plaintext and simply repeat

# Multi Line Command Example:
``` python
?add pyadd -py 
import sys
x = 0
for i in sys.argv[2:]:
     x += int(i)
print(x)
```
This incorporates the -py flag to enable python code, shows that the bot can parse multi-line commands correctly, and demonstrates its ability to read arguments
```
?pyadd 1 2 3
Cooke: 6
```

# Showing Commands

Use ```?show commandname``` to see the associated info for a command
```
?show pyadd
```

```
cooke: pyadd -py
import sys
x = 0
for i in sys.argv[2:]:
     x += int(i)
print(x)
```

# Editing Commands
Editing Commands works exactly like adding, following the same conventions, but with the ```?edit``` command. Edits are saved and ```?undo``` will be implemented in the future

```
?edit pyadd -py
import sys
x = 0
for i in sys.argv[2:]:
     x += int(i)
print("the answer to the add command is: " + str(x))
```

# Removing Commands
Removing commands can be done with ```?remove commandname```

# Whitelisting 

Adding users to a whitelist will enable whitelisting, automatically excluding users not in the whitelist
Adding can be done with ```?whitelist userid```
Removing can be done with ```?rwhitelist userid```

If no users are contained within the whitelist, bot will revert to default whitelist-free usage

# Protecting Commands
The ability to protect a command is vital to bot security, and while cannot be done within discord, feel free to edit the isProtected function to suit your needs