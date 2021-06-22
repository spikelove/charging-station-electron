const { ipcRenderer } = require('electron')
const remote = require('electron').remote;

var GUN_LEFT_DEFAULT_NUM = '02db21'
var GUN_RIGHT_DEFAULT_NUM = '027931'
var GUN_LEFT_DEFAULT_NAME = '充电01'
var GUN_RIGHT_DEFAULT_NAME = '充电02'
var APP_SERVER_DEFAULT_IP = '106.75.129.117'
var APP_SERVER_DEFAULT_PORT = 12346
var STATION_SERVER_DEFAULT_PORT = 33033

var QRCODE_DEFAULT_TIME = 30
var ADVER_DEFAULT_TIME = 60

var GUN_LEFT_DEFAULT_ADDR = 0
var GUN_RIGHT_DEFAULT_ADDR = 1

console.log('read local data')
let tmp = null
tmp = window.localStorage.gunLeftNum
if (tmp == undefined) {
    remote.getGlobal('charge').gunLeftNum = GUN_LEFT_DEFAULT_NUM 
} else {
    remote.getGlobal('charge').gunLeftNum = tmp
}

tmp = window.localStorage.gunLeftName
if (tmp == undefined) {
    remote.getGlobal('charge').gunLeftName = GUN_LEFT_DEFAULT_NAME 
} else {
    remote.getGlobal('charge').gunLeftName = tmp
}

tmp = window.localStorage.gunRightNum
if (tmp == undefined) {
    remote.getGlobal('charge').gunRightNum = GUN_RIGHT_DEFAULT_NUM 
} else {
    remote.getGlobal('charge').gunRightNum = tmp
}

tmp = window.localStorage.gunRightName
if (tmp == undefined) {
    remote.getGlobal('charge').gunRightName = GUN_RIGHT_DEFAULT_NAME 
} else {
    remote.getGlobal('charge').gunRightName = tmp
}

tmp = window.localStorage.appServerIp
if (tmp == undefined) {
    remote.getGlobal('charge').appServerIp = APP_SERVER_DEFAULT_IP 
} else {
    remote.getGlobal('charge').appServerIp = tmp
}

tmp = window.localStorage.appServerPort
if (tmp == undefined) {
    remote.getGlobal('charge').appServerPort = APP_SERVER_DEFAULT_PORT 
} else {
    remote.getGlobal('charge').appServerPort = tmp
}

tmp = window.localStorage.stationServerPort
if (tmp == undefined) {
    remote.getGlobal('charge').stationServerPort = STATION_SERVER_DEFAULT_PORT 
} else {
    remote.getGlobal('charge').stationServerPort = tmp 
}

tmp = window.localStorage.qrcodeTime
if (tmp == undefined) {
    remote.getGlobal('charge').qrcodeTime = QRCODE_DEFAULT_TIME 
} else {
    remote.getGlobal('charge').qrcodeTime = tmp 
}

tmp = window.localStorage.adverTime
if (tmp == undefined) {
    remote.getGlobal('charge').adverTime = ADVER_DEFAULT_TIME 
} else {
    remote.getGlobal('charge').adverTime = tmp 
}

tmp = window.localStorage.gunLeftAddr
if (tmp == undefined) {
    remote.getGlobal('charge').gunLeftAddr = GUN_LEFT_DEFAULT_ADDR 
} else {
    remote.getGlobal('charge').gunLeftAddr = tmp
}

tmp = window.localStorage.gunRightAddr
if (tmp == undefined) {
    remote.getGlobal('charge').gunRightAddr = GUN_RIGHT_DEFAULT_ADDR
} else {
    remote.getGlobal('charge').gunRightAddr = tmp 
}

console.log('gun left num: ' + remote.getGlobal('charge').gunLeftNum)
console.log('gun left name: ' + remote.getGlobal('charge').gunLeftName) 
console.log('gun right num: ' + remote.getGlobal('charge').gunRightNum)
console.log('gun right name: ' + remote.getGlobal('charge').gunRightName)
console.log('app server ip: ' + remote.getGlobal('charge').appServerIp)
console.log('app server port: ' + remote.getGlobal('charge').appServerPort)
console.log('station server port: ' + remote.getGlobal('charge').stationServerPort)
console.log('qrcode time: ' + remote.getGlobal('charge').qrcodeTime)
console.log('adver time: ' + remote.getGlobal('charge').adverTime)
console.log('gun left addr: ' + remote.getGlobal('charge').gunLeftAddr) 
console.log('gun right addr: ' + remote.getGlobal('charge').gunRightAddr)

// 设置二维码图片和文字
document.getElementById("left_name").innerHTML = remote.getGlobal('charge').gunLeftName
document.getElementById("right_name").innerHTML = remote.getGlobal('charge').gunRightName
document.getElementById("left_qrcode").src= "./qrcode/" + remote.getGlobal('charge').gunLeftNum + ".png";
document.getElementById("right_qrcode").src= "./qrcode/" + remote.getGlobal('charge').gunRightNum + ".png";

var indexTimer = setTimeout(function() {
    window.location.href = 'adver.html'
}, remote.getGlobal('charge').qrcodeTime * 1000)

setTimeout(function() {
    ipcRenderer.send('index-done', null)
}, 1000)

document.onkeydown = function (event) {
    var e = event || window.event || arguments.callee.caller.arguments[0];
    // Esc
    if (e && e.keyCode == 27) {
        clearTimeout(indexTimer)
        window.location.href = 'config.html'
    }
}
