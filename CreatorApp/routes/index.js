var express = require('express');
var router = express.Router();
var app = express();
var myapp;
var fs= require('fs');
var formidable = require('formidable');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});


router.post("/bgimage.html", function (request, response) {  
  console.log("upload... "+app.get("apppath"));
  if(!fs.existsSync(process.env.APPDIR+"/public/"+app.get("apppath"))) { 
    console.log("mkdir "+process.env.APPDIR+"/public/"+app.get("apppath"));
  
   fs.mkdir(process.env.APPDIR+"/public/"+app.get("apppath"));
  }
  console.log("mkdir done.");
   var form = new formidable.IncomingForm();
  form.uploadDir = process.env.APPDIR+"/public/"+app.get("apppath");
  let fname= '';

  form.on('file', function(name, file){
    fname= file.path;
    console.log("File: "+file.path);
});
   form.parse(request, function(err, fields, files){
     if(err) {
       console.log(err);
     }
     else {
       fs.rename(fname, fname.substring(0, fname.lastIndexOf('/')) + '/bgimg.jpg');
     }
   response.end('upload complete!');
});
});     

router.get('/', function(req, res, next) {
  res.render('index', { title: 'DC/OS AppStudio' });
});

router.get('/app.html', function(req, res, next) {
  let groupconfig;
  
  if(app.get("byod")=== "yes")
    groupconfig= require('../groupconfigwithdata-v'+app.get("version")+'.json');   
  else
    groupconfig= require('../groupconfig-v'+app.get("version")+'.json');
 
  res.setHeader('Content-disposition', 'attachment; filename='+app.get("apppath")+"-config.json");
  let config= JSON.stringify(groupconfig).replace(/REPLACEME/g, myapp);
  config= config.replace(/\$PATH/g, "-"+app.get("apppath"));
  res.write(config);
  res.end();
});

router.get('/version.html', function(req, res, next) {
  res.render('version', { title: 'DC/OS AppStudio' });
});


router.get('/apppath.html', function(req, res, next) {
  console.log("Version: "+req.query.version);
  app.set("version", req.query.version);
  res.render('apppath', { title: 'DC/OS AppStudio' });
});

router.get('/bgimage.html', function(req, res, next) {
  app.set("apppath", req.query.apppath);
  app.set("creator", req.query.creator);
  console.log("APPPATH= "+app.get("apppath"));
 currentapppath= req.query.apppath;
  res.render('bgimage', { title: 'DC/OS AppStudio' });
});

router.get('/cassandrakafka.html', function(req, res, next) {
  res.render('cassandrakafka', { title: 'DC/OS AppStudio' });
});

router.get('/fields.html', function(req, res, next) {
  console.log("AppPath: "+  app.get("apppath"));
  app.set("topic", req.query.topic);
  app.set("table", req.query.table);
  app.set("keyspace", req.query.keyspace);
  console.log(app.get("topic"));
  console.log(app.get("table"));
  console.log(app.get("keyspace"));
 
  res.render('fields', { title: 'DC/OS AppStudio' });
});

router.get('/takeoff.html', function(req, res, next) {  
  let appdef= new Object();
  let fields= app.get("fields").fields;
  console.log("appdef: "+fields);
  appdef= JSON.parse(fields);
 // appdef.showLocation= fields.showLocation;
 // delete fields.showLocation;
 console.log("transformer: "+decodeURIComponent(req.query.transformer));

  appdef.transformer= encodeURIComponent(req.query.transformer);
  console.log("transformer: "+ appdef.transformer);
  appdef.version= app.get("version");
  appdef.topic= app.get("topic");
  appdef.table= app.get("table");
  appdef.keyspace= app.get("keyspace");
  appdef.path= app.get("apppath");
  appdef.creator= app.get("creator");
  appdef.byod= app.get("byod");
  if(appdef.byod==="yes") {
    appdef.dockertag= app.get("dockertag");
    appdef.fname= app.get("fname");    
    appdef.frequency= app.get("frequency");    
  }
 // appdef.name= fields.name;
 // delete fields.name;
  console.log("Take off: "+ JSON.stringify(appdef));
  myapp= JSON.stringify(appdef).replace(/\"/g, '\'');
  console.log("myapp: "+myapp);
  let thisapppath= appdef.path;
  console.log("Path: "+thisapppath);
  router.all("/"+thisapppath+"*", function (request, response) {  
    console.log("get: "+request.url);
    request.url= request.url.substring(thisapppath.length+1);
    console.log("get now: "+request.url);
    if(request.url.includes("/api") || request.url.includes("/bundle") || request.url.includes("/status"))
      request.url="/service/elastic/kibana"+request.url;
      console.log("Final url: "+request.url);
    try {
    console.log("target: "+'http://dcosappstudio'+"-"+app.get("apppath")+'ui.marathon.l4lb.thisdcos.directory:0');
    proxy.web(request, response, { target: 'http://dcosappstudio'+"-"+app.get("apppath")+'ui.marathon.l4lb.thisdcos.directory:0' }, 
      function(e) { 
        response.writeHead(500);
        response.end("Ooops, something went very wrong. You're sure you already deployed the app?"); 
      }
    );
  }
  catch(ex) {
    console.log(ex);
  }
  });

  router.all("/service/elastic*", function (request, response) {  
    console.log("all: "+request.url);
   // request.url= request.url.substring(thisapppath.length+1);
   // console.log("get now: "+request.url);
    try {
    console.log("target: "+'http://dcosappstudio'+"-"+app.get("apppath")+'ui.marathon.l4lb.thisdcos.directory:0');
    proxy.web(request, response, { target: 'http://dcosappstudio'+"-"+app.get("apppath")+'ui.marathon.l4lb.thisdcos.directory:0' }, 
      function(e) { 
        response.writeHead(500);
        response.end("Ooops, something went very wrong. You're sure you already deployed the app?"); 
      }
    );
  }
  catch(ex) {
    console.log(ex);
  }
  });


  res.render('takeoff', { app: myapp, apppath: appdef.path });
});

router.get('/loader.html', function(req, res, next) {
  app.set("fields", req.query);
  res.render('loader', {  });
});

router.get('/transformer.html', function(req, res, next) {
  app.set("byod", req.query.byod);
  if(req.query.byod=== "yes") {
    app.set("dockertag", decodeURIComponent(req.query.tag));
    app.set("fname", decodeURIComponent(req.query.fname));
    app.set("frequency", req.query.frequency);
  }
  res.render('transformer', {  });
});

router.get('/cassandrakafkaup.html', function(req, res, next) {
  res.render('cassandrakafkaup', { title: 'DC/OS AppStudio' });
});

module.exports = router;
