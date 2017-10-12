THREE.PointerLockControls = function ( camera ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	this.dispose = function() {

		document.removeEventListener( 'mousemove', onMouseMove, false );

	};

	document.addEventListener( 'mousemove', onMouseMove, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

};

var FirstPersionPlayer = function( scene, cbCollideFunc ) {
	var scope = this;

	this.scene = scene;
	this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10000 );
	this.controls = new THREE.PointerLockControls( this.camera );
	this.scene.add( this.controls.getObject() );


    this.enabled = true;
    this.speed = 10.0;
    this.cbCollideFunc = cbCollideFunc;

    var g_bCollideWithDoor = false;
    var g_prevTime = performance.now();
    var g_velocity = new THREE.Vector3();
	var g_moveForward = false;
	var g_moveBackward = false;
	var g_moveLeft = false;
	var g_moveRight = false;
	var g_raycaster = [
		new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 5 ),
	    new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( -1, 0, 0 ), 0, 5 ),
	   	new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, 5 ),
	    new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1, 0 ), 0, 5 ),
	    new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0, 1 ), 0, 5 ),
	    new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0, -1 ), 0, 5 )
	];

	var onKeyDown = function ( event ) {
		switch ( event.keyCode ) {
			case 38: // up
			case 87: // w
				g_moveForward = true;
				break;
			case 37: // left
			case 65: // a
				g_moveLeft = true; break;
			case 40: // down
			case 83: // s
				g_moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				g_moveRight = true;
				break;
			// case 32: // space
			// 	if ( canJump === true ) velocity.y += 350;
			// 	canJump = false;
			// 	break;
		}
	};

	var onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				g_moveForward = false;
				break;
			case 37: // left
			case 65: // a
				g_moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				g_moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				g_moveRight = false;
				break;
		}
	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.updateCamera = function() {
		var _time = performance.now();
		var _delta = ( _time - g_prevTime ) / 1000;
		if ( scope.controls.enabled ) {
			g_velocity.x -= g_velocity.x * 10.0 * _delta;
			g_velocity.z -= g_velocity.z * 10.0 * _delta;
			g_velocity.y -= g_velocity.y * 10.0 * _delta;

			var _dir = new THREE.Vector3();
			if ( g_moveForward ) {
				_dir = scope.controls.getDirection( _dir );
				g_velocity.add( _dir.multiplyScalar( scope.speed * _delta ) );
			}
			if ( g_moveBackward ) {
				_dir = scope.controls.getDirection( _dir );
				g_velocity.add( _dir.multiplyScalar( -scope.speed * _delta ) );
			}
			if ( g_moveLeft ) {
				_dir = scope.controls.getDirection( _dir );
				_dir.cross( new THREE.Vector3( 0.0, 1.0, 0.0 ) ).normalize();
				g_velocity.add( _dir.multiplyScalar( -scope.speed * _delta ) );
			}
			if ( g_moveRight ) {
				_dir = scope.controls.getDirection( _dir );
				_dir.cross( new THREE.Vector3( 0.0, 1.0, 0.0 ) ).normalize();
				g_velocity.add( _dir.multiplyScalar( scope.speed * _delta ) );
			}

			scope.controls.getObject().position.add( g_velocity );

			var _bCollideWithDoor = false;
			for ( var i = 0; i < 6; i++ ) {
				g_raycaster[i].ray.origin.copy( scope.controls.getObject().position );
				var _intersections = g_raycaster[i].intersectObjects( scope.scene.children, true );

				if ( _intersections.length > 0 ) {
					var _inv_dis = 5.0 - _intersections[0].distance + 0.01;
					var _offset = g_raycaster[i].ray.direction.clone();					
					_offset.multiplyScalar( -_inv_dis );
					scope.controls.getObject().position.add( _offset );

					var _temp = g_velocity.clone();
					_temp.projectOnVector( g_raycaster[i].ray.direction );
					_temp.negate();
					_temp.add( g_velocity );
					_temp.setLength( g_velocity.length()-_temp.length() );
					scope.controls.getObject().position.add( _temp );

					// when collide with door.
					if ( g_bCollideWithDoor == false && _intersections[0].object.name === 'door' ) {
						scope.cbCollideFunc( _intersections[0].object );

						g_bCollideWithDoor = true; //?
						_bCollideWithDoor = true;

						g_velocity.set( 0.0, 0.0, 0.0 );
					}
				}
			}

			g_bCollideWithDoor = _bCollideWithDoor;

			// check which room is player in.
			
		}
		g_prevTime = _time;
	}

	this.resizeCamera = function( width, height ) {
		scope.camera.aspect = width / height;
	    scope.camera.updateProjectionMatrix();
	}
}
