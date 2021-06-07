
// 充电桩当前状态
const stationStatus = {
    default : 0,
    idle : 1,
    charging : 3,
    fault : 6
}

// 充电模式
const chargeMode = {
    default : 0,
    time : 1,
    power : 2,
    money : 3,
    autofull : 4
}

exports.stationStatus = stationStatus;
exports.chargeMode = chargeMode;