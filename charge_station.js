const AppClient = require('./appclient')
const StationServer = require('./stationserver')
const { app, BrowserWindow, ipcMain } = require('electron')

var stationServer = new StationServer()

var mAsyncIpc = null

ipcMain.on('async', (event, arg) => {
    mAsyncIpc = event
})

ipcMain.on('ui-start-charge-left', (event, arg) => {
    let addr = global.charge.gunLeftAddr 
    stationServer.startCharge(addr, arg.mode, arg.val)
})

ipcMain.on('ui-start-charge-right', (event, arg) => {
    let addr = global.charge.gunRightAddr
    stationServer.startCharge(addr, arg.mode, arg.val)
})

ipcMain.on('ui-stop-charge-left', (event, arg) => {
    let addr = global.charge.gunLeftAddr
    stationServer.stopCharge(addr)
})

ipcMain.on('ui-stop-charge-right', (event, arg) => {
    let addr = global.charge.gunRightAddr
    stationServer.stopCharge(addr)
})

function startChargeByApp(addr, msg) {
    let mode = 0
    let val = 0 

    // 定时间 单位 : 分钟
    if (msg.mode == 1) {
        mode = 1
        val = msg.val * 60
    // 定电量
    } else if (msg.mode == 2) {
        mode = 3
    // 定金额
    } else if (msg.mode == 3) {
        mode = 2
    // 自动充满
    } else if (msg.mode == 4) {
        mode = 0
    }

    stationServer.startCharge(addr, mode, val)
}

function ChargeStation() {
    let gunLeftClient = new AppClient()
    let gunRightClient = new AppClient()

    function onGunLeftNotify(event, msg) {
        if (event == 'app-start-charge') {
            console.log('app start charge: [ left ]')
            startChargeByApp(global.charge.gunLeftAddr, msg)
        } else if (event == 'app-stop-charge') {
            console.log('app stop charge: [ left ]')
            stationServer.stopCharge(global.charge.gunLeftAddr)
        } else if (event == 'log') {
            if (mAsyncIpc != null) {
                mAsyncIpc.reply(event, msg)
            }
        }
    }

    function onGunRightNotify(event, msg) {
        if (event == 'app-start-charge') {
            console.log('app start charge: [ right ]')
            startChargeByApp(global.charge.gunRightAddr, msg)
        } else if (event == 'app-stop-charge') {
            console.log('app stop charge: [ right ]')
            stationServer.stopCharge(global.charge.gunRightAddr)
        } else if (event == 'log') {
            if (mAsyncIpc != null) {
                mAsyncIpc.reply(event, msg)
            }
        }
    }

    function onStationNotify(event, msg) {
        // 将充电桩的通知消息发送给界面处理
        if (mAsyncIpc != null) {
            mAsyncIpc.reply(event, msg)
        }
    }

    function run() {
        gunLeftClient.run(global.charge.gunLeftNum, onGunLeftNotify);
        gunRightClient.run(global.charge.gunRightNum, onGunRightNotify);
        stationServer.run(onStationNotify)
    }

    return {
        run: run
    }
}

module.exports = ChargeStation;
