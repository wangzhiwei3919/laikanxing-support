/**
 * Created by wangzhiwei on 16/7/14.
 */
function connectWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) {
        callback(WebViewJavascriptBridge)
    } else {
        document.addEventListener('WebViewJavascriptBridgeReady', function() {
            callback(WebViewJavascriptBridge)
        }, false)
    }
}

connectWebViewJavascriptBridge(function(bridge) {
    var uniqueId = 1
    function log(message, data) {
        var log = document.getElementById('log')
        var el = document.createElement('div')
        el.className = 'logLine'
        el.innerHTML = uniqueId++ + '. ' + message + ':<br/>' + JSON.stringify(data)
        if (log.children.length) { log.insertBefore(el, log.children[0]) }
        else { log.appendChild(el) }
    }
    bridge.init(function(message, responseCallback) {
        log('JS got a message', message)
        var data = { 'Javascript Responds':'Wee!' }
        log('JS responding with', data)
        responseCallback(data)
    })

    bridge.registerHandler('testJavascriptHandler', function(data, responseCallback) {
        log('ObjC called testJavascriptHandler with', data)
        var responseData = { 'Javascript Says':'Right back atcha!' }
        log('JS responding with', responseData)
        responseCallback(responseData)
    })

    var button = document.getElementById('buttons').appendChild(document.createElement('button'))
    button.innerHTML = 'Send message to ObjC'
    button.onclick = function(e) {
        e.preventDefault()
        var data = 'Hello from JS button'
        log('JS sending message', data)
        bridge.send(data, function(responseData) {
            log('JS got response', responseData)
        })
    }

    document.body.appendChild(document.createElement('br'))

    var callbackButton = document.getElementById('buttons').appendChild(document.createElement('button'))
    callbackButton.innerHTML = 'Fire testObjcCallback'
    callbackButton.onclick = function(e) {
        e.preventDefault()
        log('JS calling handler "testObjcCallback"')
        bridge.callHandler('testObjcCallback', {'foo': 'bar'}, function(response) {
            log('JS got response', response)
        })
    }
});