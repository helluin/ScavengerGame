//connect to server
var socket = io.connect('http://localhost:8080/');

//array of peripheral objects
var peripheralsList = [];

//when connect
socket.on('connect', function() {
	console.log("Connected");
});


//////
//var options = {
//    host: 'jquery.com',
//    port: 80,
//    path: '/'
//};
//
//var html = '';
//http.get(options, function(res) {
//    res.on('data', function(data) {
//        console.log("jquery ")
////        // collect the data chunks to the variable named "html"
////        html += data;
//    }).on('end', function() {
//        // the whole of webpage data has been collected. parsing time!
//        var title = $(html).find('title').text();
//        console.log(title);
//     });
//});
///////


// when receive a message
socket.on('peripheral', function(data) {

	if (typeof data.name ===  undefined ||
		typeof data.name ===  'undefined') {
		return;
	}

    
	document.getElementById('found').innerHTML ="Peripherals found - click to explore:";

    var newPeripheral = true;

    peripheralsList.forEach(function(element){
    	if(element.uuid === data.uuid){
    		new
        Peripheral = false;
    	}
    });

    if(newPeripheral){
	//display in HTML
	var Pdiv= document.createElement('div');
	Pdiv.className= 'peripheralDiv btn';
	Pdiv.setAttribute('id', data.uuid);
	var Pname = document.createElement('p');
	Pname.innerHTML = data.name+'<br/><span> UUID: '+data.uuid+'</span>';

	//attach event listener to the peripheral divs
	Pdiv.addEventListener("click", explore);
	Pdiv.appendChild(Pname);
	document.getElementById('peripherals').appendChild(Pdiv);
	
    data["connected"] = false;

	//save to the peripherals array
	peripheralsList.push(data);
    }
});


socket.on('disconnectedPeripheral', function(data){
    document.getElementById('explore').innerHTML = "";

	peripheralsList.forEach(function(element){
    	if(element.uuid === data){
    		document.getElementById(data).style.backgroundColor = "#FFF";
    		element.connected = false;
    	}
    });
 });

socket.on('dataLogged', function(data){
	console.log(data);

	document.getElementById('explore').innerHTML = data;

 });


function explore(){
	var Pdiv = this;
	var peripheral;

    peripheralsList.forEach(function(element){
    	if(element.uuid === Pdiv.id){
    		peripheral = element;
    		peripheral.connected = !peripheral.connected;		
    	}
    });

    if(peripheral.connected === true){
		this.style.backgroundColor = "#9ed1f0";
		socket.emit('explorePeripheral', peripheral.uuid);
		 document.getElementById('explore').innerHTML = "<p>Trying to connect to "+peripheral.name+"</p>";


    }
    else{
		this.style.backgroundColor = "#999";
		socket.emit('disconnectPeripheral', peripheral.uuid);
		document.getElementById('explore').innerHTML = "<p>Trying to disconnect from "+peripheral.name+"</p>";

    }
}


function requestScan(){
	//empty peripherals list
	peripheralsList = [];
    document.getElementById('found').innerHTML ="";

	var Plist = document.getElementById('peripherals');
	while (Plist.hasChildNodes()) {   
    	Plist.removeChild(Plist.firstChild);
	}

	//ask for scanning
	socket.emit('scan');
}

var init = function(){	
	document.getElementById('scan').addEventListener("click", requestScan);
	document.getElementById('login').addEventListener("click", loginToServer);
	document.getElementById('submit').addEventListener("click", requestpostData);
}

// The "require" library is used in the server side js. Not sure if it can work that way since the doc says it's for client side. However, when communicating with Tom's server, we are acting as a client. 

function requestpostData(){
    socket.emit('requestpost');
}

function loginToServer(){
    socket.emit('requestLogin');
}

