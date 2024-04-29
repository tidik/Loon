/***
 * 沃音乐百度直连
 */
let HTTP_STATUS_INVALID = -1;
let HTTP_STATUS_CONNECTED = 0;
let HTTP_STATUS_WAITRESPONSE = 1;
let HTTP_STATUS_FORWARDING = 2;
var httpStatus = HTTP_STATUS_INVALID;

let tag = "@";
let fake_host = "listen.10155.com"

function createVerify(address) {
  let index = 0;
  for(let i = 0; i < address.length; i++) {
    index = (index * 1318293 & 0x7FFFFFFF) + address.charCodeAt(i);
  }
  if(index < 0) {
    index = index & 0x7FFFFFFF;
  }
  // console.log(`Host: ${address}，X-T5-Auth: ${index}`);
  return index;
}

function tunnelDidConnected() {
  console.log($session);
  if ($session.proxy.isTLS) {
    //https
  } else {
    //http
    _writeHttpHeader();
    httpStatus = HTTP_STATUS_CONNECTED;
  }
  return true;
}
function tunnelTLSFinished() {
  _writeHttpHeader();
  httpStatus = HTTP_STATUS_CONNECTED;
  return true;
}
function tunnelDidRead(data) {
  if (httpStatus == HTTP_STATUS_WAITRESPONSE) {
    httpStatus = HTTP_STATUS_FORWARDING;
    $tunnel.established($session); //可以进行数据转发
    return null; //不将读取到的数据转发到客户端
  } else if (httpStatus == HTTP_STATUS_FORWARDING) {
    return data;
  }
}

function tunnelDidWrite() {
  if (httpStatus == HTTP_STATUS_CONNECTED) {
    httpStatus = HTTP_STATUS_WAITRESPONSE;
    $tunnel.readTo($session, '\x0D\x0A\x0D\x0A'); //读取远端数据直到出现\r\n\r\n
    return false; //中断wirte callback
  }
  return true;
}

function tunnelDidClose() {
  return true;
}

//Tools
function _writeHttpHeader() {
  let conHost = $session.conHost;
  let conPort = $session.conPort;
  let verify = createVerify(conHost);

  var header = `CONNECT ${conHost}:${conPort}${tag}${fake_host} HTTP/1.1\r\nHost: ${conHost}@${fake_host}\r\nX-T5-Auth: ${verify}\r\nProxy-Connection: keep-alive\r\n\r\n`;
  $tunnel.write($session, header);
  console.log(header);
}