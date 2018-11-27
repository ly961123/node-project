var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017';
var async = require('async');
/* GET users listing. */
router.get('/', function (req, res, next) {
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      //连接数据库失败
      console.log('连接数据库失败');
      res.render('error', {
        message: '连接数据库失败',
        error: err
      });
      return;
    }
    var db = client.db('project');
    db.collection('user').find().toArray(function (err, data) {
      if (err) {
        //查询用户集合失败
        console.log('查询失败');
        res.render('error', {
          message: '查询失败',
          error: err
        })
      } else {
        console.log(data);
        res.render('users', {
          list: data
        })
      }
    })
    client.close();
  })
})
//登录操作 localhost:3000/users/login
router.post('/login', function (req, res) {
  console.log(req.body);
  var username = req.body.username;
  var password = req.body.pwd;
  // 2.验证的有效性
  if (!username) {
    res.render('error', {
      message: '用户名不存在',
      error: new Error('用户名不能为空')
    })
    return;
  }
  if (!password) {
    res.render('error', {
      message: '密码不能为空',
      error: new Error('密码不能为空')
    })
    return;
  }
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('连接数据库失败', err);
      res.render('error', {
        message: '连接数据库失败',
        error: err
      })
      return;
    }
    var db = client.db('project');
    db.collection('user').find({
      username: username,
      password: password
    }).toArray(function (err, data) {
      if (err) {
        console.log('查询失败', err);
        res.render('error', {
          message: '查询失败',
          error: new Error('登录失败')
        })
      } else if (data.length <= 0) {//没找到，登录失败
        res.render('error', {
          message: '登录失败',
          error: new Error('登录失败')
        })
      } else {//登录成功
        res.cookie('nickname', data[0].nickname, {
          maxAge: 10 * 60 * 1000
        })
        res.redirect('/');
      }
    })
    client.close();
  })

})
//注册操作 
router.post('/register', function (req, res) {
  var username = req.body.username;
  var password = req.body.pwd;
  var nickname = req.body.nickname;
  var phone = req.body.phone;
  var age = req.body.age;
  var sex = req.body.sex;
  var isCharge = req.body.isCharge;
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      res, render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var db = client.db('project');
    async.series([
      function (cb) {
        db.collection('user').find({ username: username }).count(function (err, num) {
          if (err) {
            cb(err);
          } else if (num > 0) {
            cb(new Error('用户名已存在'));
          } else {
            cb(null);
          }
        })
      }, function (cb) {
        db.collection('user').insertOne({
          username: username,
          password: password,
          nickname: nickname,
          phone: phone,
          sex: sex,
          age: age,
          isCharge: isCharge
        }, function (err) {
          if (err) {
            cb(err)
          } else {
            cb(null);
          }
        })
      }
    ], function (err, result) {
      if (err) {
        res.render('error', {
          message: '注册失败',
          error: err
        })
      } else {
        res.redirect('/login.html');
      }
      client.close();
    })
  })
  // MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
  //   if (err) {
  //     res, render('error', {
  //       message: '连接失败',
  //       error: err
  //     })
  //     return;
  //   }
  //   var db = client.db('project');
  //   db.collection('user').insertOne({
  //     username: username,
  //     password: password,
  //     nickname: nickname,
  //     phone: phone,
  //     sex: sex,
  //     age: age,
  //     isCharge: isCharge
  //   }, function (err) {
  //     if (err) {
  //       console.log('注册失败');
  //       res.render('error', {
  //         message: '注册失败',
  //         error: err
  //       })
  //     } else {//注册成功，跳转登录页
  //       res.redirect('/login.html');
  //     }
  //   })
  //   client.close();
  // })
})
module.exports = router;
