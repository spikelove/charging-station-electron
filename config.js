const remote = require('electron').remote;
const { ipcRenderer } = require('electron')

var sd = require('silly-datetime');
 

document.getElementById('gunLeftNum').value = remote.getGlobal('charge').gunLeftNum 
document.getElementById('gunLeftName').value = remote.getGlobal('charge').gunLeftName 
document.getElementById('gunRightNum').value = remote.getGlobal('charge').gunRightNum 
document.getElementById('gunRightName').value = remote.getGlobal('charge').gunRightName 
document.getElementById('appServerIp').value = remote.getGlobal('charge').appServerIp 
document.getElementById('appServerPort').value = remote.getGlobal('charge').appServerPort 
document.getElementById('stationServerPort').value = remote.getGlobal('charge').stationServerPort 
document.getElementById('qrcodeTime').value = remote.getGlobal('charge').qrcodeTime 
document.getElementById('adverTime').value = remote.getGlobal('charge').adverTime 
document.getElementById('gunLeftAddr').value = remote.getGlobal('charge').gunLeftAddr 
document.getElementById('gunRightAddr').value = remote.getGlobal('charge').gunRightAddr 

function onConfigBtn() {
    window.localStorage.gunLeftNum = document.getElementById('gunLeftNum').value
    window.localStorage.gunLeftName = document.getElementById('gunLeftName').value
    window.localStorage.gunRightNum = document.getElementById('gunRightNum').value 
    window.localStorage.gunRightName = document.getElementById('gunRightName').value
    window.localStorage.appServerIp = document.getElementById('appServerIp').value
    window.localStorage.appServerPort = document.getElementById('appServerPort').value
    window.localStorage.stationServerPort = document.getElementById('stationServerPort').value
    window.localStorage.qrcodeTime = document.getElementById('qrcodeTime').value
    window.localStorage.adverTime = document.getElementById('adverTime').value
    window.localStorage.gunLeftAddr = document.getElementById('gunLeftAddr').value 
    window.localStorage.gunRightAddr = document.getElementById('gunRightAddr').value

    window.location.href = 'index.html'
}

let mGun = 'left'

let logdefault = '充电桩服务器启动, 监听端口: ' + remote.getGlobal('charge').stationServerPort
let logtext = ''

function log_display(msg) {
    let logmsg = '[' + sd.format(new Date(), 'HH:mm') + '] ' + msg
    let log = document.getElementById("logtext")
    logtext = logmsg + '</br>' + logtext
    log.innerHTML = logtext
}

log_display(logdefault)

function onStartLeftCharge() {
    mGun = 'left'
    let modeSelect = document.getElementById('chargeMode')
    let index = modeSelect.selectedIndex
    let mode = modeSelect.options[index].value
    let val = document.getElementById('chargeVal').value

    let msg = {}
    msg.mode = mode
    msg.val = val
    let log = '发送左枪充电命令 ' + mode + ' :: ' + val
    log_display(log)
    ipcRenderer.send('ui-start-charge-left', msg)
    document.getElementById('rightResult').innerHTML = ''
}

function onStartRightCharge() {
    mGun = 'right'
    let modeSelect = document.getElementById('chargeMode')
    let index = modeSelect.selectedIndex
    let mode = modeSelect.options[index].value
    let val = document.getElementById('chargeVal').value

    let msg = {}
    msg.mode = mode
    msg.val = val

    let log = '发送右枪充电命令 ' + mode + ' :: ' + val
    log_display(log)
    ipcRenderer.send('ui-start-charge-right', msg)
    document.getElementById('rightResult').innerHTML = ''
}

function onStopLeftCharge() {
    mGun = 'left'
    let log = '发送左枪停止充电命令 '
    log_display(log)
    ipcRenderer.send('ui-stop-charge-left', null)
    document.getElementById('rightResult').innerHTML = ''
}

function onStopRightCharge() {
    mGun = 'right'

    let log = '发送右枪停止充电命令 '
    log_display(log)
    ipcRenderer.send('ui-stop-charge-right', null)
    document.getElementById('rightResult').innerHTML = ''
}

// 向主线程发送一个异步消息，用于主线程保存异步通信句柄
ipcRenderer.send('async', null)

//{
//    gun: 0;
//    result: 0;
//}
ipcRenderer.on('start-result', (event, arg) => {
    console.log('start result: ' + arg)
    if (mGun == 'left') {
        document.getElementById('leftResult').innerHTML = arg
    } else {
        document.getElementById('rightResult').innerHTML = arg
    }
})

ipcRenderer.on('stop-result', (event, arg) => {
    console.log('stop result: ' + arg)
    if (mGun == 'left') {
        document.getElementById('leftResult').innerHTML = arg
    } else {
        document.getElementById('rightResult').innerHTML = arg
    }
})

ipcRenderer.on('gun-status', (event, arg) => {
    console.log('gun status gun: <' + arg.gun + '> gunStatus: <' + arg.gunStatus + '> carStatus <' + arg.carStatus + '>')

    if (arg.gun == remote.getGlobal('charge').gunLeftAddr) {
        document.getElementById('leftGunStatus').innerHTML = arg.gunStatus
        document.getElementById('leftCarStatus').innerHTML = arg.carStatus
    } else if (arg.gun == remote.getGlobal('charge').gunRightAddr) {
        document.getElementById('rightGunStatus').innerHTML = arg.gunStatus
        document.getElementById('rightCarStatus').innerHTML = arg.carStatus
    }
})

//{
//    gun: 0;
//    gunStatus: 0;
//    carStatus: 0;
//}
ipcRenderer.on('report-status', (event, arg) => {
    document.getElementById('intReturnVal').innerHTML = arg
})

ipcRenderer.on('log', (event, arg) => {
    log_display(arg)
})



document.getElementById('configBtn').addEventListener('click', onConfigBtn)

document.getElementById('startLeftChargeBtn').addEventListener('click', onStartLeftCharge)
document.getElementById('stopLeftChargeBtn').addEventListener('click', onStopLeftCharge)
document.getElementById('startRightChargeBtn').addEventListener('click', onStartRightCharge)
document.getElementById('stopRightChargeBtn').addEventListener('click', onStopRightCharge)

document.onkeydown = function (event) {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 27) {
        window.location.href = 'index.html'
    }
}

