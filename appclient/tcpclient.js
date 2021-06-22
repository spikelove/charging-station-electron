
const net = require('net');

/**
 * notify event :
 * 
 * 'connect'
 * 'disconnect'
 * 'data' 
 * 
 */

function TcpClient() {
    let client = new net.Socket();

    function run(host, port, notify) {
        client.connect(port, host)

        client.on('connect', function() {
            notify('connect', null)
        })

        client.on('data', function (data) {
            notify('data', data);
        });

        client.on('error', function(err) {
            console.log('tcp client : err : <' + err + '>');
        })

        client.on('close', function(had_err) {
            notify('disconnect', null)
            setTimeout(function() {
                notify('reconnect', null)
                client.connect(port, host)
            }, 20*1000)
        })

        client.on('end', function() {
        })
    }

    function send(data) {
        client.write(data);
    }

    return {
        run : run,
        send : send
    }
}

module.exports = TcpClient;
