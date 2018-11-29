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

//渲染品牌
router.get('/', function (req, res, next) {
  var page = parseInt(req.query.page) || 1;//页码
  var pageSize = parseInt(req.query.pageSize) || 3;//每页显示条数
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
        db.collection('brand').find().count(function (err, num) {
          if (err) {
            cb(err)
          } else {
            totalSize = num;
            cb(null)
          }
        })
      }, function (cb) {
        db.collection('brand').find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function (err, data) {
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
        // console.log(result[1]);
        res.render('brand', {
          list: result[1],
          page: page,
          totalPage: totalPage,
          pageSize: pageSize
        })
      }
      client.close();
    })
    // client.close();
  })
  // res.render('brand');
})

//添加品牌
router.post('/addBrand', upload.single('file'), function (req, res) {
  // console.log(req.body);
  console.log(req.file);
  var brand = req.body.brand;
  var fileName = 'brandImg/' + new Date().getTime() + '_' + req.file.originalname;
  var newFileName = path.resolve(__dirname, '../public', fileName);
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
      db.collection('brand').insertOne({
        brand: brand,
        fileName: fileName
      }, function (err) {
        if (err) {
          console.log('添加失败');
          res.render('error', {
            message: '添加失败',
            error: err
          })
        } else {
          // res.send('添加成功');
          res.redirect('/brand');
        }
      })
    })
  } catch (error) {
    res.render('error', {
      message: '添加失败',
      error: err
    })
  }
})

//删除品牌
router.get('/delete', function (req, res) {
  // console.log(req.query.id);
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
    db.collection('brand').deleteOne({
      _id: id
    }, function (err) {
      if (err) {
        console.log('删除失败');
        res.render('error', {
          message: '删除失败',
          error: err
        })
      } else {
        res.redirect('/brand');
      }
    })
    client.close();
  })
})





module.exports = router;