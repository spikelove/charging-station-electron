
const remote = require('electron').remote;
var fs = require("fs")

var imgList = fs.readdirSync("./adver")

var imgCount = imgList.length

var imgIndex = 0

function setImg(index) {
    var url = "url(./adver/" + imgList[index] + ")"
    document.body.style.backgroundImage = url
}

if (imgCount == 0) {
    console.log('not found adver img !')
    window.location.href = 'index.html'
} else {
    setImg(imgIndex)
}

var imgTimer = setInterval(function() {
    imgIndex ++
    if (imgIndex >= imgCount) {
        imgIndex = 0
    }
    setImg(imgIndex)
}, remote.getGlobal('charge').adverTime * 1000)

document.onclick = function (event) {
    clearInterval(imgTimer)
    window.location.href = 'index.html'
}
