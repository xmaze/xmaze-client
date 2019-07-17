var MazeWorld = function() {
	var g_camera;
	var g_scene;
	var g_renderer;
	var g_container;

	// var g_stats;

	var g_elBlocker = document.getElementById( 'blocker' );
	var g_elInstructions = document.getElementById( 'instructions' );
	var g_elAnswer = document.getElementById( 'btnSubmit' );
	var g_elUnlock = document.getElementById( 'btnUnlock' );
	var g_elLocationBar = document.getElementById( 'location-bar' );

	var g_player_obj;
	var g_mapCamera;
	var g_player_cam;

	var g_collide_door_obj;
	var g_tunnels = [];

	var g_roomPlayerIn = undefined;

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
	if ( havePointerLock ) {
		var element = document.body;
		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				g_player_cam.controls.enabled = true;
				g_elBlocker.style.display = 'none';
				g_elLocationBar.style.display = 'none';
			} else {
				g_player_cam.controls.enabled = false;
				g_elBlocker.style.display = '-webkit-box';
				g_elBlocker.style.display = '-moz-box';
				g_elBlocker.style.display = 'box';
				g_elInstructions.style.display = '';
				g_elLocationBar.style.display = 'block';
			}
		};
		var pointerlockerror = function ( event ) {
			instructions.style.display = '';
		};
		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		var onClickInstruction = function( event ) {
			g_elInstructions.style.display = 'none';
			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
		};

		var onClickAnswer = function( event ) {
			g_elInstructions.style.display = 'none';
			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
			document.getElementById( 'submission-form' ).style.display = 'none';
			document.getElementById( 'instructions-desc' ).style.display = '';

			g_elInstructions.addEventListener( 'click', onClickInstruction, false );

			var _door_url = document.getElementById( 'question-url' ).value;
			var _key = document.getElementById( 'answer-box' ).value;
			loadMazeData( "https://api.xmaze.mindey.com/room" + _door_url + "/?format=json&key=" + _key, function( data ) {
			// loadMazeData( "https://api.xmaze.mindey.com + _door_url + "/?format=json&key=" + _key, function( data ) {
				var _data = JSON.parse( data );
				if ( _data.result === undefined ) {
					buildMazeFromData( data, findTunnelObjFromName( g_collide_door_obj.userData.name ) );
					g_collide_door_obj.parent.remove( g_collide_door_obj );
				}
			} );
		}

		g_elInstructions.addEventListener( 'click', onClickInstruction, false );
		g_elAnswer.addEventListener( 'click', onClickAnswer, false );
		g_elUnlock.addEventListener( 'click', onClickAnswer, false );

	} else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}

	function onCollideWithDoor( door ) {
		// Ask the browser to release the pointer
		document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
		document.exitPointerLock();

		document.getElementById( 'submission-form' ).style.display = 'block';
		document.getElementById( 'instructions-desc' ).style.display = 'none';

		instructions.removeEventListener( 'click', onClickInstruction, false );

		document.getElementById( 'question-box' ).innerHTML = door.userData.task;
		document.getElementById( 'question-url' ).value = door.userData.endpoint;
		document.getElementById( 'answer-box' ).value = '';

		g_collide_door_obj = door;
	}

	function initialize() {
	    g_scene = new THREE.Scene();
	    g_player_cam = new FirstPersionPlayer( g_scene, onCollideWithDoor );

	    g_renderer = new THREE.WebGLRenderer( { antialias : true } );
	    g_renderer.setPixelRatio( window.devicePixelRatio);
	    g_renderer.setSize( window.innerWidth, window.innerHeight );
	    g_renderer.setClearColor( 0x000000, 1 );
	    g_renderer.autoClear = false;
	    g_renderer.setScissorTest( true );
	    g_container = document.createElement( 'div' );
	    document.body.appendChild( g_container );
	    g_container.appendChild( g_renderer.domElement );


	    // LIGHTS
	    var _hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	    _hemiLight.position.set( 0, 1000, 0 );
	    g_scene.add( _hemiLight );

	    var _dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
	    _dirLight.position.set( 1.0, 1.0, 1.0 );
	    g_scene.add( _dirLight );

	    window.addEventListener( 'resize', onWindowResize, false );

	    // g_mapCamera = new THREE.OrthographicCamera( -1.0, 1.0, 1.0,	-1.0, -10000, 10000 );
	    // g_mapCamera.zoom = 0.002;
	    // g_mapCamera.updateProjectionMatrix();
	    // g_mapCamera.position.set( 0.0, 0.0, 0.0 );
	    // g_mapCamera.lookAt( new THREE.Vector3( -1.0, -1.0, -1.0 ) );

	    g_mapCamera = new THREE.PerspectiveCamera( 45, 1.0, 0.1, 20000 );
	    g_mapCamera.position.set( 1.0, 1.0, 1.0 );
	    g_mapCamera.position.setLength( 1800.0 );
	    g_mapCamera.lookAt( new THREE.Vector3( 0.0, 0.0, 0.0 ) );

	    // add player object
	    var geometry = new THREE.SphereGeometry( 10, 32, 32 );
		var material = new THREE.ShaderMaterial( {
	      	// uniforms: uniforms,
	      	transparent: true,
	      	vertexShader: 'varying vec3 vNormal; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); vNormal = normalize( normalMatrix * normal ); }',
	      	fragmentShader: 'varying vec3 vNormal; void main() { float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ); vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 1.0 ); gl_FragColor = vec4( atmosphere, 1.0 ); gl_FragColor = vec4( 1.0, 0.0, 0.0, pow( 1.0 - intensity, 2.0 ) ); }'
	    } );

		g_player = new THREE.Mesh( geometry, material );
		g_scene.add( g_player );

	    // g_stats = new Stats();
	    // g_container.appendChild( g_stats.dom );

	    // test();
	    loadMazeData( "https://api.xmaze.mindey.com/room/sample/?format=json", function( data ) {
	    	buildMazeFromData( data );
	    } );
	    // ajax_test();

	    animate();
	}

	function ajax_test() {
		var xhttp = new XMLHttpRequest();
	  	xhttp.onreadystatechange = function() {
	    	if (this.readyState == 4 && this.status == 200) {
		      	// document.getElementById("demo").innerHTML =	this.responseText;
		      	console.log(this.responseText);
		    }
	  	};
 
	  	xhttp.open("GET", "https://api.xmaze.mindey.com/room/sample/?format=json", true);
	  	// xhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
	  	// xhttp.setRequestHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
	  	// xhttp.setRequestHeader('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
	  	// xhttp.setRequestHeader('Content-Type', 'application/json');
	  	// xhttp.withCredentials = true;
	  	xhttp.send();
	}

	function loadMazeData( url, cbSuccess ) {
		var xhttp = new XMLHttpRequest();
	  	xhttp.onreadystatechange = function() {
	    	if (this.readyState == 4 && this.status == 200) {
		      	cbSuccess( this.responseText );
		    }
	  	};
 
	  	xhttp.open("GET", url, true);
	  	xhttp.send();
	}

	function buildMazeFromData( data, tunnel_obj ) {
		console.log( JSON.parse( data ) );
		var _mazeData = JSON.parse( data );

		var _mazeRoom = new MazeRoom( guid(), 200, 100, 150, tunnel_obj );
		for ( var i = 0; i < _mazeData.room.doors.length; i++ ) {
			if ( tunnel_obj != undefined && ( tunnel_obj.wall_name == 'left' && _mazeData.room.seq[i] == 'right' || 
				tunnel_obj.wall_name == 'right'   && _mazeData.room.seq[i] == 'left' || 
				tunnel_obj.wall_name == 'up'      && _mazeData.room.seq[i] == 'down' || 
				tunnel_obj.wall_name == 'down'    && _mazeData.room.seq[i] == 'up' || 
				tunnel_obj.wall_name == 'forward' && _mazeData.room.seq[i] == 'back' || 
				tunnel_obj.wall_name == 'back'    && _mazeData.room.seq[i] == 'forward' )
			) continue;
		 	var _mazeTunnel = _mazeRoom.hangTunnel( _mazeData.room.seq[i], { x: 10, y: 10 }, { x: 20, y: 15 }, 300, _mazeData.room.doors[i] );
		 	_mazeTunnel.addToScene( g_scene );
	 		g_tunnels.push( _mazeTunnel );
		}
		_mazeRoom.createRoom( 'tex/brick_diffuse.jpg' );
		_mazeRoom.addToScene( g_scene ); console.log(g_tunnels);
	}

	function findTunnelObjFromName( name ) {
		for ( var i = 0; i < g_tunnels.length; i++ ) {
			if ( g_tunnels[i].name == name )
				return g_tunnels[i];
		}
		return;
	}

	function getRoomNameFromUrl( url ) {
		var n = url.indexOf( "/room/" );
		var m = url.indexOf( "/", n + 6 );
		var s = url.substring( n + 6, m );
		return s;
	}

	function guid() {
	  	function s4() {
	    	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	  	}
	  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	function findRoomFromPlayerPos() {
		if ( g_tunnels.length > 0 ) {
			if ( g_tunnels[0].mazeRoomRef.bbox.containsPoint( g_player.position ) )
				return g_tunnels[0].mazeRoomRef;
		}

		for ( var i = 0; i < g_tunnels.length; i++ ) {
			if ( g_tunnels[i].mazeRoomRef_other != undefined && g_tunnels[i].mazeRoomRef_other.bbox.containsPoint( g_player.position ) ) 
				return g_tunnels[i].mazeRoomRef_other;
		}

		return;
	}

	// function findRoomsInDepth_recurrence( rootRoom, rooms, depth ) {
	// 	var _neigh_rooms = findNeighRooms( rootRoom );
	// 	addOnceRooms( _neigh_rooms, rooms );
	// 	if ( depth == 0 ) return;
	// 	var _next_room = getNextRoomFromRooms();
	// 	if ( _next_room )
	// 		findRoomsInDepth_recurrence( _next_room, rooms, depth - 1 );
	// 	return;
	// }

	function findRoomsInDepth() {
		// g_roomPlayerIn
		var _roomPlayerIn = findRoomFromPlayerPos();
		var _visited_rooms = [], _pointer_in_visited_rooms = 0;

		if ( g_roomPlayerIn == undefined || ( _roomPlayerIn != undefined && g_roomPlayerIn.name != _roomPlayerIn.name ) ) {
			g_roomPlayerIn = _roomPlayerIn;
			findRoomsInDepth_recurrence( g_roomPlayerIn, _visited_rooms, 1 );
			deleteUnusedRooms( _visited_rooms );

				console.log('neigh rooms');
				// console.log(g_roomPlayerIn);
				console.log('currRoom name : '+_roomPlayerIn.name);
			for ( var i = 0; i < _visited_rooms.length; i++ ) {
				console.log( _visited_rooms[i].name );
			}
		}

		function deleteUnusedRooms( rooms ) {
			if ( g_tunnels.length > 0 ) {
				g_tunnels[0].mazeRoomRef.object3D.visible = false;
				for ( var j = 0; j < rooms.length; j++ ) {
					if ( g_tunnels[0].mazeRoomRef.name == rooms[j].name ) {
						g_tunnels[0].mazeRoomRef.object3D.visible = true;
						break;
					}
				}
			}

			for ( var i = 0; i < g_tunnels.length; i++ ) {
				g_tunnels[i].object3D.visible = false;
				for ( var j = 0; j < rooms.length; j++ ) {
					if ( g_tunnels[i].mazeRoomRef.name == rooms[j].name ) {
						g_tunnels[i].object3D.visible = true;
						break;
					}
				} 
				if ( g_tunnels[i].mazeRoomRef_other == undefined ) continue;
				g_tunnels[i].mazeRoomRef_other.object3D.visible = false;
				for ( var j = 0; j < rooms.length; j++ ) {
					if ( g_tunnels[i].mazeRoomRef_other.name == rooms[j].name ) {
						g_tunnels[i].mazeRoomRef_other.object3D.visible = true;
						g_tunnels[i].object3D.visible = true;
						break;
					}
				}
			}
		}

		function findRoomsInDepth_recurrence( rootRoom, rooms, depth ) {
			addOnceRoom( rootRoom, rooms );
			if ( depth == 0 ) return;
			var _next_room = getNextRoomFromRooms();
			if ( _next_room == undefined ) return;
			var _neigh_rooms = findNeighRooms( _next_room );
			for ( var i = 0; i < _neigh_rooms.length; i++ ) {
				findRoomsInDepth_recurrence( _neigh_rooms[i], rooms, depth - 1 );
			}
		}

		function getNextRoomFromRooms() {
			return _visited_rooms[_pointer_in_visited_rooms++];
		}

		function findNeighRooms( currRoom ) {
			var _ret = [];
			for ( var i = 0; i < g_tunnels.length; i++ ) {
				if ( g_tunnels[i].mazeRoomRef_other != undefined && g_tunnels[i].mazeRoomRef_other.name == currRoom.name ) 
					_ret.push( g_tunnels[i].mazeRoomRef );
				else if ( g_tunnels[i].mazeRoomRef != undefined && g_tunnels[i].mazeRoomRef.name == currRoom.name && g_tunnels[i].mazeRoomRef_other != undefined )
					_ret.push( g_tunnels[i].mazeRoomRef_other );
			}
			return _ret;
		}

		function addOnceRoom ( roomToAdd, rooms ) {
			for ( var i = 0; i < _visited_rooms.length; i++ ) {
				if ( roomToAdd.name == _visited_rooms[i].name ) return;
			}
			_visited_rooms.push( roomToAdd );
		}
	}

	function test() {
		var _mazeRoom = new MazeRoom( 200, 100, 150 );
		var _mazeTunnel1 = _mazeRoom.hangTunnel( 'right', { x: 10, y: 10 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel2 = _mazeRoom.hangTunnel( 'left', { x: 20, y: 10 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel3 = _mazeRoom.hangTunnel( 'front', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel4 = _mazeRoom.hangTunnel( 'back', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel5 = _mazeRoom.hangTunnel( 'top', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel6 = _mazeRoom.hangTunnel( 'bottom', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		_mazeRoom.createRoom( 'tex/brick_diffuse.jpg' );

		var _mazeRoom1 = new MazeRoom( 50, 100, 150, _mazeTunnel1 );
		_mazeRoom1.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom2 = new MazeRoom( 50, 100, 150, _mazeTunnel2 );
		_mazeRoom2.createRoom( 'tex/roughness_map.jpg' );

		var _mazeRoom3 = new MazeRoom( 50, 100, 150, _mazeTunnel3 );
		_mazeRoom3.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom4 = new MazeRoom( 50, 100, 150, _mazeTunnel4 );
		_mazeRoom4.createRoom( 'tex/roughness_map.jpg' );

		var _mazeRoom5 = new MazeRoom( 50, 100, 150, _mazeTunnel5 );
		_mazeRoom5.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom6 = new MazeRoom( 50, 100, 150, _mazeTunnel6 );
		var _mazeTunnel61 = _mazeRoom6.hangTunnel( 'right', { x: 10, y: 10 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel62 = _mazeRoom6.hangTunnel( 'left', { x: 20, y: 10 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel63 = _mazeRoom6.hangTunnel( 'front', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		var _mazeTunnel64 = _mazeRoom6.hangTunnel( 'back', { x: 10, y: 20 }, { x: 20, y: 15 }, 300 );
		_mazeRoom6.createRoom( 'tex/roughness_map.jpg' );

		var _mazeRoom611 = new MazeRoom( 50, 100, 150, _mazeTunnel61 );
		_mazeRoom611.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom621 = new MazeRoom( 50, 100, 150, _mazeTunnel62 );
		_mazeRoom621.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom631 = new MazeRoom( 50, 100, 150, _mazeTunnel63 );
		_mazeRoom631.createRoom( 'tex/disturb.jpg' );

		var _mazeRoom641 = new MazeRoom( 50, 100, 150, _mazeTunnel64 );
		_mazeRoom641.createRoom( 'tex/disturb.jpg' );

		_mazeRoom.addToScene( g_scene );
		_mazeRoom1.addToScene( g_scene );
		_mazeRoom2.addToScene( g_scene );
		_mazeRoom3.addToScene( g_scene );
		_mazeRoom4.addToScene( g_scene );
		_mazeRoom5.addToScene( g_scene );
		_mazeRoom6.addToScene( g_scene );

		_mazeRoom611.addToScene( g_scene );
		_mazeRoom621.addToScene( g_scene );
		_mazeRoom631.addToScene( g_scene );
		_mazeRoom641.addToScene( g_scene );

		_mazeTunnel1.addToScene( g_scene );
		_mazeTunnel2.addToScene( g_scene );
		_mazeTunnel3.addToScene( g_scene );
		_mazeTunnel4.addToScene( g_scene );
		_mazeTunnel5.addToScene( g_scene );
		_mazeTunnel6.addToScene( g_scene );

		_mazeTunnel61.addToScene( g_scene );
		_mazeTunnel62.addToScene( g_scene );
		_mazeTunnel63.addToScene( g_scene );
		_mazeTunnel64.addToScene( g_scene );
	}

	function onWindowResize() {
	    g_player_cam.resizeCamera( window.innerWidth, window.innerHeight );
	    g_renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function animate() {
		requestAnimationFrame( animate );
	 	// updateCamera();
	 	g_player_cam.updateCamera();
	 	updatePlayer();

	 	// var _t = findRoomFromPlayerPos();
	 	// if ( _t )
	 	// 	document.getElementById( 'debug' ).innerHTML = findRoomFromPlayerPos();

	 	findRoomsInDepth();

		render();
		// g_stats.update();
	}

	function render() {
		g_player.visible = false;
		g_renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
		g_renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
		g_renderer.clear();
		g_renderer.render( g_scene, g_player_cam.camera );

		g_player.visible = true;

		// renderer.setViewport( 0, 0, window.innerWidth * 0.3, window.innerHeight * 0.3 );
		// renderer.setScissor( 0, 0, window.innerWidth * 0.3, window.innerHeight * 0.3 );
		g_renderer.setViewport( window.innerWidth - 300, 0, 300, 300 );
		g_renderer.setScissor( window.innerWidth - 300, 0, 300, 300 );
		g_renderer.clear();
		g_renderer.render( g_scene, g_mapCamera );
	}

	function updatePlayer() {
		g_player.position.copy( g_player_cam.camera.getWorldPosition() );

		g_mapCamera.position.set( 1.0, 1.0, 1.0 );
	    g_mapCamera.position.setLength( 2000.0 );
	    g_mapCamera.position.add( g_player.position );
	}

	this.initialize = initialize;
}

var mazeWorld = new MazeWorld();
mazeWorld.initialize();

// var str = "https://api.xmaze.mindey.com/room/sample/door/orange/?format=json&key=13";
// var n = str.indexOf("/door/");
// var m = str.indexOf("/", n+6);
// var s = str.substring(n+6,m);
