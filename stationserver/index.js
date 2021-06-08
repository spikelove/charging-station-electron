
const TcpServer = require('./tcpserver');
const date = require("silly-datetime");

const log_buffer = false;

function Station() {
    // tcp服务器连接对象
    let mTcpServer = new TcpServer();
    // 事件回调
    let mNotify = null;

    let chargeUser = 'abcd';

    // 心跳应答计数，最大值后重新开始计数
    let heartTick = 1;

    // 记录bms上传的数据
    let bmsGunNum = 0;
    let bmsTick = 0;
    let _bcsVoltage = 0;
    let _bcsCurrent = 0;

    let chargeInfoGunNum = 0;
    let chargeInfoUser;

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

        mTcpServer.send(data);

        if (log_buffer) {
            console.log('station server : send cmd : ' + cmd + '\n');
            console.log(data);
        }
    }

    // cmd = 1 get
    function sendGetIntParamRequest(addr) {
        console.log('station server : send cmd < 1 > : get int param, addr: <' + addr + '>');

        let buf = Buffer.alloc(10 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 3. 类型 0 -查询 1 -设置
        buf.writeUInt8(0, offset);
        offset += 1;
        // 4. 命令起始标志 
        buf.writeUInt16LE(addr, offset);
        offset += 4;
        // 5. 命令个数
        buf.writeUInt8(1, offset);
        offset += 1;

        sendCmd(1, buf);
    }

    // cmd = 1 set
    function sendSetIntParamRequest(addr, val) {
        console.log('station server : send cmd < 1 > : set int param, addr: <' + addr + '> val: <' + val + '>');

        let buf = Buffer.alloc(16 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        offset += 2;
        buf.writeUInt16LE(0, offset);
        offset += 2;
        // 3. 类型 0 -查询 1 -设置
        buf.writeUInt8(1, offset);
        offset += 1;
        // 4. 命令起始标志 
        buf.writeUInt32LE(addr, offset);
        offset += 4;
        // 5. 命令个数
        buf.writeUInt8(1, offset);
        offset += 1;
        // 6. 设置参数字节数
        buf.writeUInt16LE(2, offset);
        offset += 2;
        // 7. 设置数据
        buf.writeUInt32LE(val, offset);
        offset += 4;

        sendCmd(1, buf);
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

        var msg = {}
        msg.gun = gunNum
        msg.gunStatus = gunStatus
        msg.carStatus = carConnect
        mNotify('gun-status', msg);

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
        // 用户识别号
        buf.fill(chargeUser, offset, offset + 4, 'utf8');
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

        let buf = Buffer.alloc(69 + 9);
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
        buf.fill(chargeUser, offset, offset + 4, 'utf8');
        offset += 32;
        // 11. 断网充电标志
        offset += 1;
        // 12. 非刷卡用户余额
        buf.writeUInt32LE(20000, offset);
        offset += 4;

        sendCmd(7, buf);
    }

    function sendChargeControlRequest(gunNum, addr, val) {
        console.log('station server : send cmd < 5 > : gunNum : <' + gunNum + '>', 'addr: <' + addr + '>');

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
        buf.writeUInt16LE(addr, offset);
        offset += 4;
        // 5. 命令个数
        buf.writeUInt8(1, offset);
        offset += 1;
        // 6. 命令参数长度 
        buf.writeUInt16LE(4, offset);
        offset += 2;
        // 7. 命令值
        buf.writeUInt32LE(val, offset);
        offset += 4;

        sendCmd(5, buf);
    }

    function processIntParamResponse(d) {
        console.log('station server : recv cmd < 2 > : int param response');
        console.log(d)

        let offset = 36;
        // 类型 0-查询 1-设置
        let type = d.readUInt8(offset) 
        console.log('type : ' + type);
        offset += 1
        // 参数起始地址
        let addr = d.readUInt32LE(offset)
        console.log('addr: ' + addr)
        offset += 4
        // 参数数量
        let paramCnt = d.readUInt8(offset)
        console.log('param cnt: ' + paramCnt)
        offset += 1
        // 参数结果
        let result = d.readUInt8(offset)
        console.log('result: ' + result)
        offset += 1

        if (type == 0) {
            let val = d.readUInt32LE(offset)
            console.log('val: ' + val)
            //mNotify('int-get', val)
        } else if (type == 1) {
            //mNotify('int-set', result)
        }
    }

    function processStartChargeResponse(d) {
        let index = 36;
        let gunNum = d.readUInt8(index);
        index += 1;
        let status = d.readUInt32LE(index);
        index += 4;
        console.log('station server : recv cmd < 8 > : start charge response, gunNum : <' + gunNum + '> status : <' + status + '>');
        return status;
    }

    function processStopChargeResponse(d) {
        let index = 36;
        let gunNum = d.readUInt8(index);
        index += 1;
        // ignore
        index += 5;
        let status = d.readUInt8(index);
        index += 1;

        console.log('station server : recv cmd < 6 > : stop charge response, gunNum : <' + gunNum + '> status : <' + status + '>');
        return status;
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
        console.log('station server : recv cmd < 302 > : >>>>>>>>>> bms request <<<<<<<<<<');

        let offset = 0;
        // 1. 报文次序
        bmsTick = data.readUInt16LE(offset);
        console.log('bms tick : ' + bmsTick);
        offset += 2;
        // 2. 枪口号
        bmsGunNum = data.readUInt16LE(offset);
        console.log('bms gun num : ' + bmsGunNum);
        offset += 2;
        // 3. 桩编码
        offset += 32;
        // 4. 工作状态
        let bmsStatus = data.readUInt8(offset);
        console.log('bms status : ' + bmsStatus);
        offset += 1;
        // 5. 车连接状态
        let bmsCarConnect = data.readUInt8(offset);
        console.log('bms car connect status : ' + bmsCarConnect);
        offset += 1;

        /* BRM */
        // 6. 版本
        let va = data.readUInt8(offset);
        let vb = data.readUInt8(offset+1);
        let vc = data.readUInt8(offset+2);
        console.log("brm-bms version: v" +va+'.'+vb+'.'+vc)
        offset += 3;
        // 7. 电池类型
        let batType = data.readUInt8(offset)
        console.log('bat type: ' + batType)
        offset += 1;
        // 8. 额定容量
        let edah = data.readUInt32LE(offset)
        console.log('BRM rong liang' + edah + 'Ah')
        offset += 4;
        // 9. 额定电压
        let edv = data.readUInt32LE(offset)
        console.log('BRM vol' + edv + 'V')
        offset += 4;
        // 10. 电池生产商
        offset += 4;
        // 11. 电池组序号
        offset += 4;
        // 12.13.14. 电池组生产年月日
        offset += 4;
        // 15. 电池组充电次数 
        offset += 4;
        // 16. 电池组产权标识
        offset += 1;
        // 17. 预留
        offset += 1;
        // 18. 车辆识别码
        let carVin = data.toString('utf8', offset, offset + 17);
        console.log('car vin : ' + carVin);
        offset += 17;
        // 19. 软件版本
        offset += 8;

        /* BCP */
        // 20. 单体动力蓄电池最高允许充电电压
        let bcpMaxv = data.readUInt32LE(offset)
        console.log('20. bcp max vol: ' + bcpMaxv)
        offset += 4;
        // 21. 最高允许充电电流
        let bcpMaxi = data.readUInt32LE(offset)
        console.log('21. bcp max i: ' + bcpMaxi)
        offset += 4;
        // 22. 电池标称总能量
        offset += 4;
        // 23. 最高允许充电总电压 
        offset += 4;
        // 24. 最高允许温度 
        offset += 1;
        // 25. 整车动力蓄电池荷电状态
        let bcpSoc = data.readUInt16LE(offset)
        console.log('25. bcp soc 0.1%：' + bcpSoc)
        offset += 2;
        // 26. 整车动力蓄电池当前电压 0.1v
        let bcpVol = data.readUInt32LE(offset)
        console.log('26. bcp car vol 0.1v：' + bcpVol)
        offset += 4;
        // 27. 是否充电准备好 0-未准备好 0xaa(170)-bms已完成充电准备
        let readyStatus = data.readUInt8(offset);
        console.log('27. ready status : ' + readyStatus);
        offset += 1;

        /* BCL */
        // 28. 电压需求
        let bclVol = data.readUInt32LE(offset)
        console.log('28. bcl vol require: ' + bclVol)
        offset += 4;
        // 29. 电流需求
        let bclI = data.readUInt32LE(offset)
        console.log('29. bcl i require: ' + bclI)
        offset += 4;
        // 30. 充电模式
        offset += 1;

        /* BCS - 电池充电总状态报文 */
        // 31. bcs充电电压测量值
        _bcsVoltage = data.readUInt32LE(offset);
        console.log('31. bcs vol measure val : ' + _bcsVoltage);
        offset += 4;
        // 32. bcs充电电流测量值
        _bcsCurrent = data.readUInt32LE(offset);
        console.log('32. bcs i measure val : ' + _bcsCurrent);
        offset += 4;
        // 33. bcs最高单体动力蓄电池电压
        offset += 4;
        // 34. bcs最高单体动力蓄电池组号
        offset += 1;
        // 35. bcs当前荷电状态 soc % 分辨率 0.1
        let bcsSoc = data.readUInt16LE(offset);
        console.log('bcs soc : ' + bcsSoc);
        offset += 2;
        // 36. 剩余估算充电时间 min 
        let remainMin = data.readUInt32LE(offset);
        console.log('about remain mins : ' + remainMin);
        offset += 4;
    }

    function sendBmsResponse() {
        console.log('station server : send cmd < 301 > : bms response , bms tick : ' + bmsTick + ' bmsGunNum : ' + bmsGunNum);

        let buf = Buffer.alloc(4 + 9);
        buf.fill(0);

        let offset = 8;
        buf.writeUInt16LE(bmsTick, offset);
        offset += 2;
        buf.writeUInt16LE(bmsGunNum, offset);
        offset += 2;

        sendCmd(301, buf);
    }

    function processChargeInfoRequest(d) {
        console.log('station server : recv cmd < 202 > : charge info request');

        let offset = 0;

        // 1.2. 保留
        offset += 4;
        // 3.4. 桩编码
        offset += 33;
        // 5. 枪号
        chargeInfoGunNum = d.readUInt8(offset);
        offset += 1;
        // 6. 用户号
        chargeInfoUser = d.toString('utf8', offset, offset + 32);
        console.log('user : ' + chargeInfoUser);
    }

    function sendChargeInfoResponse() {
        console.log('station server : send cmd < 201 > : charge info response');

        let buf = Buffer.alloc(37 + 9);
        buf.fill(0);

        let offset = 8;
        // 保留
        offset += 4;
        // 枪号
        buf.writeUInt8(chargeInfoGunNum, offset);
        offset += 1;
        // 用户号
        buf.fill(chargeInfoUser, offset, offset + 4, 'utf8');

        sendCmd(201, buf);
    }

    function onRecvData(data) {
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
        // 获取整形参数请求
        } else if (cmd == 2) {
            processIntParamResponse(d)
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
        // 开始充电应答
        } else if (cmd == 8) {
            let status = processStartChargeResponse(d);
            mNotify('start-result', status);
        // 结束充电应答
        } else if (cmd == 6) {
            let status = processStopChargeResponse(d);
            mNotify('stop-result', status);
        // 充电过程中上报的bms信息
        } else if (cmd == 302) {
            processBmsRequest(d);
            sendBmsResponse();
            let status = {
                bcsVoltage : _bcsVoltage,
                bcsCurrent : _bcsCurrent
            }
            mNotify('bms', status);
        // 充电完成后电桩上报, 应答了代表充电结束， 否则会一直报充电完成状态
        } else if (cmd == 202) {
            processChargeInfoRequest(d);
            sendChargeInfoResponse();
            mNotify('complete', 0);
        }
        // 充电历史记录， 离线充电完成后重新联网， 如果两分钟没有充电就会上传离线记录
        else if (cmd == 402) {
            let index = processChargeHistoryRequest(d);
            sendChargeHistoryResponse(index);
        }
    }

    function run(notify) {
        mNotify = notify
        mTcpServer.start(global.charge.stationServerPort, onRecvData);
    }

    // 单位: min
    function startChargeByMin(gunNum, min) {
        sendStartChargeRequest(gunNum, 1, min * 60);
    }

    // 单位: 0.01kw
    function startChargeByPower(gunNum, kw) {
        sendStartChargeRequest(gunNum, 3, kw); 
    }

    // 单位: 0.01yuan
    function startChargeByAmount(gunNum, yuan) {
        sendStartChargeRequest(gunNum, 2, yuan);
    }

    function startChargeByAutofull(gunNum) {
        sendStartChargeRequest(gunNum, 0, 0);
    }

    function stopCharge(gunNum) {
        sendChargeControlRequest(gunNum, 2, 0x55);
    }

    return {
        run : run,
        startChargeByMin : startChargeByMin,
        startChargeByPower : startChargeByPower,
        startChargeByAmount : startChargeByAmount,
        startChargeByAutofull : startChargeByAutofull,
        stopCharge : stopCharge,
        getIntParam: sendGetIntParamRequest,
        setIntParam: sendSetIntParamRequest,
    }
}

module.exports = Station;
