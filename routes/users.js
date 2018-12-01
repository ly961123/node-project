var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017';
var async = require('async');
var objectId = require('mongodb').ObjectId;
/* GET users listing. */
router.get('/', function (req, res, next) {
  console.log(req.url);
  var page = parseInt(req.query.page) || 1;//页码
  var pageSize = parseInt(req.query.pageSize) || 4;//每页显示条数
  var totalSize = 0;//总条数
  // console.log(page, pageSize);
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('错误');
      res.render('error', {
        message: '错误',
        error: err
      })
    }
    var db = client.db('project');
    async.series([
      function (cb) {
        //总条数
        db.collection('user').find().count(function (err, num) {
          if (err) {
            cb(err);
          } else {
            totalSize = num;
            cb(null);
          }
        })
      }, function (cb) {
        db.collection('user').find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function (err, data) {
          if (err) {
            cb(err);
          } else {
            cb(null, data);
          }
        })
      }
    ], function (err, result) {
      if (err) {
        res.render('error', {
          message: '错误',
          error: errr
        })
      } else {
        var totalPage = Math.ceil(totalSize / pageSize);//总页数
        // console.log(result[1]);
        res.render('users', {
          list: result[1],
          totalSize: totalSize,
          page: page,
          pageSize: pageSize,
          totalPage: totalPage
        })
      }
      client.close();
    })
  })

  // MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
  //   if (err) {
  //     //连接数据库失败
  //     console.log('连接数据库失败');
  //     res.render('error', {
  //       message: '连接数据库失败',
  //       error: err
  //     });
  //     return;
  //   }
  //   var db = client.db('project');
  //   db.collection('user').find().toArray(function (err, data) {
  //     if (err) {
  //       //查询用户集合失败
  //       console.log('查询失败');
  //       res.render('error', {
  //         message: '查询失败',
  //         error: err
  //       })
  //     } else {
  //       console.log(data);
  //       res.render('users', {
  //         list: data
  //       })
  //     }
  //   })
  //   client.close();
  // })
})
//登录操作 localhost:3000/users/login
router.post('/login', function (req, res) {
  // console.log(req.body);
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
          maxAge: 30 * 60 * 1000
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
    if (username != '' && password != '' && nickname != '' && phone != '' && age != '' && sex != '' && isCharge != '') {
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
    } else {
      console.log('各项都不能为空，请认真填写')
      res.render('error', {
        message: '各项都不能为空，请认真填写',
        error: new Error('各项都不能为空，请认真填写')
      })
    }
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
//删除操作
router.get('/delete', function (req, res) {
  var id = objectId(req.query.id);
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('错误');
      res.render('error', {
        message: '错误',
        error: err
      })
      return;
    }
    var db = client.db('project');
    db.collection('user').deleteOne({
      _id: id
    }, function (err) {
      if (err) {
        res, render('error', {
          message: '删除失败',
          error: err
        })
      } else {
        //删除成功，刷新页面
        res.redirect('/users');
      }
    })
    client.close();
  })
})
//退出操作
router.get('/quit', function (req, res) {
  res.cookie('nickname', '');
  res.redirect('/login');
})
//搜索操作
router.post('/search', function (req, res) {
  var page = parseInt(req.query.page) || 1;//页码
  var pageSize = parseInt(req.query.pageSize) || 4;//每页显示条数
  var totalSize = 0;//总条数
  // console.log(req.body);
  var username = req.body.username;
  var results = new RegExp(username);
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('出错');
      res.render('error', {
        message: '出错',
        error: err
      })
    }
    var db = client.db('project');
    db.collection('user').find({ username: results }).count(function (err, num) {
      if (err) {
        console.log('连接错误');
        res.render('error', {
          message: '连接错误',
          error: err
        })
      }
      else {
        totalSize = num;
      }
    });
    db.collection('user').find({ username: results }).toArray(function (err, data) {
      if (err) {
        console.log('搜索失败');
        res.render('error', {
          message: '搜索失败',
          error: err
        })
      } else {
        console.log(data);
        // res.send('查找成功');
        // res.redirect('/users');
        var totalPage = Math.ceil(totalSize / pageSize);
        res.render('users', {
          list: data,
          page: page,
          pageSize: pageSize,
          totalPage: totalPage
        })
      }
    })
    // async.series([
    //   function (cb) {
    //     db.collection('user').find({ username: results }).count(function (err, num) {
    //       if (err) {
    //         // console.log(22222);
    //         cb(err);
    //       } else {
    //         totalSize = num;
    //         console.log(totalSize);
    //         cb(null);
    //       }
    //     })
    //   },
    //   function (cb) {
    //     db.collection('user').find({ username: results }).toArray(function (err, data) {
    //       if (err) {
    //         console.log(22222);
    //         cb(err);
    //       } else {
    //         cb(null);
    //       }
    //     })
    //   }
    // ], function (err, result) {
    //   if (err) {
    //     // console.log(totalSize);
    //     console.log('搜索失败');
    //     res.render('error', {
    //       message: '搜索失败',
    //       error: err
    //     })
    //   } else {
    //     console.log(result[1]);
    //     // res.redirect('/users');
    //     var totalPage = Math.ceil(totalSize / pageSize);
    //     res.render('users', {
    //       list: result[1],
    //       page: page,
    //       pageSize: pageSize,
    //       totalPage: totalPage
    //     })
    //   }
    // })
    client.close();
  })
})
module.exports = router;
