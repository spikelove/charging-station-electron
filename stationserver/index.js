
const TcpServer = require('./tcpserver');
const date = require("silly-datetime");

const log_buffer = true;

function Station() {
    // tcp服务器连接对象
    let tcpServer = new TcpServer();

    // 心跳应答计数，最大值后重新开始计数
    let heartTick = 1;

    // 记录bms上传的数据
    let bmsGunNum = 1;

    function sendCmd(cmd, data) {
        data[0] = 0xaf;
        data[1] = 0xaf;
        data.writeUInt16LE(data.length, 2);
        data[4] = 0x10;
        data[5] = 0x00;
        data.writeUInt16LE(cmd, 6);

        // check
        let sum = 0;
        for (let i = 6; i < data.length - 1; i++) {
            sum += data[i];
        }
        data[data.length - 1] = sum & 0xff;

        tcpServer.send(data);

        if (log_buffer) {
            console.log('station server : send cmd : ' + cmd + '\n');
            console.log(data);
        }
    }

    function sendTimeSyncRequest() {
        console.log('station server : send cmd < 3 > : time sync request');

        let buf = Buffer.alloc(19 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 类型 0-查询 1-设置
        buf.writeUInt8(1, offset);
        offset += 1;
        // 起始地址
        buf.writeUInt32LE(2, offset);
        offset += 4;
        // 参数字节数
        buf.writeUInt16LE(8, offset);
        offset += 2;
        // 时间 BCD 码表示,最后一位是保留位 0xff。 如 2015－07－22－13－16－15， 为：0x20 0x15 0x07 0x22 0x13 0x16 0x15 0xff
        let timestr = date.format(new Date(), 'YYYYMMDDHHmmss');
        let j = 0;
        for (let i = offset; i < offset + 7; i++) {
            let x = timestr[j] - '0';
            let y = timestr[j + 1] - '0';
            buf[i] = x << 4 | y;
            j += 2;
        }
        offset += 7;
        buf.writeUInt8(0xff, offset);

        sendCmd(3, buf);
    }

    function processTimeSyncResponse(result) {
        console.log('station server : recv cmd < 4 > : time sync response : ' + result);
    }

    function processSignInRequest(d) {
        console.log('station server : recv cmd < 106 > : sign in request');

        // 电桩编号
        let num = d.toString('utf8', 4, 4 + 32);
        console.log('station number : ' + num);
    }

    function sendSignInResponse() {
        console.log('station server : send cmd < 105 > : sign in response');

        let buf = Buffer.alloc(4 + 9);
        buf.fill(0);
        sendCmd(105, buf);
    }

    function processHeartBeatRequest(d) {
        console.log('station server : recv cmd < 102 > : heart beat request');
    }

    function sendHeartBeatResponse() {
        console.log('station server : send cmd < 101 > : heart beat response');
        let buf = Buffer.alloc(6 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 心跳计数
        buf.writeUInt16LE(heartTick, offset);
        // 如果计数到最大值，重新开始
        if (heartTick == 0xffff) {
            heartTick = 1;
        } else {
            heartTick++;
        }

        sendCmd(101, buf);
    }

    function processReportStatusRequest(d) {
        console.log('station server : recv cmd < 104 > : report status request');

        // 解析充电桩状态数据
        let index = 4;
        // 3. 桩编码
        let num = d.toString('utf8', index, index + 32);
        console.log('station num : ' + num);
        index += 32;
        // 4. 枪个数
        let gunCount = d.readUInt8(index);
        console.log('gun count : ' + gunCount);
        index += 1;
        // 5. 枪编号
        let gunNum = d.readUInt8(index);
        console.log('gun number : ' + gunNum);
        index += 1;
        // 6. 枪类型
        let gunType = d.readUInt8(index);
        console.log('gun type : ' + gunType);
        index += 1;
        // 7. 枪状态
        let gunStatus = d.readUInt8(index);
        console.log('gun status : ' + gunStatus);
        index += 1;
        // 8. soc
        let curSoc = d.readUInt8(index);
        console.log('cur SOC : ' + curSoc);
        index += 1;
        // 9. 告警
        let warn = d.readUInt32LE(index);
        console.log('warning : ' + warn);
        index += 4;
        // 10. 车连接状态
        let carConnect = d.readUInt8(index);
        console.log('cur connect : ' + carConnect);
        index += 1;
        // 11. 本次充电累计费用
        let allChargeCost = d.readUInt32LE(index);
        console.log('all charge cost : ' + allChargeCost);
        index += 4;

        return gunNum;
    }

    function sendReportStautsResponse(gunNum) {
        console.log('station server : send cmd < 103 > : report status response');

        let buf = Buffer.alloc(42 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 充电口号
        buf.writeUInt8(gunNum, offset);
        offset += 1;
        // 充电卡号
        offset += 32;
        // 卡余额
        buf.writeUInt32LE(200000, offset);
        offset += 4;
        // 余额是否足够
        buf.writeUInt8(1, offset);
        offset += 1;

        sendCmd(103, buf);
    }

    function sendStartChargeRequest(gunNum, mode, val) {
        console.log('station server : send cmd < 7 > : start charge cmd, gunNum : <' + gunNum + '> mode : <' + mode + '> val : <' + val + '> ');

        let buf = Buffer.alloc(67 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 3. 充电口号
        buf.writeUInt8(gunNum, offset);
        offset += 1;
        // 4. 充电生效类型 0-即时  2-预约
        buf.writeUInt32LE(0, offset);
        offset += 4;
        // 5. 预留
        offset += 4;
        // 6. 充电策略 0-充满为止
        buf.writeUInt32LE(mode, offset);
        offset += 4;
        // 7. 充电策略参数
        buf.writeUInt32LE(val, offset);
        offset += 4;
        // 8. 预约启动时间
        offset += 8;
        // 9. 预约超时时间
        offset += 1;
        // 10. 用户识别号
        offset += 4;
        // 11. 断网充电标志
        offset += 1;
        // 12. 离线可冲电量
        offset += 4;

        sendCmd(7, buf);
    }

    function sendStopChargeRequest(gunNum) {
        console.log('station server : send cmd < 5 > : stop charge cmd, gunNum : <' + gunNum + '> ');

        let buf = Buffer.alloc(16 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 3. 充电口号
        buf.writeUInt8(gunNum, offset);
        offset += 1;
        // 4. 命令起始标志 
        buf.writeUInt16LE(2, offset);
        offset += 4;
        // 5. 命令个数
        buf.writeUInt8(1, offset);
        offset += 1;
        // 6. 命令参数长度 
        buf.writeUInt16LE(4, offset);
        offset += 2;
        // 7. 命令值
        buf.writeUInt32LE(0x55, offset);
        offset += 4;

        sendCmd(5, buf);
    }

    function processStartChargeResponse(d) {
        let index = 36;
        let gunNum = d.readUInt8(index);
        index += 1;
        let status = d.readUInt32LE(index);
        index += 4;
        //onNotify('startChargeRsp', status);
        console.log('station server : recv cmd < 8 > : start charge response, gunNum : <' + gunNum + '> status : <' + status + '>');
    }

    function processStopChargeResponse(d) {
        let index = 36;
        let gunNum = d.readUInt8(index);
        index += 1;
        // ignore
        index += 5;
        let status = d.readUInt8(index);
        index += 1;

        //onNotify('stopChargeRsp', status);
        console.log('station server : recv cmd < 6 > : stop charge response, gunNum : <' + gunNum + '> status : <' + status + '>');
    }

    function processChargeHistoryRequest(data) {
        // 解析充电桩状态数据
        let index = 4;
        // 3. 桩编码
        // todo:
        index += 32;
        // 4. 当前充电记录索引
        let historyIndex = data.readUInt32LE(index);

        console.log('station server : recv cmd < 402 > : charge history request, index : <' + historyIndex + '>');
        return historyIndex;
    }

    function sendChargeHistoryResponse(index) {
        console.log('station server : send cmd < 401 > : charge history response');

        let buf = Buffer.alloc(8 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        buf.writeUInt16LE(0, offset);
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 充电记录索引
        buf.writeUInt32LE(index, offset);

        sendCmd(401, buf);
    }

    function processBmsRequest(data) {
    }

    function sendBmsResponse() {
    }

    function processTcpServerRecvData(data) {
        if (log_buffer) {
            console.log('station server : recv data : ');
            console.log(data);
            console.log('\n');
        }

        if (data.length < 9) {
            console.log('station server : recv length err : ' + data.length)
            return;
        }

        let sof = data.readUInt16BE(0);
        if (sof != 0xafaf) {
            console.log('station server : recv invalid sof field !');
            return;
        }

        let len = data.readUInt16LE(2);
        if (len != data.length) {
            console.log('station server : invalid len field !');
            return;
        }

        let cmd = data.readUInt16LE(6);
        let d = data.slice(8);

        // 签到请求
        if (cmd == 106) {
            processSignInRequest(d);
            sendSignInResponse();
            // 发送时间同步请求
            sendTimeSyncRequest();
        // 充电桩参数设置应答
        } else if (cmd == 4) {
            if (d.length < 42) {
                console.log('station server : cmd 4 : invalid length !');
            }

            let addr = d.readUInt32LE(2 + 2 + 32 + 1);
            let result = d.readUInt8(2 + 2 + 32 + 1 + 4);

            // 时间同步应答
            if (addr == 2) {
                processTimeSyncResponse(result);
            }
        // 心跳请求
        } else if (cmd == 102) {
            processHeartBeatRequest(d);
            sendHeartBeatResponse();
        // 状态上报请求
        } else if (cmd == 104) {
            let gunNum = processReportStatusRequest(d);
            sendReportStautsResponse(gunNum);
        } else if (cmd == 8) {
            // 开始充电应答
            processStartChargeResponse(d);
        } else if (cmd == 6) {
            // 结束充电应答
            processStopChargeResponse(d);
        } else if (cmd == 402) {
            // 上报历史记录应答
            let index = processChargeHistoryRequest(d);
            sendChargeHistoryResponse(index);
        } else if (cmd == 302) {
            processBmsRequest(d);
            sendBmsResponse();
        }
    }

    function onTcpServerNotify(event, data) {
        if (event == 'data') {
            processTcpServerRecvData(data)
        }
    }
    // 单位: min
    function startChargeByMin(gunAddr, min) {
        sendStartChargeRequest(gunAddr, 1, min * 60);
    }

    // 单位: 0.01kw
    function startChargeByPower(gunAddr, kw) {
        sendStartChargeRequest(gunAddr, 3, kw); 
    }

    // 单位: 0.01yuan
    function startChargeByAmount(gunAddr, yuan) {
        sendStartChargeRequest(gunAddr, 2, yuan);
    }

    function startChargeByAutofull(gunAddr) {
        sendStartChargeRequest(gunAddr, 0, 0);
    }

    function stopCharge(gunAddr) {
        sendStopChargeRequest(gunAddr);
    }

    function run() {
        let port = global.charge.stationServerPort
        tcpServer.start(port, onTcpServerNotify);
    }

    return {
        run : run,
        startChargeByMin : startChargeByMin,
        startChargeByPower : startChargeByPower,
        startChargeByAmount : startChargeByAmount,
        startChargeByAutofull : startChargeByAutofull,
        stopCharge : stopCharge,
    }
}

module.exports = Station;
