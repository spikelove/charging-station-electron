const AppClient = require('./appclient')
const StationServer = require('./stationserver')
const { app, BrowserWindow, ipcMain } = require('electron')

var stationServer = new StationServer()

/* app station status */
const APP_STA_DEFAULT   = 0
const APP_STA_IDLE      = 1
const APP_STA_CHARGING  = 3
const APP_STA_FAULT     = 6 

/* app charge mode */
const APP_MODE_DEFAULT  = 0
const APP_MODE_TIME     = 1
const APP_MODE_POWER    = 2
const APP_MODE_MONEY    = 3
const APP_MODE_AUTOFULL = 4

ipcMain.on('start-charge', (event, arg) => {
    console.log("ui start charge >>>>>")
    stationServer.startChargeByMin(global.charge.gunLeftAddr, 10)
})

ipcMain.on('stop-charge', (event, arg) => {
    console.log("ui start charge >>>>>")
    stationServer.stopCharge(global.charge.gunLeftAddr)
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

    function run() {
        //gunLeftClient.run(global.charge.gunLeftNum, onGunLeftNotify);
        //gunRightClient.run(global.charge.gunRightNum, onGunRightNotify);
        stationServer.run()
    }

    return {
        run: run
    }
}

module.exports = ChargeStation;
