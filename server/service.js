const http = require("http");
const path = require("path");
const express = require('express');
const socketIO = require('socket.io');
const app = express();

const prime = 997;
const primeNumbers = [751, 757, 761, 769];
const typeKeys = ['LANGUAGE', 'MUSIC', 'GEOGRAPHY', 'HISTORY'];
const dataset = {};

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
        // console.log('on MESSAGE msg: ', msg);
        // io.emit('MESSAGE', buf);
        if (msg == 'login' && adminSockets.findIndex(sc => sc == socket) < 0) {
            adminSockets.push(socket)
        }
        else if (msg == 'rv24962821') {
            socket.emit('MESSAGE', {'type': 'authorized'});
        }
        else if (msg == 'data') {
            socket.emit('MESSAGE', {'type': 'data', 'data': dataset});
        }
        else if (typeof msg == 'object' && msg) {
            switch (msg.order) {
                case 'save':
                    Object.keys(msg.data).map(key => {
                        dataset[key] = msg.data[key];
                    });
                    sendMessages({'type': 'data', 'data': dataset}, socket);
                break;
                case 'action':
                    // console.log('action: ', msg)
                    sendMessages({'type': 'action', 'act': msg.act}, socket);
                default:
            }
            
        }
    });

    socket.on('disconnect', (msg) => {
        var userIdx = adminSockets.findIndex(e => e == socket);
        if (userIdx >= 0) {
            adminSockets.splice(userIdx, 1);
        }
    });

    
});

function sendMessages(data, exceptScoket) {
    // const buf = JSON.stringify(data);
    const sockets = exceptScoket ? adminSockets.filter(sc => sc != exceptScoket) : adminSockets;
    sockets.map(sc => {
        sc && sc.emit('MESSAGE', data);
    });
}