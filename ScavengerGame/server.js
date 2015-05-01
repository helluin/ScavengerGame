/*
  Noble-Sockets example
  
  This example uses Sandeep Mistry's noble library for node.js to
  create a central server that reads and connects to BLE peripherals 
  and sends this info to a browser with socket.io
  
  created 15 Jan 2015
  by Maria Paula Saba
*/

//importing node modules (libraries)
var noble = require('noble'),
	express = require('express'),
    http = require('http'),
    async = require('async'),
    open = require("open")
   // $ = require('jquery');

// create a server calling the function onRequest
var app = express();
var server = http.createServer(app); 

// start the server 
server.listen(8080);
console.log('Server is listening to http://localhost on port 8080');
open("http://localhost:8080");
open("http://localhost:8080");

//read index.html page
app.use('/public/js', express.static(__dirname + '/public/js'));
app.use('/public/css', express.static(__dirname + '/public/css'));

app.get('/', function (request, response) {
  response.sendFile(__dirname + '/public/index.html');
});




//array to save all peripherals found
var peripherals = [];

//variable to save UUID for the connected peripheral
var connected = "";

//to save interval on reading RSSI
var RSSIinterval;

//Bluetooth ON or OFF
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("start scanning");
    noble.startScanning();
  } else {
    noble.stopScanning();
    console.log("stop scanning, is Bluetooth on?");
  }
});

//when discover new peripheral
noble.on('discover', function(peripheral) {
	var peripheralData = {
		"name": peripheral.advertisement.localName, // why singlar???????
		"uuid": peripheral.uuid
	}


    //check if this peripheral has been found previously
    var newPeripheral = true;
    peripherals.forEach(function(element){
    	if(element.uuid === peripheral.uuid){
    		newPeripheral = false;
    	}
    });

    //if it is a new one
    if(newPeripheral){
		//save to array in server
		peripherals.push(peripheral);

		//send peripheral discovered to client
		io.sockets.emit('peripheral', peripheralData);
	}
});

//this function is called in the sockets part
function connectPeripheral(peripheral) {
	noble.stopScanning();

	//connect to peripheral
    peripheral.connect(function(error){
        console.log('connected to peripheral');  
        connected = peripheral.uuid;

		//log some data from it
		logData(peripheral);
		
		//read RSSI every 60 seconds
		RSSIinterval = setInterval(getRSSI, 60);  

		//callback function to once disconnect happens
		peripheral.once('disconnect', function() {
	 		console.log('peripheral disconneted');
	 		connected = "";
	 		clearInterval();
	        io.sockets.emit('disconnectedPeripheral', peripheral.uuid);
       		noble.startScanning();
		});
  	});
}
var advertisement;
var localName;  
   var txPowerLevel;
    var manufacturerData ;

function logData(peripheral){
    advertisement = peripheral.advertisement;
    localName = advertisement.localName;
    txPowerLevel = advertisement.txPowerLevel;
    manufacturerData = advertisement.manufacturerData;
    console.log("Peripheral "+localName + " with UUID " + peripheral.uuid  + " connected");
    console.log("TX Power Level "+ txPowerLevel + ", Manufacturer "+ manufacturerData);

    var data = "Peripheral with name "+localName + " and UUID " + peripheral.uuid  + " has signal strenght (RSSI) of <span id='rssi'>"+ peripheral.rssi+".<span>" ;
    //<br/> TX Power Level "+ txPowerLevel + ", Manufacturer "+ manufacturerData;

    io.sockets.emit('dataLogged',data);
}


function getRSSI(peripheral){
	for (var i = 0; i < peripherals.length; i++){
		if(connected == peripherals[i].uuid){
						    var uuid = peripherals[i].uuid

				peripherals[i].updateRssi(function(error, rssi){
			      	//rssi are always negative values
			        if(rssi < 0) io.sockets.emit('rssi', {'rssi': rssi, 'uuid':uuid});
				});
		}
	}
}






// WebSocket Portion
var io = require('socket.io').listen(server);

var request = require('request');

// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function. This object has an id

	function (socket) {	
		//check if clients are connected
		console.log("We have a new client: " + socket.id);
    
    
    // USING AN ANONYMOUS FUNCTION AS THE CALLBACK
        
        socket.on('requestLogin', function (){     
            
            var postData = querystring.stringify({
  'username' : 'yz1184'
});

var options = {
  hostname: 'http://104.236.16.105:8080/login',
  port: 80,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  }
};

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write(postData);
req.end();
            
            
            
//            var url = 'http://104.236.16.105:8080/login';
//       var headerNames = ["username"];
//var headerValues = ["yz1184"];
//var response = HTTP.Get(url, headerNames, headerValues);
//
//Write(response.Status + '<br />');
//Write(response.Content);
//            console.log(logged);
        
            
            
            
            
//            request.post(
//            'http://104.236.16.105:8080/login',
//            { form: { username: 'yz1184'} },
//            function (error, response, body) {
//                if (!error && response.statusCode == 200) {
//                    console.log(body);
//                }
//             console.log(logged);
//            })
        });
    
    // USING A CALLBACK
    //Used to have: events.js:142
    //              throw TypeError('listener must be a function');
    // Solved by changing socket.on('login', loginToServer()) to (... ,logtinToServer)
    
        socket.on('requestLogin', loginToServer); 
     
        function loginToServer(){          
            request.post(
            'http://104.236.16.105:8080/login',
            { form: { username: 'yz1184'} },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                }
            })
        };
        
		socket.on('scan', function() {
			// Request to rescan
			peripherals = [];
 		    console.log("start scanning client");
			noble.startScanning();
		});
		
		socket.on('explorePeripheral', function(data) {
			//find the right peripheral to connect
			peripherals.forEach(function(element){
				if(element.uuid === connected){
					element.disconnect();
				}

		    	else if(element.uuid === data){
		    		connectPeripheral(element);
		    	}

	    	});
        socket.on('requestpost', requestpostData);
            
        function requestpostData(){
        request.post(
        'http://104.236.16.105:8080/beacon',
        { form: { uuid: ''} },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
        })
        }; 
        

		socket.on('disconnectPeripheral', function(data) {
			//find the right peripheral to disconnect
			peripherals.forEach(function(element){
		    	if(element.uuid === data){
		    		element.disconnect();
    			    console.log('peripheral disconnet requested by client');
		    	}
	    	});


		});


		socket.on('disconnect', function() {
			//check if clients have disconnected
			console.log("Client has disconnected");
			clearInterval(RSSIinterval);
       		noble.startScanning();
		});
	}
);


}
);

              




