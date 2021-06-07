
const TcpClient = require('./tcpclient');
const StationStatus = require('./def').stationStatus;
const ChargeMode = require('./def').chargeMode;

const show_buffer = false;

function crc16(buf) {
    let crc = 0xffff;

    for (let i = 0; i < buf.length; i++) {
        crc = (crc >> 8) ^ buf[i];
        for (let j = 0; j < 8; j++) {
            let temp = crc & 0x01;
            crc >>= 0x0001;
            if (temp == 0x01) {
                crc ^= 0xA001;
            }
        }
    }

    return crc;
}

/**
 * events: 
 * 
 * 'start-charge'
 * 'stop-charge'
 */

function AppClient() {
    let tcpClient = new TcpClient();

    // 电桩编号, 服务器分配, 3字节16进制
    // 使用字符串格式存储, 如 : '02db21'
    let mStationNum = '';
    let mNotify = null
    let mGetRateFlag = false

    // 命令封装和发送
    function sendCmd(cmd, data) {
        let len = data.length;
        // sof
        data[0] = 0xff;
        data[1] = 0xff;
        // len 
        data[2] = len - 3;
        // cmd
        data[3] = cmd;
        // station num
        data.fill(mStationNum, 4, 7, 'hex');
        // payload
        // crc
        let crc = crc16(data.slice(0, len - 2)); 
        data[len - 2] = crc & 0xff;
        data[len - 1] = crc >> 8 & 0xff;

        tcpClient.send(data);

        if (show_buffer) {
            console.log(mStationNum + ' send data : ');
            console.log(data);
        }
    }

    // 向服务器发送一次心跳包
    function sendHeartBeat() {
        let heartBeatData = Buffer.alloc(5);
        heartBeatData[0] = 0x0d;
        heartBeatData[1] = 0x0a;
        heartBeatData.fill(mStationNum, 2, 5, 'hex');
        tcpClient.send(heartBeatData);

        console.log(mStationNum + ' send cmd <HeartBeat>');
        if (show_buffer) {
            console.log(mStationNum + ' send data : ');
            console.log(heartBeatData);
        }
    }

    // 0x89 请求费率命令
    function sendGetRateRequest() {
        console.log(mStationNum + ' send cmd <0x89> get rate request');
        let d = Buffer.alloc(1 + 9);
        d[7] = 0x00;
        sendCmd(0x89, d);
    }

    // 0x88 服务器下发费率数据处理
    function processGetRateResponse(data) {
        console.log(mStationNum + ' recv cmd <0x88> get rate response');
    }

    // 0x83 上报充电桩状态
    function sendReportStatusRequest(status, mode, val) {
        console.log(mStationNum + ' send cmd <0x83> report station status request');
        let d = Buffer.alloc(36 + 9);
        d.fill(0);
        d[7] = status;
        d[8] = mode;
        d[9] = val & 0xff;
        d[10] = val >> 8 & 0xff;
        
        sendCmd(0x83, d);
    }

    // 0x82 处理服务器下发充电桩控制
    function processStationControlRequest(d) {
        console.log(mStationNum + ' recv cmd <0x82> station control request');

        let ctl = d[0];
        // 开始充电
        if (ctl == 0x03) {
       //     console.log('app client : start charge >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
            // 电价 单元 yuan/kwh
            let price = d[1];
        //    console.log('app client : <' + price/100 + '> yuan/kwh')
            // 充电模式 1-定时 2-定量 3-定额 4-自动充满
            let mode = d[2];
            let val = d[3] << 8 | d[4];

            let msg = {}
            msg.mode = mode
            msg.val = val

            if (mNotify != null) {
                mNotify('start-charge', msg)
            }

            // 启动充电
//            if (mode == 1) {
//                console.log('app client : start charge by time <' + val + '> mins');
////                station.startChargeByMin(val);
//            } else if (mode == 2) {
//                console.log('app client : start charge by power <' + val + '> / 100 kwh');
////                station.startChargeByPower(val);
//            } else if (mode == 3) {
//                console.log('app client : start charge by money <' + val + '> / 100 yuan');
////                station.startChargeByAmount(val);
//            } else if (mode == 4) {
//                console.log('app client : start charge by autufull');
////               station.startChargeByAutofull();
//            }
//
        // 停止充电
        } else if (ctl == 0x01) {
      //      console.log('app client : stop charge <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
            sendReportStatusRequest(StationStatus.idle, ChargeMode.time, 0x00);

            if (mNotify != null) {
                mNotify('stop-charge', msg)
            }

            //停止充电
//            station.stopCharge();
        }
    }

    // 处理app server的协议命令
    function processRecvCmd(cmd, d) {
        // 处理请求费率命令
        if (cmd == 0x88) {
            processGetRateResponse(d);
            // 上报一次充电桩状态
            sendReportStatusRequest(StationStatus.idle, ChargeMode.default, 0x00);
        // 处理充电控制命令
        } else if (cmd == 0x82) {
            processStationControlRequest(d);
        }
    }

    // tcp client 接受数据回调
    function processRecvData(data) {
        if (show_buffer) {
            console.log(mStationNum + ' recv data:')
            console.log(data);
        }
        let len = data.length;
        if (len < 2) {
            return;
        }

        // 心跳包应答 0x0f 0x0f
        if (data[0] == 0x0f && data[1] == 0x0f) {
            console.log(mStationNum + ' heartbeat response')
            if (mGetRateFlag == false) {
                sendGetRateRequest()
                mGetRateFlag = true
            }
        // 协议命令 0xff 0xff
        } else if (data[0] == 0xff && data[1] == 0xff) {
            if (len < 9) {
                return
            }

            processRecvCmd(data[3], data.slice(7, len - 2));
        }
    }

    function onNotify(event, msg) {
        if (event == 'connect') {
            sendHeartBeat()
            getRateFlag = false
            var heartBeatTimer = setInterval(sendHeartBeat, 30*1000)
        } else if (event == 'disconnect') {
            clearInterval(heartBeatTimer)
        } else if (event == 'data') {
            processRecvData(msg)
        }
    }

    function run(stationNum, notify) {
        let host = global.charge.appServerIp
        let port = global.charge.appServerPort
        mStationNum = stationNum
        mNotify = notify

        console.log('app client start :: ' + stationNum)
        tcpClient.run(host, port, onNotify);
    }

    return {
        run : run,
        reportStatus : sendReportStatusRequest
    }
}

module.exports = AppClient;
