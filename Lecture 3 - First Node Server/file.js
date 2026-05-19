/*// 1. Import the File System module
const fs = require('fs');

// 2. Create a file named "hello.txt" with some text inside
fs.writeFileSync('hello.txt', 'Hello! This file was made by Node.js.');

// 3. Print a message to show it worked
console.log('The file was created successfully!');
*/
const fs = require('fs');

// Read the text from "hello.txt"
// 'utf8' helps Node.js understand English letters
const fileContent = fs.readFileSync('hello.txt', 'utf8');

// Show the text in the terminal
console.log('Inside the file, it says:');
console.log(fileContent);