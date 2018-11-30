var express = require('express');
var multer = require('multer');
var upload = multer({ dest: 'C:/tap' });
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017';
var async = require('async');
var fs = require('fs');
var path = require('path');
var objectId = require('mongodb').ObjectId;

//渲染手机
router.get('/', function (req, res, next) {
  var page = parseInt(req.query.page) || 1;//页码
  var pageSize = parseInt(req.query.pageSize) || 2;//每页显示条数
  var totalSize = 0;//总条数
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
    async.series([
      function (cb) {
        db.collection('phone').find().count(function (err, num) {
          if (err) {
            cb(err)
          } else {
            totalSize = num;
            cb(null)
          }
        })
      }, function (cb) {
        db.collection('phone').find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function (err, data) {
          if (err) {
            cb(err)
          } else {
            cb(null, data)
          }
        })
      }
    ], function (err, result) {
      if (err) {
        console.log('出错了');
        res.render('error', {
          message: '出错了',
          error: err
        })
      } else {
        var totalPage = Math.ceil(totalSize / pageSize);
        res.render('phone', {
          list: result[1],
          totalPage: totalPage,
          page: page,
          pageSize: pageSize
        })
        client.close();
      }
    })
  })
  // MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
  //     if (err) {
  //         console.log('错误');
  //         res.render('error', {
  //             message: '错误',
  //             error: err
  //         })
  //         return;
  //     }
  //     var db = client.db('project');
  //     db.collection('phone').find().toArray(function (err, data) {
  //         if (err) {
  //             console.log('查询失败');
  //             res.render('error', {
  //                 message: '查询失败',
  //                 error: err
  //             })
  //         } else {
  //             console.log(data);
  //             res.render('phone', {
  //                 list: data
  //             })
  //         }
  //     })
  //     client.close();
  // })
})

//新增手机
router.post('/addPhone', upload.single('file'), function (req, res) {
  // console.log(req.file);
  var phoneType = req.body.phoneType;
  var brand = req.body.brand;
  var price = req.body.price;
  var twoPrice = req.body.twoPrice;
  // console.log(req.body);
  var fileName = 'phoneImg/' + new Date().getTime() + "_" + req.file.originalname;
  console.log(fileName);
  var newFileName = path.resolve(__dirname, '../public/', fileName);
  // console.log(newFileName);
  try {
    var data = fs.readFileSync(req.file.path);
    fs.writeFileSync(newFileName, data);
    // res.send('添加成功')
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
      if (err) {
        console.log('连接失败');
        res.render('error', {
          message: '连接失败',
          error: err
        })
        return;
      }
      var db = client.db('project');
      db.collection('phone').insertOne({
        phoneType: phoneType,
        brand: brand,
        price: price,
        twoPrice: twoPrice,
        fileName: fileName
      }, function (err) {
        if (err) {
          console.log('添加失败');
          res.render('error', {
            message: '添加失败',
            error: err
          })
        } else {
          res.redirect('/phone');
        }
      })
      client.close();
    })
  } catch (error) {
    res.render('error', {
      message: '添加失败',
      error: error
    })
  }
})

//删除手机
router.get('/delete', function (req, res) {
  // console.log(req.query.id);
  id = objectId(req.query.id);
  console.log(id);
  console.log(typeof id)
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
    // db.collection('phone').find({ _id: id }).count(function (err, num) {
    //   console.log(num);
    //   res.send('进来了');
    // })
    db.collection('phone').deleteOne({
      _id: id
    }, function (err) {
      if (err) {
        console.log('删除失败');
        res.render('error', {
          message: '删除失败',
          error: err
        })
      } else {
        res.redirect('/phone');
      }
    })
    client.close();
  })
})

//修改手机
router.post('/alter', function (req, res) {
  // console.log(req.body);
  var phoneType = req.body.phoneType;
  var brand = req.body.brand;
  var price = req.body.price;
  var twoPrice = req.body.twoPrice;
  var id = objectId(req.body.id);
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
      console.log('链接失败');
      res.render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var condition = { _id: id };

    var matter = {
      $set: {
        phoneType: phoneType,
        brand: brand,
        price: price,
        twoPrice: twoPrice
      }
    }
    var db = client.db('project');
    // db.collection('phone').find({ _id: id }).count(function (err, num) {
    //   console.log(num);
    //   console.log(phoneType, brand, price, twoPrice)
    //   res.send('进来了');
    // })
    db.collection('phone').update({ _id: id }, {
      $set: {
        phoneType: phoneType,
        brand: brand,
        price: price,
        twoPrice: twoPrice
      }
    }, function (err) {
      if (err) {
        console.log('修改失败');
        res.render('error', {
          message: '修改失败',
          error: err
        })
      } else {
        // res.send('修改成功');
        res.redirect('/phone')
      }
    })
    client.close();
  })
})
module.exports = router;