const [stage, command] = process.argv.slice(2);
console.error((command ?? 'Command') + ' is not implemented yet. It belongs to stage ' + (stage ?? 'a later stage') + '.');
process.exitCode = 1;
