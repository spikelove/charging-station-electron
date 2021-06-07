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

function onStartCharge() {
    console.log('click start charge btn')
    ipcRenderer.send('start-charge', null)
}

function onStopCharge() {
    console.log('click stop charge btn')
    ipcRenderer.send('stop-charge', null)
}

document.getElementById('configBtn').addEventListener('click', onConfigBtn)
document.getElementById('startChargeBtn').addEventListener('click', onStartCharge)
document.getElementById('stopChargeBtn').addEventListener('click', onStopCharge)

document.onkeydown = function (event) {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 27) {
        window.location.href = 'index.html'
    }
}
