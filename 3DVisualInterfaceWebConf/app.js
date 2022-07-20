'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

server.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

var numClients = new Array();

io.on("connection", function (socket) {
    console.log("io connected");
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function (room, to, message) {
        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        if (to != null) {
            socket.to(to).emit('message', message, socket.id);
        } else { 
            socket.to(room).emit('message', message, socket.id);
        }
    });

    socket.on('create or join', function (room) {
        log('Received request to create or join room ' + room);

        if (numClients[room] == undefined) { // create
            var roomArray = new Array();
            numClients[room] = roomArray;
            numClients[room].push(socket.id);
            socket.join(room);
            log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);
        } else { // join
            log('Client ID ' + socket.id + ' joined room ' + room);
            socket.join(room);
            numClients[room].forEach(elm => socket.emit('joined', room, elm, numClients[room]));
            numClients[room].push(socket.id);
            socket.broadcast.to(room).emit('ready', room, socket.id);  // notify my socket.id except me
        }
        
    });

    //socket.on('ipaddr', function () {
    //    var ifaces = os.networkInterfaces();
    //    for (var dev in ifaces) {
    //        ifaces[dev].forEach(function (details) {
    //            if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
    //                socket.emit('ipaddr', details.address);
    //            }
    //        });
    //    }
    //});

    socket.on('disconnect', function (reason) {
        console.log(`Peer or server disconnected. Reason: ${reason}.`);
        socket.broadcast.emit('bye');
    });

    socket.on('bye', function (room) {
        console.log(`Peer said bye on room ${room}.`);
    });

});


