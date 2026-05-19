const http = require('http');
/*
old formate
function requestListener(req, res){
    console.log(req);
}

http.createServer(requestListener);
*/
// new type 1
// http.createServer(function(req, res){
//     console.log(req);
// });

// new type 2
const server = http.createServer((req, res) => {
    console.log(req);   // show all log
});

const PORT = 3001;
// server.listen(PORT);

server.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
});
// callback