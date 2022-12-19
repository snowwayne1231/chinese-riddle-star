const http = require("http");
const path = require("path");
const express = require('express');
const socketIO = require('socket.io');
const app = express();

const prime = 997;
const primeNumbers = [751, 757, 761, 769];
const typeKeys = ['LANGUAGE', 'MUSIC', 'GEOGRAPHY', 'HISTORY'];

app.get('/qr', function (req, res) {
    console.log(new Date(), 'req.query.key: ', req.query.key)
    if (req.query.key) {
        const keynum = parseInt(req.query.key, 16);
        if (keynum && keynum > 0) {
            const seed = keynum / prime;
            for (let i =0; i < primeNumbers.length; i++) {
                let loc = primeNumbers[i];
                let final = seed / loc;
                if (Number.isInteger(final) && final <= 15) {
                    sendMessages({'type': typeKeys[i], 'qidx': final - 1});
                    res.status(200).send('Question: ' + final + ' Done.');
                    return
                }
            }
        }
    }
    res.status(404).send('');
})

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'public')));

server = http.createServer(app)
server.listen(21223, () => {
    console.log('Express started')
})



const io = socketIO(server, {cors: {origin: '*'}});
const adminSockets = [];
io.on('connection', function (socket) {
    
    socket.on('MESSAGE', (msg) => {
        console.log('on MESSAGE msg: ', msg);
        // io.emit('MESSAGE', buf);
        if (msg == 'login' && adminSockets.findIndex(sc => sc == socket) < 0) {
            adminSockets.push(socket)
        }
    });

    socket.on('disconnect', (msg) => {
        var userIdx = adminSockets.findIndex(e => e == socket);
        if (userIdx >= 0) {
            adminSockets.splice(userIdx, 1);
        }
    });

    
});

function sendMessages(data) {
    // const buf = JSON.stringify(data);
    adminSockets.map(sc => {
        sc && sc.emit('MESSAGE', data);
    });
}