const cv = require('opencv4nodejs');
const fs = require('fs');
const path = require('path');
const client = require('https');
const axios = require('axios')
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const port = 3001;

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
  console.log(req.params.img);

  if (req.params.img) {
    downloadImage(req.params.img, uuidv4(), res);
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});



function analyze_image(filepath, res) {

  console.log("Analyzing image")
  console.log(filepath)

  const img = cv.imread(filepath);
  const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
  const { objects, numDetections } = classifier.detectMultiScale(img.bgrToGray());

var faceCount = 0;
for (const object of objects) {
console.log(object)
  faceCount++;
    //image.drawRectangle(object, new cv.Vec(0, 255, 0), 2, cv.LINE_8);
}

  fs.unlink(filepath, (err) => {
    if (err) {
      console.error(err)
      return
    }

output(res, faceCount);

  });

}

function output(res, count) {

  var tmp = 0;
  tmp = count;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/json');

  var output = {}
  output.faces = tmp;
  res.end(JSON.stringify(output));

}


async function downloadImage(url, filepath, res) {
axios.get(encodeURI(url), {responseType: "stream"} )  
.then(response => {

filepath = "tmp/" + filepath;
response.data.pipe(fs.createWriteStream(filepath))
 .on('error', () => {
    // log error and process 
  })
  .on('finish', () => {
    analyze_image(filepath, res)
  });

});

}
