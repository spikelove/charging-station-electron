const AppClient = require('./appclient')
const StationServer = require('./stationserver')
const { app, BrowserWindow, ipcMain } = require('electron')

var stationServer = new StationServer()

var mAsyncIpc = null

ipcMain.on('async', (event, arg) => {
    mAsyncIpc = event
})

ipcMain.on('start-charge', (event, arg) => {
    let addr = global.charge.gunLeftAddr 
    if (arg == 'right') {
        addr = global.charge.gunRightAddr
    }
    console.log('ui start charge <' + arg + '> addr: <' + addr + '>')
    stationServer.startChargeByMin(addr, 10)
})

ipcMain.on('stop-charge', (event, arg) => {
    let addr = global.charge.gunLeftAddr
    if (arg == 'right') {
        addr = global.charge.gunRightAddr
    }

    console.log('ui stop charge <' + arg + '> addr: <' + addr + '>')
    stationServer.stopCharge(addr)
})

function ChargeStation() {
    let gunLeftClient = new AppClient()
    let gunRightClient = new AppClient()

    function onGunLeftNotify(event, msg) {
        if (event == 'start-charge') {
            console.log('gun left: start charge >>>>>')
        } else if (event == 'stop-charge') {
            console.log('gun left: stop charge <<<<<')
        }
    }

    function onGunRightNotify(event, msg) {
        if (event == 'start-charge') {
            console.log('gun right: start charge >>>>>')
        } else if (event == 'stop-charge') {
            console.log('gun right: stop charge <<<<<')
        }
    }

    function onStationNotify(event, msg) {
        // 将充电桩的通知消息发送给界面处理
        if (mAsyncIpc != null) {
            mAsyncIpc.reply(event, msg)
        }
    }

    function run() {
        //gunLeftClient.run(global.charge.gunLeftNum, onGunLeftNotify);
        //gunRightClient.run(global.charge.gunRightNum, onGunRightNotify);
        stationServer.run(onStationNotify)
    }

    return {
        run: run
    }
}

module.exports = ChargeStation;
