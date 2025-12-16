//app.js
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser'); 
var expressStaticGzip = require('express-static-gzip');
require('./model/db');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
//app.set('env', 'production'); // 환경 설정 (개발용으로 변경 가능)
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
// Update Morgan to include IP addresses and use 'combined' format for better logging
app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));    // 정적 파일 경로 설정

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found!');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    
    // JSON 요청인 경우 (AJAX)
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({
        success: false,
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {}
      });
    } else {
      // HTML 렌더링
      res.render('error', {
        title: 'Error',
        message: err.message,
        error: err,
        pageHeader: {
          title: 'Error Occurred'
        },
        pageFooter: {
          explain: 'copyright'
        }
      });
    }
  });
  


module.exports = app;
