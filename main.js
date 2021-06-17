const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const ChargeStation = require('./charge_station')
const chargeStation = new ChargeStation()

// 全局数据
global.charge = {
  gunLeftNum: '',
  gunLeftName: '', 
  gunRightNum: '',
  gunRightName: '',
  appServerIp: '',
  appServerPort: 0,
  stationServerPort: 0,
  qrcodeTime: 0,
  adverTime: 0,
  gunLeftAddr:0,
  gunRightAddr:1,
}

var stationRunFlag = false

ipcMain.on('index-done', (event, arg) => {
    if (!stationRunFlag) {
        // 业务代码入口
        chargeStation.run()
        stationRunFlag = true
    }
})

ipcMain.on('config-exit', (event, arg) => {
    app.quit()
})

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        titleBarStyle: 'hidden',
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    win.setMenuBarVisibility(false);
    win.loadURL(path.join('file://', __dirname, '/index.html'))
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
