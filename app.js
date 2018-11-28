var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var arr = require('./config/ignoreRouter');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var phoneRouter = require('./routes/phone');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//自己实现的中间件用来判断是否登录
app.use(function (req, res, next) {
  //排除登录注册
  console.log(req.url);
  // console.log(arr.indexOf(req.url));
  if (arr.indexOf(req.url) > -1) {
    next();
    return;
  }
  var nickname = req.cookies.nickname;
  if (nickname) {
    next();
  } else {
    console.log(1);
    res.redirect('/login.html');
  }
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/phone', phoneRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
