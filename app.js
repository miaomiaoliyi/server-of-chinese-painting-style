//提供了一套完善的函数式编程的接口，让我们更方便地在JavaScript中实现函数式编程
var _ = require('underscore');
//一个流程控制工具包,提供了直接而强大的异步功能
var async = require('async');
//用于处理 JSON, Raw, Text 和 URL 编码的数据
var bodyParser = require('body-parser');
//用来管理配置文件
var config = require('config');
//Express 是一个简洁而灵活的 node.js Web应用框架, 提供了一系列强大特性帮助你创建各种 Web 应用，和丰富的 HTTP 工具
var express = require('express');
//WebSocket endpoints for Express applications
var expressWs = require('express-ws');
//在控制台中，显示req请求的信息
var morgan = require('morgan');

var neuralStyleRenderer = require('./neural-style-renderer');
var neuralStyleUtil = require('./neural-style-util');
//一个做登录验证的中间件
var passport = require('passport');
var passportHttp = require('passport-http');

var app = express();
expressWs(app);
app.use(morgan('short'));

//登录验证
if (config.has('username') && config.has('password')) {
  passport.use(new passportHttp.BasicStrategy(
    function(username, password, callback) {
      if (username != config.get('username') || password != config.get('password')) {
        callback(null, false);
      }
      callback(null, {});
    }));
  app.use(passport.authenticate('basic', {session: false}));
}

app.use(express.static('public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/data', express.static(config.get('dataPath')));

var rawBodyParser = bodyParser.raw({limit: '10mb'});
app.post('/upload/:id/:purpose', rawBodyParser, function(req, res) {
  console.log('upload...')
  if (!neuralStyleUtil.validateId(req.params.id)) {
    res.status(400).send('invalid id');
    return;
  }
  neuralStyleUtil.saveImage(req.params.id, req.params.purpose, req.body, function(err) {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.end();
  });
});

var jsonBodyParser = bodyParser.json();
app.post('/render/:id', jsonBodyParser, function(req, res) {
  console.log('render...')
  if (!neuralStyleUtil.validateId(req.params.id)) {
    res.status(400).send('invalid id');
    return;
  }
  var settings = req.body;
  neuralStyleRenderer.enqueueJob(req.params.id, settings);
  res.end();
});

//取消任务
app.post('/cancel/:id', function(req, res) {
  console.log('cancel...')
  if (!neuralStyleUtil.validateId(req.params.id)) {
    res.status(400).send('invalid id');
    return;
  }
  neuralStyleRenderer.cancelJob(req.params.id);
  res.end();
});


var updateSockets = [];
app.ws('/updates', function(ws, req) {
  console.log('updates...')
  updateSockets.push(ws);
  ws.on('close', function() {
    var index = updateSockets.indexOf(ws);
    updateSockets.splice(index, 1);
  });
  neuralStyleRenderer.getStatus(function(status) {
    if (_.findIndex(updateSockets, ws) == -1) {
      return;
    }
    ws.send(JSON.stringify({'type': 'status', 'data': status}));
  });
  process.nextTick(function() {
    if (_.findIndex(updateSockets, ws) == -1) {
      return;
    }
    var taskStatuses = neuralStyleRenderer.getTaskStatuses();
    for (var i = taskStatuses.length - 1; i >= 0; i--) {
      ws.send(JSON.stringify({'type': 'render', 'data': taskStatuses[i]}));
    }
  });
});

function broadcastUpdate(type, data) {
  _.each(updateSockets, function(ws) {
    ws.send(JSON.stringify({'type': type, 'data': data}));
  });
}

neuralStyleRenderer.eventEmitter.on('render', function(taskStatus) {
  broadcastUpdate('render', taskStatus);
});

neuralStyleRenderer.eventEmitter.on('status', function(status) {
  broadcastUpdate('status', status);
});

var server = app.listen(config.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
