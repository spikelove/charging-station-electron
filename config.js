const remote = require('electron').remote;
const { ipcRenderer } = require('electron')

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

function onStartLeftCharge() {
    console.log('click start left charge btn')
    let msg = 'left'
    mGun = 'left'
    ipcRenderer.send('start-charge', msg)
    document.getElementById('rightResult').innerHTML = ''
}

function onStopLeftCharge() {
    console.log('click stop left charge btn')
    let msg = 'left'
    mGun = 'left'
    ipcRenderer.send('stop-charge', msg)
    document.getElementById('rightResult').innerHTML = ''
}

function onStartRightCharge() {
    console.log('click start right charge btn')
    let msg = 'right'
    mGun = 'right'
    ipcRenderer.send('start-charge', msg)
    document.getElementById('rightResult').innerHTML = ''
}

function onStopRightCharge() {
    console.log('click stop right charge btn')
    let msg = 'right'
    mGun = 'right'
    ipcRenderer.send('stop-charge', msg)
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

