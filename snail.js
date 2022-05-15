const fs = require('fs');
const path = require('path');
const axios = require('axios')
const client = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const sharp = require('sharp');
const onecolor = require('onecolor');
const ColorThief = require('color-thief');

const html_colors = require("./colors.json");

const hostname = '127.0.0.1';
const port = 5000;

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

var base_colors = [];
var base_color_names = [];

function getBaseColors() {
  for (var i in html_colors) {
    base_colors.push(html_colors[i]);
  }
}

// https://stackoverflow.com/questions/4057475/rounding-colour-values-to-the-nearest-of-a-small-set-of-colours
function getSimilarColors (color) {
    getBaseColors();

    //base_colors=["660000","990000","cc0000","cc3333","ea4c88","993399","663399","333399","0066cc","0099cc","66cccc","77cc33","669900","336600","666600","999900","cccc33","ffff00","ffcc33","ff9900","ff6600","cc6633","996633","663300","000000","999999","cccccc","ffffff"];
    var color_r = color[0];
    var color_g = color[1];
    var color_b = color[2];

    //Create an emtyp array for the difference betwwen the colors
    var differenceArray=[];

    //Function to find the smallest value in an array
    Array.min = function( array ){
           return Math.min.apply( Math, array );
    };


    //Convert the HEX color in the array to RGB colors, split them up to R-G-B, then find out the difference between the "color" and the colors in the array
    for (var i = 0; i < base_colors.length; i++) {
        var value = base_colors[i]

        var base_color_rgb = hex2rgb(value);
        var base_colors_r = base_color_rgb.split(',')[0];
        var base_colors_g = base_color_rgb.split(',')[1];
        var base_colors_b = base_color_rgb.split(',')[2];

        //Add the difference to the differenceArray
        var val = (Math.sqrt((color_r-base_colors_r)*(color_r-base_colors_r)+(color_g-base_colors_g)*(color_g-base_colors_g)+(color_b-base_colors_b)*(color_b-base_colors_b)));
        differenceArray.push(val);

    }

    //Get the lowest number from the differenceArray
    var lowest = Array.min(differenceArray);

    //Get the index for that lowest number
    var index = differenceArray.indexOf(lowest);

    //Function to convert HEX to RGB
    function hex2rgb( colour ) {
        var r,g,b;
        if ( colour.charAt(0) == '#' ) {
            colour = colour.substr(1);
        }

        r = colour.charAt(0) + colour.charAt(1);
        g = colour.charAt(2) + colour.charAt(3);
        b = colour.charAt(4) + colour.charAt(5);

        r = parseInt( r,16 );
        g = parseInt( g,16 );
        b = parseInt( b ,16);
        return r+','+g+','+b;
    }

    //Return the HEX code
    return base_colors[index];

}

function toGray(vals) {
  var r = vals[0];
  var g = vals[1];
  var b = vals[2];
  return Math.round((Math.min(r, g, b) + Math.max(r, g, b)) / 2);
  // return Math.round((r + g + b) / 3);
  // return Math.round(0.21 * r + 0.72 * g + 0.07 * b);
}

async function getMetaData(file, res) {

  colorThief = new ColorThief()
  var onecolor = require('onecolor'); 

  var rgb = colorThief.getColor(file);
  var rgbCode = 'rgb( ' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; // 'rgb(r, g, b)'

  var hex = onecolor(rgbCode).hex();

  var colors = {};
  colors.actual = hex.replace("#","");
  colors.similar = getSimilarColors(rgb);

  var gray = toGray(rgb);
  var grayCode = 'rgb( ' + gray + ',' + gray + ',' + gray + ')';

  var grayHex = onecolor(grayCode).hex();
  colors.gray = grayHex;

  var output = {};
  output.colors = colors;


  // try to attach meta data, if not, just send what you got
  sendData(output, res);
}


function sendData(file, res) {

  // delete file
/*  fs.unlink(file, (err) => {
    if (err) {
      console.error(err)
      return
    }
  });
*/
  res.writeHead(200);

  floutput = JSON.stringify(file)
  res.end(floutput);

}
