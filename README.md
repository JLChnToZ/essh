# ESSH (Temporary Name)

An attempt on writting a shell based on Node.js REPL.

This is just a prototype, but you may try out.

## Usage

Everything inside this shell is written in JavaScript.
You may extend/use it just like you are using javascript.
But there has some extensions built-in this shell:

Navigating through files and getting its contents:
```javascript
// Print out the contents Something.txt at the parent directory.
console.log($['..']['Something.txt'][$$data].toString('utf8'))
```

Writing contents into file:
```javascript
$.newfile[$$data] = 'The text that overrites this file.'
```

Executing an executable:
```javascript
// Launch cmd on Windows. (Does not work on *nix)
$C.Windows.System32['cmd.exe']('/c', 'help') // This will return everything output (as buffers), you may use a variable to store it.
```

Moving a file:
```javascript
// Move a file inside Subdir to user's home driectory.
$home.NewFile = $.SubDir.OldFile
```

Delete a file:
```javascript
// Delete Rubbish.tmp at *nix root directory. ($root does not work on windows)
delete $root['Rubbish.tmp']
```

Change current working directory:
```javascript
// Change current working directory to root.
$ = $root;
```

WIP

## License

MIT