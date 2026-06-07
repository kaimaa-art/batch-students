// const http = require('http')
// const port = 5000;
// const app = require('./app')

// const server = http.createServer(app)
// server.listen(port, () => {
//     console.log('app is running in the port ' + port)
// })


const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});