const fs = require('fs');
const path = require('path');
const axios = require('axios')
const client = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const sharp = require("sharp");

const hostname = '127.0.0.1';
const port = 4000;

// get querystring parameters
var params=function(req){
  let q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

var url_params;
const server = http.createServer((req, res) => {
  req.params=params(req);
  url_params = req.params;
  //console.log(req.params.img);

  if (req.params.img) {
    downloadImage(req.params.img, uuidv4(), res);
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

async function downloadImage(url, filepath, res) {
axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

  filepath = "./tmp/" + filepath;
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
    // log error and process 
    })
    .on('finish', () => {
      getMetaData(filepath, res)
    });
  });
}

function getFileSize(file) {
  var ret = 0;
  try {
    const stats = fs.statSync(file);
    ret = stats.size / 1000; // size in kilobytes

    ret = Math.round(ret)
  } catch (err) {
    console.log(err);
  }

  return ret
}

async function getMetaData(file, res) {
  try {

    //var img = "../images/" + file.flower;

    const metadata = await sharp(file).metadata();
    // file.meta = metadata;

    var meta = {}
     meta.filesize = getFileSize(file);

     if (metadata.format) {
      meta.format = metadata.format;
    }
    meta.dpi = metadata.density;
    meta.width = metadata.width;
    meta.height = metadata.height;

    var mp = (meta.width * meta.height) / 1000000;
    meta.megapixels = Math.round(mp * 100) / 100;

    var qual = "low";
    if (meta.megapixels >= 1) { qual = "medium"; }
    if (meta.megapixels >= 2) { qual = "high"; }

    meta.quality = qual;
    meta.alpha = metadata.hasAlpha;
    meta.channels = metadata.channels;
    meta.space = metadata.space;
    meta.progressive = metadata.isProgressive;

    /*
    var colorSet = [...new Set(metaColors)];
    meta.colors = colorSet;
    // clear colors 
    metaColors = [];
    */
    //file.meta = meta;

    if (meta.width > meta.height) {
      meta.display_mode = "landscape";
    }

    if (meta.width < meta.height) {
      meta.display_mode = "portrait";
    }

    if (Math.abs(meta.width - meta.height) <= 100) {
      meta.display_mode = "square";
    }

    console.log(meta);

  } catch (error) {
    console.log(`An error occurred during processing: ${error}`);
  }

  // delete file
  fs.unlink(file, (err) => {
    if (err) {
      console.error(err)
      return
    }
  });

  var output = {}
  output.meta = meta

  // try to attach meta data, if not, just send what you got
  sendData(output, res);
}


function sendData(file, res) {
  res.writeHead(200);

  floutput = JSON.stringify(file)
  res.end(floutput);

}
