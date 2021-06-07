const net = require('net')

function TcpServer() {
    let clientSocket = null;

    function start(port, onRecv) {
        let tcpServer = net.createServer();

        tcpServer.listen(port, function() {
            console.log('tcp server : start listen port : ' + port);
        })

        tcpServer.on('connection', function (socket) {
            console.log('tcp server : accept new connetc .');
            clientSocket = socket;

            socket.on('data', function (data) {
                onRecv(data);
            })

            socket.on('end', function () {
                console.log('tcp server : disconnect !');
            })

            socket.on('error', function (err) {
                console.log(err);
                socket.destroy();
            })
        })
    }

    function send(data) {
        if (clientSocket != null) {
            clientSocket.write(data);
        }
    }

    return {
        start : start,
        send : send
    }
}

module.exports = TcpServer;
