const fs = require('fs');
const path = require('path');
const axios = require('axios')
const client = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const tesseract = require("node-tesseract-ocr")

const hostname = '127.0.0.1';
const port = 6000;

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
    readOCR(req.params.img, res);
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
}

function readOCR(img, res) {
  tesseract
    .recognize(img, config)
    .then((text) => {
      console.log("OCR output: ", text)
      sendData(text, res)
    })
    .catch((error) => {
      console.log(error.message)
    })
}

function sendData(file, res) {
  res.writeHead(200);

  var txt = file
  var output = {}

  if (txt) {
    var ret = "false"
    txt = txt.replace(/(\r\n|\n|\r)/gm, "").replace("\t","").replace("\f","")

    // strip punctuation
    txt = txt.replace(/[.,\/#\'\"!@‘¥$¢€©®°?«»%`’“”—\^&\<\>|\*;:{}=\-_`~\[\]()]/g,"").toLowerCase()

    if (txt.replace(" ","").length > 1) { ret = "true" }

    output.ocr = ret
    output.text = txt
  }

  floutput = JSON.stringify(output)
  res.end(floutput)

}
