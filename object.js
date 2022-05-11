const cv = require('opencv4nodejs');
const fs = require('fs');
const path = require('path');
const client = require('https');
const axios = require('axios')
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const port = 3000;

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

const server = http.createServer((req, res) => {
  req.params=params(req);

  console.log(req.params.img);

  if (req.params.img) {
    downloadImage(req.params.img, uuidv4(), res);
  }

  //res.statusCode = 200;
  //res.setHeader('Content-Type', 'text/plain');
  //res.end(req.params.img);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

var img = 'https://alanunderwood.com/flowers/images/ixora-blue-3.jpg';
img= "https://i.imgur.com/LDBIll.jpg"
img = "https://i.imgur.com/Wr5NBl.jpg"
img = "https://i.imgur.com/Ilq4ll.jpg" //fb guy
img ="https://i.imgur.com/YTVCBl.jpg"
img = "https://i.imgur.com/YkE54l.jpg" // eyebleach
img = "https://i.imgur.com/RW71Ll.jpg" // mclaren
img = "https://i.imgur.com/uDnZRl.jpg" // vagina
img = "https://i.imgur.com/nL3TQl.jpg" // sign
img = "https://i.imgur.com/W3PTGl.jpg" // shirt
img = "https://i.imgur.com/6gBgql.jpg" // bird

function analyze_image(filepath, res) {

console.log("Analyzing image")
console.log(filepath)

  const img = cv.imread(filepath);
//  console.log('%s: ', data.label);
  const predictions = classifyImg(img);
  predictions.forEach(p => console.log(p));
  console.log();

  var predStr = ""
  for (var i =0; i < predictions.length; i++) {
    predStr += " " + predictions[i];
  }

  fs.unlink(filepath, (err) => {
    if (err) {
      console.error(err)
      return
    }
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(predStr);

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





//console.log(cv)

if (!cv.modules.dnn) {
  throw new Error('exiting: opencv4nodejs compiled without dnn module');
}

// replace with path where you unzipped inception model
const inceptionModelPath = './';

const modelFile = path.resolve(inceptionModelPath, 'tensorflow_inception_graph.pb');
const classNamesFile = path.resolve(inceptionModelPath, 'imagenet_comp_graph_label_strings.txt');
if (!fs.existsSync(modelFile) || !fs.existsSync(classNamesFile)) {
  console.log('could not find inception model');
  console.log('download the model from: https://storage.googleapis.com/download.tensorflow.org/models/inception5h.zip');
  throw new Error('exiting');
}

// read classNames and store them in an array
const classNames = fs.readFileSync(classNamesFile).toString().split('\n');

// initialize tensorflow inception model from modelFile
const net = cv.readNetFromTensorflow(modelFile);

const classifyImg = (img) => {
  // inception model works with 224 x 224 images, so we resize
  // our input images and pad the image with white pixels to
  // make the images have the same width and height
  const maxImgDim = 224;
  const white = new cv.Vec(255, 255, 255);
  const imgResized = img.resizeToMax(maxImgDim).padToSquare(white);

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(imgResized);
  net.setInput(inputBlob);

  // forward pass input through entire network, will return
  // classification result as 1xN Mat with confidences of each class
  const outputBlob = net.forward();

  // find all labels with a minimum confidence
  const minConfidence = 0.05;
  const locations =
    outputBlob
      .threshold(minConfidence, 1, cv.THRESH_BINARY)
      .convertTo(cv.CV_8U)
      .findNonZero();

  const result =
    locations.map(pt => ({
      confidence: parseInt(outputBlob.at(0, pt.x) * 100) / 100,
      className: classNames[pt.x]
    }))
      // sort result by confidence
      .sort((r0, r1) => r1.confidence - r0.confidence)
      .map(res => `${res.className} (${res.confidence})`);

  return result;
};

const testData = [
  {
    image: './flowers/yellow-sunflower.jpg',
    label: 'sunflower'
  },
  {
    image: './images/husky.jpg',
    label: 'husky'
  },
  {
    image: './images/banana.jpg',
    label: 'banana'
  },
  {
    image: './images/car.jpeg',
    label: 'car'
  },
  {
    image: './images/Lenna.png',
    label: 'lenna'
  }
];
/*
testData.forEach((data) => {
  const img = cv.imread(data.image);
  console.log('%s: ', data.label);
  const predictions = classifyImg(img);
  predictions.forEach(p => console.log(p));
  console.log();

  const alpha = 0.4;
  cv.drawTextBox(
    img,
    { x: 0, y: 0 },
    predictions.map(p => ({ text: p, fontSize: 0.5, thickness: 1 })),
    alpha
  );
//  cv.imshowWait('img', img);
});
*/


