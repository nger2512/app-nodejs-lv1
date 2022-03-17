var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('express-flash-notification');
const validator = require('express-validator');
const session = require('express-session');
const mongoose = require('mongoose');
const pathConfig = require('./path');
const moment =require('moment');

global.__base = __dirname + '/'; // define path
global.__path_app = __base + pathConfig.folder_app+'/'; // define path
global.__path_configs = __path_app+ pathConfig.folder_configs+'/';
////
global.__path_schemas = __path_app +pathConfig.folder_schemas+ '/';
global.__path_views = __path_app +pathConfig.folder_views+'/';
global.__path_routes = __path_app +pathConfig.folder_routes+ '/';
global.__path_validates = __path_app +pathConfig.folder_validates+ '/';
global.__path_helpers = __path_app +pathConfig.folder_helpers+ '/';
global.__path_models = __path_app +pathConfig.folder_models+'/';
global.__path_public = __base +pathConfig.folder_public+'/';
global.__path_upload = __path_public +pathConfig.folder_upload+'/';
// console.log(__path_configs);

const databaseConfig = require(__path_configs+'database');


var expressLayouts = require('express-ejs-layouts');


if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
// mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
// //connect to MongoDB

// const db = mongoose.connection;
// db.on('error', error => console.error(error));
// db.once('open', () => console.log('Connected Successfully'));
// mongoose.Promise=global.Promise;
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(`mongodb+srv://${databaseConfig.username}:${databaseConfig.password}@cluster0.yihfz.mongodb.net/${databaseConfig.database}?retryWrites=true&w=majority`,
    { useNewUrlParser: true });
  console.log('connected')
}
// const itemModel = require('./schemas/items');
// itemModel.find({name:{'$regex': 'node', '$options': 'i'}}).exec((err,item)=>{
//   if(err) console.error(err)
//   console.log({item:item});
// })

// mongoose.connect('mongodb+srv://sonvo0302:251298@cluster0.yihfz.mongodb.net/trainning-nodejs?retryWrites=true&w=majority');
// var db = mongoose.connection;
// db.on('error',()=>console.log('connected error'))
// db.once('open',function(){
//   console.log('connected')
// })
const systemConfig = require(__path_configs+'system');
const { futimes } = require('fs');

var app = express();



app.use(validator({

  customValidators:{
    isNotEqual:(value1,value2)=>{
      return value1 !== value2;
    },
  }
}));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'abcdef',
  resave: false,
  saveUninitialized: true, 
}))
app.use(flash(app, {
  viewName: __path_views+'elements/notify',
}));
// var sess = {
//   secret: 'keyboard cat',
//   cookie: {}
// }

// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }

//app.use(session(sess));
app.use(flash(app));
app.locals.moment =moment;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressLayouts);
app.set('layout', __path_views+'backend');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//Local variable
app.locals.systemConfig = systemConfig;
app.use(`/${systemConfig.prefixAdmin}`, require(__path_routes+'backend/index'));
app.use('/',require(__path_routes+'frontend/index'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render(__path_views+'pages/error',{pageTitle:' Page Not Found '});
});

module.exports = app;
