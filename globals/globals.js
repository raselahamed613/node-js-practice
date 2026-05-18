/*/global objects
console.log();  // golbal

setTimeout()
clearTimeout()

setInterval();
clearInterval();

window.console.log/ consol.log
window.consol.log  // javaScript engine will prefix this statement 

setTimeout();clearTimeout();setInterval();clearInterval(); those are belong to window object
so we can use like this >> window.setTimeout

same token when we declare a variable let's say message>> 
var message = '';
global.setTimeout
*/

// var message = '';
// console.log(globalThis.message);

//output is undefined. if the variable I define isn't added on global object

//module
console.log(module);