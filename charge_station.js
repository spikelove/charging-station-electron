const AppClient = require('./appclient')
const StationServer = require('./stationserver')
const { app, BrowserWindow, ipcMain } = require('electron')

var stationServer = new StationServer()

var mIntGetIpc = null
var mIntSetIpc = null

ipcMain.on('start-charge', (event, arg) => {
    console.log("ui start charge >>>>>")
    stationServer.startChargeByMin(global.charge.gunLeftAddr, 10)
})

ipcMain.on('stop-charge', (event, arg) => {
    console.log("ui start charge >>>>>")
    stationServer.stopCharge(global.charge.gunLeftAddr)
})

ipcMain.on('int-get', (event, arg) => {
    mIntGetIpc = event
    stationServer.getIntParam(parseInt(arg))
})

ipcMain.on('int-set', (event, arg) => {
    mIntSetIpc = event
    stationServer.setIntParam(parseInt(arg.addr), parseInt(arg.val))
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
        if (event == 'int-get') {
            if (mIntGetIpc != null) {
                mIntGetIpc.reply('int-get', msg)
            }
        } else if (event == 'int-set') {
            if (mIntSetIpc != null) {
                mIntSetIpc.reply('int-set', msg)
            }
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
