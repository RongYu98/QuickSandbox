/* global $, navigator */

// Initialization
var c = document.getElementById("field");
var ctx = c.getContext("2d");

// Initialize Bootstrap Toggle Switch
$("[name='change']").bootstrapSwitch();
$("[name='stopping']").bootstrapSwitch();
$("[name='field-size']").bootstrapSwitch();


//Initialize Bootstrap Slider
var mySlider = $("#speed").slider();

var field = $('<img>');
field.attr('src', 'static/field.jpg');
field.on('load', resize);

$("[name='field-size']").on('switchChange.bootstrapSwitch', function(event, state){
    this.i = 0;
    this.n = 0;
    this.x = 0;
    for( this.i=0; this.i< totalCreated; this.i++){
	if (PATHS[this.i] != null){ //i.e. theres stuff there
	    for (this.x = 0; this.x < PATHS[this.i][0].length; this.x++ ){
		PATHS[this.i][0][this.x] /= c.width;
		PATHS[this.i][1][this.x] /= c.height;		
		this.n = PATHS[this.i][0][this.x];
		PATHS[this.i][0][this.x] = PATHS[this.i][1][this.x];
		PATHS[this.i][1][this.x] = this.n;
		
		//divide by the width and height to get the thing
	    }
	}
    }
    this.toHalf = false;
    if(!state){
	field.attr('src', 'static/halffield.jpg');
	this.toHalf = true;
    }else{
	field.attr('src', 'static/field.jpg');
    }
    
    for( this.i=0; this.i< totalCreated; this.i++){
	if (PATHS[this.i] != null){ //i.e. theres stuff there
	    for (this.x = 0; this.x < PATHS[this.i][0].length; this.x++ ){
		//divide by the width and height to get the thing
		if (this.toHalf){
	  	    PATHS[this.i][0][this.x] = 1 - PATHS[this.i][0][this.x];
		} else {
		    PATHS[this.i][1][this.x] = 1 - PATHS[this.i][1][this.x];
		}
		PATHS[this.i][0][this.x] *= c.width;
		PATHS[this.i][1][this.x] *= c.height;
		if (this.toHalf){
		    PATHS[this.i][1][this.x] *= 2;
		} else {
		    PATHS[this.i][0][this.x] /= 2;
		}
	    }
	}
    }
    reset();
});

var help = $('#help');

var requestID;

var drawingBall = false;
var PLAYERS = new Array();
var PATHS = {};
var cursorX;
var cursorY;
var Xs = new Array();
var Ys = new Array();
var mouse_Down = false;
var drawingPath = false;
var running = false;
var creatingTeam1 = true;
var nonSelectColor;
var nonSelectSpeed;
var BALL;

var selecting = false;
var select = -1;

var deleting = false;

var totalCreated = 0;

var player, playerRatio;
var winHeight, winWidth;
var imgHeight, imgWidth;
var currentHeight, currentWidth;

var leftBound = -1;
var rightBound = -1;
var name = "";

var FORMATION1, FORMATION2;
$.getJSON('./static/formations/standard_11_players.json',
    function(response) { FORMATION1 = response; });
$.getJSON('./static/formations/standard_11_players_2_teams.json',
    function(response) { FORMATION2 = response; });

function calculateBounds() {
    leftBound = winWidth * 0.2;
    if (winWidth * 0.8 / winHeight > 4/3){
	leftBound += ((winWidth * 0.8) - currentWidth) / 2;
    }
    rightBound = leftBound + currentWidth;
}

// Field Resize Function
function resize() {
    // all coordinates are divided by the current width and height to get a percent
    // the percent is applied by then multiplying it with the new width and height
    winHeight = $(window).height();
    winWidth = $(window).width();
    imgHeight;
    imgWidth;
    playerRatio;

    if(field.attr('src') == "static/field.jpg"){
	imgHeight = 768;
	imgWidth = 1024;
	playerRatio = $("canvas").attr("width")/1024;
    }else{
	imgHeight = 512
	imgWidth = 768;
	playerRatio = $("canvas").attr("width")/768;
    }

    var i = 0;
    var a = 0;

    for (i=0; i<totalCreated-1; i++){
	if (PATHS[i]!=null){
	    for (a=0; a<PATHS[i][0].length; a++){
		PATHS[i][0][a] = PATHS[i][0][a] / currentWidth;
		PATHS[i][1][a] = PATHS[i][1][a] / currentHeight;
	    }
	}
    }
    for (i=0; i<PLAYERS.length;i++){
	PLAYERS[i].x = PLAYERS[i].x / currentWidth;
	PLAYERS[i].y = PLAYERS[i].y / currentHeight;
    }

    if (winWidth/imgWidth <= winHeight/imgHeight) {
        currentWidth = winWidth;
        currentHeight = imgHeight * (winWidth/imgWidth);
	for (i=0; i<totalCreated-1; i++){
	    if (PATHS[i]!=null){
		for (a=0; a<PATHS[i][0].length; a++){
		    PATHS[i][0][a] = PATHS[i][0][a] * currentWidth;
		    PATHS[i][1][a] = PATHS[i][1][a] * currentHeight;
		}
	    }
	}
	for (i=0; i<PLAYERS.length;i++){
	    PLAYERS[i].x = PLAYERS[i].x * currentWidth;
	    PLAYERS[i].y = PLAYERS[i].y * currentHeight;
	}
    } else {
        currentWidth = imgWidth * (winHeight/imgHeight);
        currentHeight = winHeight;
	for (i=0; i<totalCreated-1; i++){
	    if (PATHS[i]!=null){
		for (a=0; a<PATHS[i][0].length; a++){
		    PATHS[i][0][a] = PATHS[i][0][a] * currentWidth;
		    PATHS[i][1][a] = PATHS[i][1][a] * currentHeight;
		}
	    }
	}
	for (i=0; i<PLAYERS.length;i++){
	    PLAYERS[i].x = PLAYERS[i].x * currentWidth;
	    PLAYERS[i].y = PLAYERS[i].y * currentHeight;
	}
    }  

    $("canvas").attr("width", currentWidth);
    $("canvas").attr("height", currentHeight);
    
    ctx.drawImage(field.get(0), 0, 0, currentWidth, currentHeight);
    for (var i = 0; i < PLAYERS.length; i++) {
        var current = PLAYERS[i];
        current.draw();
        drawPath(PATHS[current.ID][0], PATHS[current.ID][1], current.team, current.ball);
    }
    calculateBounds();
}



// Player creation function
function makePlayer(playerID, team) {
    this.ID = playerID;
    this.onPos = -1;
    this.undone = true;
    this.team = team;
    var path;
    var initialSpeed = mySlider.slider('getValue');
    var speed = initialSpeed;
    this.name = "";

    this.ball = false;

    var setSpeed = function(newSpeed) {
	this.initialSpeed = newSpeed;
	speed = newSpeed;
	drawSetup();
	this.draw();
    }

    // used to reset the the players
    var redo = function() {
        this.onPos = 0;
        this.x = PATHS[this.ID][0][this.onPos];
        this.y = PATHS[this.ID][1][this.onPos];
    };
    
    var draw = function() {
        if (this == PLAYERS[select]) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = Math.round(10 * playerRatio);
        } else {
            ctx.lineWidth = 1;
	    if (this.ball) {
		ctx.strokeStyle = "black";
	    } else if (this.team) {
                ctx.strokeStyle = "red";
            } else {
                ctx.strokeStyle = "blue";
            }
        }

	if (this.ball){
	    ctx.fillStyle = "black";
	} else if (this.team){
	    ctx.fillStyle = "red";
	} else {
	    ctx.fillStyle = "blue";
	}
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10 * playerRatio, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
	this.size = 25*playerRatio
	this.size.toString();
        ctx.font = this.size+"px Arial";
	if (this.ball){
	    ctx.fillText("BALL",this.x - 30*playerRatio,this.y + 30*playerRatio);
	} else {
	    ctx.fillText(this.name,this.x - 15*playerRatio,this.y + 30*playerRatio);
	}
    };
    
    var save = function() {
        return JSON.stringify({
           'id': this.ID,
           'team': this.team,
           'speed': speed,
	   'ball': this.ball,
	   'name': this.name
        });
    };
    
    var move = function() {
        path = PATHS[this.ID];
        this.speed = speed * playerRatio;
        
        if (this.onPos < 0 ) {
            this.onPos = 0;
            this.x = path[0][this.onPos];
            this.y = path[1][this.onPos];
        }
        
        for (this.imove = 0; this.imove < this.speed; this.imove++) {
	    // essentially, the following code is executed this.speed times
	    // this is for future development, with more executions and smaller steps
	    // it is possible to add something else inbetween the movements
            
	    if (Math.abs( this.x - path[0][this.onPos] ) < .1) {
                this.x = path[0][this.onPos];
            } else {
                if (this.x - path[0][this.onPos] < 0) {
                    this.angle = Math.atan( ( this.y - path[1][this.onPos] )  / ( this.x - path[0][this.onPos]) );
                    this.x += Math.cos(this.angle)*.1;
                } else {
                    this.angle = Math.atan( ( this.y - path[1][this.onPos] )  / ( this.x - path[0][this.onPos]) );
                    this.x += -1*Math.cos(this.angle)*.1;
                }
            }
            
            if ( Math.abs( this.y - path[1][this.onPos] ) < .1 ) {
                this.y = path[1][this.onPos];
            } else {
                if ( this.x - path[0][this.onPos] < 0 ) {
                    this.angle = Math.atan( ( this.y - path[1][this.onPos] )  / ( this.x - path[0][this.onPos]) );
                    this.y += Math.sin(this.angle)*.1;
                } else {
                    this.angle = Math.atan( ( this.y - path[1][this.onPos] )  / ( this.x - path[0][this.onPos]) );
                    this.y += -1*Math.sin(this.angle)*.1;
                }
            }
            
            if (this.x == path[0][this.onPos] && this.y == path[1][this.onPos]) {
                this.onPos+=1;
            } 
            
            if (this.onPos > path[0].length-1) {
                this.onPos = path[0].length-1;
                this.undone = false;
            }
        }
    };
    
    return {
        draw: draw,
        move: move,
	setSpeed: setSpeed,
        undone: this.undone,
        onPos: this.onPos,
        ID: this.ID,
        x: this.x,
        y: this.y,
        speed: speed,
	initialSpeed: initialSpeed,
        team: this.team,
        redo: redo,
        save: save,
	name: this.name,
    };
}

// Path Drawing Functions
function drawSetup() {
    resize();
}

function drawPath(arrayX, arrayY, team, ball) {

    if (team) {
        ctx.strokeStyle = "red";
    } else {
        ctx.strokeStyle = "blue";
    }
    if (ball){
	ctx.strokeStyle = "black";
    }
    ctx.lineWidth = "5" * playerRatio;
    
    for (var i = 1; i < arrayX.length; i++) {
        ctx.beginPath();
        ctx.moveTo(arrayX[i - 1], arrayY[i - 1]);
        ctx.lineTo(arrayX[i], arrayY[i]);
        ctx.stroke();
    }

    var xDiff = arrayX[arrayX.length - 1] - arrayX[arrayX.length - 2];
    var yDiff = arrayY[arrayY.length - 1] - arrayY[arrayY.length - 2];
    var slope = 9999;
    
    if (xDiff != 0) {
        slope = yDiff / xDiff;
    }
    
    var angle = Math.atan(slope);
    var angleA = angle + 3 * Math.PI / 4;
    var angleB = angle - 3 * Math.PI / 4;
    if (xDiff < 0 || (xDiff == 0 && yDiff < 0)){
    	angleA += Math.PI;
    	angleB += Math.PI;
    }
    ctx.beginPath();
    ctx.moveTo(arrayX[arrayX.length - 1], arrayY[arrayY.length - 1]);
    ctx.lineTo(arrayX[arrayX.length - 1] + Math.round(Math.cos(angleA) * 20 * playerRatio), arrayY[arrayY.length - 1] + Math.round(Math.sin(angleA) * 20 * playerRatio));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrayX[arrayX.length - 1], arrayY[arrayY.length - 1]);
    ctx.lineTo(arrayX[arrayX.length - 1] + Math.round(Math.cos(angleB) * 20 * playerRatio), arrayY[arrayY.length - 1] + Math.round(Math.sin(angleB) * 20 * playerRatio));
    ctx.stroke();
}



// Window Event Handler Assignment
// Note: mouse functions are mouse, touch functions are mobile finger touch
$(window).on('mousemove', function(e) {

    if ( mouse_Down && drawingPath  && (!selecting || selected) && !deleting ) {
	
        cursorX = e.offsetX;
        cursorY = e.offsetY;
        
        if ((Xs.length == 0 || Math.abs(cursorX - Xs[Xs.length - 1]) >= 0.02 * currentWidth || 
            Math.abs(cursorY - Ys[Ys.length - 1]) >= 0.02 * currentWidth) &&
	    e.pageX > leftBound && e.pageX < rightBound &&
            e.pageY > 0 && e.pageY <= currentHeight
        ) {
            Xs.push( cursorX );
            Ys.push( cursorY );
            if (Xs.length > 0) {
                drawSetup();
                drawPath(Xs, Ys, creatingTeam1, drawingBall);
            }
        }
    }
});

var selected = false;
var selectedPlayer;
$(window).on('mousedown', function(e) {

    // if you're within boundaries
    if (drawingPath &&
	e.pageX > leftBound && e.pageX < rightBound &&
	e.pageY > 0 && e.pageY <= currentHeight){
        mouse_Down = true;
    }

    this.xcor = e.offsetX;
    this.ycor = e.offsetY;
    
    if ( ( selecting && !selected) || deleting) { // this will find the player
        
        for (this.i = 0; this.i < PLAYERS.length; this.i++) {
            
            if (
                (PLAYERS[this.i].x - this.xcor) * (PLAYERS[this.i].x - this.xcor) +
                (PLAYERS[this.i].y - this.ycor) * (PLAYERS[this.i].y - this.ycor) <
                (10 * playerRatio) * (10 * playerRatio)
            ) {
                select = this.i;
                selectedPlayer = PLAYERS[select];
                if (deleting) {
                    PLAYERS.splice(PLAYERS.indexOf(selectedPlayer), 1);
                    delete PATHS[selectedPlayer.ID];
                    select = -1;
                    drawSetup();
                } else {
                    creatingTeam1 = selectedPlayer.team;
		    if (selectedPlayer.ball){
			drawingBall = true;
		    }
		    nonSelectSpeed = mySlider.slider('getValue');
		    mySlider.slider('setValue', selectedPlayer.initialSpeed);
		    $('#playerName').val(selectedPlayer.name);
                }
                break;
            }
        }
    }
    
    if (drawingPath) {
        player.x = this.xcor;
        player.y = this.ycor;
    }
});

$(window).mouseup(function(e) {
    
    if (Xs.length > 1) {
       mouse_Down = false;
    }

    if (drawingPath && select == -1 && Xs.length > 1) { // not selecting, so adding

        PATHS[player.ID] = [Xs, Ys];
        player.onPos = -1;
        player.undone = true;
        if (drawingBall){
	    player.ball = true;
	    drawingBall = false;
        }
        PLAYERS.push(player);
    } else if (select > -1 && !deleting && !selected) {
	selected = true;
    } else if (selected){
	if ( e.pageX > leftBound && e.pageX < rightBound && e.pageY > 0 && e.pageY <= currentHeight){
	    if (Xs.length > 1){
        	PATHS[PLAYERS[select].ID] = [Xs, Ys];
	    }
            PLAYERS[select].redo();
            PLAYERS[select].undone = true;
            select = -1;
	    selected = false;
	    drawingBall = false;
	}
    }
 
    drawSetup();
    add( creatingTeam1 );
    Xs = new Array();
    Ys = new Array();
});



/* The following functions are for mobile devices,
*  or anything that does not use the mouse, and 
*  therefore, does not support mouse functions
**/
var lastTouch;
$(window).on('touchstart', function(e) {
    
    var touch = e.originalEvent.touches[0];
    lastTouch = touch;

    // if you're within boundaries
    if (drawingPath &&
	touch.pageX > leftBound && touch.pageX < rightBound &&
	touch.pageY > 0 && touch.pageY <= currentHeight){
        mouse_Down = true;
	e.preventDefault();
    }

    this.xcor = touch.pageX - winWidth * 0.2;
    if (winWidth * 0.8 / winHeight > 4/3) {
	this.xcor -= ((winWidth * 0.8) - currentWidth) / 2;
    }
    this.ycor = touch.pageY;
    
    if ((selecting && !selected) || deleting) { // this will find the player
	
        for (this.i = 0; this.i < PLAYERS.length; this.i++) {
            
            if (
                (PLAYERS[this.i].x - this.xcor) * (PLAYERS[this.i].x - this.xcor) +
                (PLAYERS[this.i].y - this.ycor) * (PLAYERS[this.i].y - this.ycor) <
                (10 * playerRatio) * (10 * playerRatio) * 64
            ) {
                select = this.i;
                selectedPlayer = PLAYERS[select];
                if (deleting) {
                    PLAYERS.splice(PLAYERS.indexOf(selectedPlayer), 1);
                    delete PATHS[selectedPlayer.ID];
                    select = -1;
                    drawSetup();
                } else {
                    creatingTeam1 = selectedPlayer.team;
		    if (selectedPlayer.ball){
			drawingBall = true;
		    }
		    nonSelectSpeed = mySlider.slider('getValue');
		    mySlider.slider('setValue', selectedPlayer.initialSpeed);
		    $('#playerName').val(selectedPlayer.name);
                }
                break;
            }
        }
    }
    
    if (drawingPath) {
        player.x = this.xcor;
        player.y = this.ycor;
    }
});
$(window).on('touchmove', function(e) {
    //Because this is jquery, this isn't the original event, we need to do e.originalEvent
    var E = e.originalEvent.touches;

    var touch = e.originalEvent.touches[0];

    if ( mouse_Down && drawingPath && (!selecting || selected) && !deleting) {
	
	cursorX = touch.pageX - winWidth * 0.2;
	if (winWidth * 0.8 / winHeight > 4/3) {
	    cursorX -= ((winWidth * 0.8) - currentWidth) / 2;
	}
        cursorY = touch.pageY;
	
        if ((Xs.length == 0 || Math.abs(cursorX - Xs[Xs.length - 1]) >= 0.02 * currentWidth || 
            Math.abs(cursorY - Ys[Ys.length - 1]) >= 0.02 * currentWidth) &&
            touch.pageX > leftBound && touch.pageX < rightBound &&
            touch.pageY > 0 && touch.pageY <= currentHeight
        ) {
	    //add the coords into an array that will be a players path
	    Xs.push( cursorX );
            Ys.push( cursorY );
            if (Xs.length > 0) { //draws out the path itself before player's made
                drawSetup();
                drawPath(Xs, Ys, creatingTeam1, drawingBall);
            }
        }
    }
});

$(window).on('touchend', function(e) {
   
    var touch = lastTouch;
    if (Xs.length > 1) {
        mouse_Down = false;
    }
    
    if (drawingPath && select == -1 && Xs.length > 1) { // not selecting, so adding

        PATHS[player.ID] = [Xs, Ys];
        player.onPos = -1;
        player.undone = true;
        if (drawingBall){
	    player.ball = true;
	    drawingBall = false;
        }
        PLAYERS.push(player);	
    } else if (select > -1 && !deleting && !selected) {
	selected = true;
    } else if (selected){
	if ( touch.pageX > leftBound && touch.pageX < rightBound &&
	     touch.pageY > 0 && touch.pageY <= currentHeight){
	    if (Xs.length > 1){
        	PATHS[PLAYERS[select].ID] = [Xs, Ys];
	    }
            PLAYERS[select].redo();
            PLAYERS[select].undone = true;
            select = -1;
	    selected = false;
	    drawingBall = false;
	}
    }

    drawSetup();
    add( creatingTeam1 );
    Xs = new Array();
    Ys = new Array();  
});

$(window).resize(resize);

var lastTeam;
// Button handler assignment
var add = function(team1) { 
    mouse_Down = false;
    player = makePlayer(totalCreated, team1);
    totalCreated++;
    drawingPath = true;
    if (!drawingBall){
	creatingTeam1 = team1;
    }
    if (selecting){
	help.text("Selecting...");
    } else if (deleting){
	help.text("Deleting...");
    } else if (drawingBall){
	help.text("Click and drag to add a ball");
    } else {
	help.text("Click and drag to create a player and a path");
    }
};
var changeColor = function(){
    if (selecting){
	nonSelectColor = !nonSelectColor;
    } else {
	creatingTeam1 = !creatingTeam1;
    }
    add( creatingTeam1 );
};

$("[name='change']").on('switchChange.bootstrapSwitch', function(event, state){
    changeColor();
});


$("[name='stopping']").on('switchChange.bootstrapSwitch', function(event, state){
    if(!state){
	main();
    }else{
	window.cancelAnimationFrame(requestID);
    }
});

$('#ball').on('click touchstart', function(e) {
    e.preventDefault();
    drawingBall = true;
    add( false );
});

$('#reset').on('click touchstart', function(e) {
    e.preventDefault();
    reset();
});

var reset = function(){
    for (var i = 0; i < PLAYERS.length; i++) {
        var current = PLAYERS[i];
        current.undone = true;
        current.onPos = 0;
        current.x = PATHS[current.ID][0][0];
        current.y = PATHS[current.ID][1][0];
    }
    drawSetup();
};


$('#select').on('click touchstart', function(e) {
    e.preventDefault();
    selecting = !selecting;
    drawingPath = false;
    if (selecting) {
        deleting = false;
	nonSelectSpeed = mySlider.slider('getValue');
	nonSelectColor = creatingTeam1;
	help.text("Selecting...");
    } else {
	drawingPath = true;
	creatingTeam1 = nonSelectColor;
	mySlider.slider('setValue', nonSelectSpeed);
	$('#playerName').val("");
	add(creatingTeam1);
	help.text("Click and drag to create a player and a path");
	select = -1;
	selected = false;
	drawSetup();
    }
});

$('#delete').on('click touchstart', function(e) {
    e.preventDefault();
    drawingPath = false;
    deleting = !deleting;
    if (selecting){
	creatingTeam1 = nonSelectColor;
    }
    if (deleting) {
        selecting = false;
        select = -1;
	help.text("Deleting...");
    } else {
	drawingPath = true;
	help.text("Click and drag to create a player and a path");
    }
});

$('#deleteAll').on('click touchstart', function(e) {
    e.preventDefault();
    deleteAll();
});

function deleteAll() {
    drawingPath = false;
    PLAYERS = new Array();
    PATHS = {};
    Xs = new Array();
    Ys = new Array();
    mouse_Down = false;
    drawingPath = true;
    running = false;
    selecting = false;
    select = -1;
    deleting = false;
    totalCreated = 0;
    add( creatingTeam1 );
    drawSetup();
}

$('#submit').click(function(){
    this.str = document.getElementById("playerName").value;
    if (this.str.length > 0){
	name = this.str;
    }
    if ( select > -1){
	PLAYERS[select].name = this.str;
    }
    document.getElementById("playerName").value = "";
    resize();
});

$('#formations').change(function() {
    var option = $('#formations option:selected').val();
    if (option == 'option1'){
	deleteAll();
	loadFormation(FORMATION1);
    } else if (option == 'option2'){
	deleteAll();
	loadFormation(FORMATION2);
    }
});

$('#speed').change(function() {
    if (selected){
	selectedPlayer.setSpeed(mySlider.slider('getValue'));
    }
});

function loadFormation(formation) {
    for (var i = 0; i < formation['players'].length; i++) {
        var onPlayer = formation['players'][i];
        var newPlayer = makePlayer(onPlayer['ID'], onPlayer['team']);
        newPlayer.speed = onPlayer['speed'];
        var onPath = formation['paths'][onPlayer['ID']];
        newPlayer.x = onPath[0][0] * currentWidth;
        newPlayer.y = onPath[1][0] * currentHeight;
        if ( onPlayer['ball'] == true ) {
            newPlayer.ball = true;
        }
	if ( onPlayer['name'] != null ){
	    newPlayer.name = onPlayer['name'];
	}
        PLAYERS.push(newPlayer);
        totalCreated++;
    }
    for (var id in formation['paths']) {
        var onPath = JSON.parse(JSON.stringify(formation['paths'][id]));
        for (var i = 0; i < onPath[0].length; i++) {
            onPath[0][i] *= currentWidth;
            onPath[1][i] *= currentHeight;
        }
        PATHS[id] = onPath;
    }
}

function saveFormation() {
    var psuedoPaths = {}, path;
    for (var i in PATHS) {
        path = JSON.parse(JSON.stringify(PATHS[i]));
        for (var k = 0; k < path[0].length; k++) {
            path[0][k] /= currentWidth;
            path[1][k] /= currentHeight;
        }
        psuedoPaths[i] = path;
    }
    return {
        'players': JSON.parse(JSON.stringify(PLAYERS, ['ID', 'team', 'speed', 'ball', 'name'])),
        'paths': JSON.parse(JSON.stringify(psuedoPaths)),
    };
}


// Main Animation Function
function main() {
    for (var i = 0; i < PLAYERS.length; i++) {
        if (PLAYERS[i].undone){
            PLAYERS[i].move();
	    PLAYERS[i].draw();
            drawPath(Xs, Ys, creatingTeam1, drawingBall);
        }
    }
    drawSetup();
    requestID = window.requestAnimationFrame(main);
}

add(true); // initiation with the first player, allows user to start making players right away
