function getWallId( wall_name ) {
  // var _wall_name = [ 'left', 'right', 'front', 'back', 'top', 'bottom'];
  var _wall_name = [ 'left', 'right', 'forward', 'back', 'up', 'down'];
  wall_id = _wall_name.indexOf( wall_name );
  wall_id = Math.max( wall_id, 0 );

  return wall_id;
}

var MazeTunnel = function() {
  this.object3D = new THREE.Object3D();
  this.object3D.name = 'MazeTunnel';
  this.bbox = new THREE.Box3();
}

MazeTunnel.prototype.createTunnel = function( wall_name, mazeRoomRef, offset, size, length, door_data ) {
  this.wall_name   = wall_name;
  this.mazeRoomRef = mazeRoomRef;
  this.offset      = offset;
  this.size        = size;
  this.length      = length;
  this.name        = door_data.name;

  this.door_data   = door_data;
  this.mazeRoomRef_other = undefined;

  // axis = 0 : x, axis = 1 : y, axis = 2 : z
  var _textureLoader = new THREE.TextureLoader();
  _textureLoader.setCrossOrigin('anonymous');
  var _vertices = [
    new THREE.Vector3( -length * 0.5,  size.y * 0.5,  size.x * 0.5 ), // left-top-right
    new THREE.Vector3( -length * 0.5,  size.y * 0.5, -size.x * 0.5 ), // left-top-left
    new THREE.Vector3( -length * 0.5, -size.y * 0.5, -size.x * 0.5 ), // left-bottom-left
    new THREE.Vector3( -length * 0.5, -size.y * 0.5,  size.x * 0.5 ), // left-bottom-right

    new THREE.Vector3( length * 0.5,  size.y * 0.5,  size.x * 0.5 ), // right-top-right
    new THREE.Vector3( length * 0.5,  size.y * 0.5, -size.x * 0.5 ), // right-top-left
    new THREE.Vector3( length * 0.5, -size.y * 0.5, -size.x * 0.5 ), // right-bottom-left
    new THREE.Vector3( length * 0.5, -size.y * 0.5,  size.x * 0.5 ) // right-bottom-right
  ];

  var _faces = [
    new THREE.Face3( 0, 4, 3 ),
    new THREE.Face3( 3, 4, 7 ),

    new THREE.Face3( 1, 5, 0 ),
    new THREE.Face3( 0, 5, 4 ),

    new THREE.Face3( 2, 6, 1 ),
    new THREE.Face3( 1, 6, 5 ),

    new THREE.Face3( 3, 7, 2 ),
    new THREE.Face3( 2, 7, 6 )
  ];

  var _uvs = [];

  for ( var i = 0; i < _faces.length; i++ ) {
    var _v1 = _vertices[ _faces[i].a ],
      _v2 = _vertices[ _faces[i].b ],
      _v3 = _vertices[ _faces[i].c ];

    if ( i == 0 || i == 1 || i == 4 || i == 5)
      _uvs.push([
        new THREE.Vector2( _v1.x, _v1.y ),
        new THREE.Vector2( _v2.x, _v2.y ),
        new THREE.Vector2( _v3.x, _v3.y )
      ]);
    else
      _uvs.push([
        new THREE.Vector2( _v1.x, _v1.z ),
        new THREE.Vector2( _v2.x, _v2.z ),
        new THREE.Vector2( _v3.x, _v3.z )
      ]);
  }

  var _geom = new THREE.Geometry();
  _geom.vertices = _vertices;
  _geom.faces = _faces;
  _geom.faceVertexUvs[0] = _uvs;
  _geom.computeFaceNormals();

  var _texture = _textureLoader.load( 'tex/hardwood2_diffuse.jpg' );
  _texture.repeat.set( 0.04, 0.04 );
  _texture.wrapS = THREE.RepeatWrapping;
  _texture.wrapT = THREE.RepeatWrapping;

  var _mat = new THREE.MeshBasicMaterial( { color: 0xffffff, map: _texture, side: THREE.FrontSide } );
  var _mesh = new THREE.Mesh( _geom, _mat );

  var _wall_id = getWallId( wall_name );

  var _room_pos = mazeRoomRef.object3D.getWorldPosition();

  var _pos_rot_coff = [
    [
      -mazeRoomRef.width * 0.5 - length * 0.5,
      -0.5 * mazeRoomRef.height + offset.y + size.y * 0.5,
      0.5 * mazeRoomRef.length - offset.x - size.x * 0.5,
      0.0, 0.0, 0.0
    ],
    [
      mazeRoomRef.width * 0.5 + length * 0.5,
      -0.5 * mazeRoomRef.height + offset.y + size.y * 0.5,
      -0.5 * mazeRoomRef.length + offset.x + size.x * 0.5,
      0.0, 0.0, 0.0
    ],
    [
      0.5 * mazeRoomRef.width - offset.x - size.x * 0.5,
      -0.5 * mazeRoomRef.height + offset.y + size.y * 0.5,
      mazeRoomRef.length * 0.5 + length * 0.5,
      0.0, Math.PI * 0.5, 0.0
    ],
    [
      -0.5 * mazeRoomRef.width + offset.x + size.x * 0.5,
      -0.5 * mazeRoomRef.height + offset.y + size.y * 0.5,
      -mazeRoomRef.length * 0.5 - length * 0.5,
      0.0, Math.PI * 0.5, 0.0
    ],
    [
      -0.5 * mazeRoomRef.width + offset.x + size.x * 0.5,
      mazeRoomRef.height * 0.5 + length * 0.5,
      -0.5 * mazeRoomRef.length + offset.y + size.y * 0.5,
      Math.PI * 0.5, Math.PI * 0.5, 0.0
    ],
    [
      -0.5 * mazeRoomRef.width + offset.x + size.x * 0.5,
      -mazeRoomRef.height * 0.5 - length * 0.5,
      0.5 * mazeRoomRef.length - offset.y - size.y * 0.5,
      Math.PI * 0.5, Math.PI * 0.5, 0.0
    ]
  ];
  _mesh.position.set( _pos_rot_coff[_wall_id][0], _pos_rot_coff[_wall_id][1], _pos_rot_coff[_wall_id][2] );
  _mesh.position.add( _room_pos );
  _mesh.rotation.set( _pos_rot_coff[_wall_id][3], _pos_rot_coff[_wall_id][4], _pos_rot_coff[_wall_id][5] );

  this.object3D = _mesh;
  this.bbox.setFromObject( this.object3D );

  var _door_geo = new THREE.PlaneGeometry( size.x, size.y );
  var _door_tex = _textureLoader.load( 'tex/door_wood.jpg' );
  var _door_mat = new THREE.MeshBasicMaterial( { map: _door_tex, side: THREE.DoubleSide, color: '#ffffff' } );
  var _door_obj = new THREE.Mesh( _door_geo, _door_mat );
  _door_obj.name = 'door';
  _door_obj.rotation.set( 0.0, -Math.PI * 0.5, 0.0 );
  _door_obj.userData = door_data;

  _mesh.add( _door_obj );
}

MazeTunnel.prototype.addToScene = function ( scene ) {
  scene.add( this.object3D );
}

var MazeRoom = function( name, width, height, length, mazeTunnelRef ) {
  this.name     = name;
  this.object3D = new THREE.Object3D();
  this.object3D.name = 'MazeRoom';
  this.width    = width;
  this.height   = height;
  this.length   = length;
  this.holes    = [[], [], [], [], [], []];
  this.bbox = new THREE.Box3();

  if ( mazeTunnelRef !== undefined ) {
    this.width  = mazeTunnelRef.mazeRoomRef.width;
    this.height = mazeTunnelRef.mazeRoomRef.height;
    this.length = mazeTunnelRef.mazeRoomRef.length;
    var _pos_coff = [
      [ -mazeTunnelRef.mazeRoomRef.width * 0.5 - mazeTunnelRef.length - this.width * 0.5, 0.0, 0.0 ], // left
      [ mazeTunnelRef.mazeRoomRef.width * 0.5 + mazeTunnelRef.length + this.width * 0.5, 0.0, 0.0 ], // right
      [ 0.0, 0.0, mazeTunnelRef.mazeRoomRef.length * 0.5 + mazeTunnelRef.length + this.length * 0.5 ], // front
      [ 0.0, 0.0, -mazeTunnelRef.mazeRoomRef.length * 0.5 - mazeTunnelRef.length - this.length * 0.5 ], // back
      [ 0.0, mazeTunnelRef.mazeRoomRef.height * 0.5 + mazeTunnelRef.length + this.height * 0.5, 0.0 ], // top
      [ 0.0, -mazeTunnelRef.mazeRoomRef.height * 0.5 - mazeTunnelRef.length - this.height * 0.5, 0.0 ] // bottom
    ];
    this.addSideHole( mazeTunnelRef.wall_name, mazeTunnelRef.offset.x, mazeTunnelRef.offset.y, mazeTunnelRef.size.x, mazeTunnelRef.size.y );
    var _side_wall_id = getWallId( mazeTunnelRef.wall_name );
    this.object3D.position.set( _pos_coff[_side_wall_id][0], _pos_coff[_side_wall_id][1], _pos_coff[_side_wall_id][2] );
    this.object3D.position.add( mazeTunnelRef.mazeRoomRef.object3D.position );

    mazeTunnelRef.mazeRoomRef_other = this;
  }
}

MazeRoom.prototype.createRoom = function ( tex_name ) {
  var _textureLoader = new THREE.TextureLoader();
  _textureLoader.setCrossOrigin('anonymous');
  var width = this.width, height = this.height, length = this.length;
  var _size = [
    [ length, height ], // left
    [ length, height ], // right
    [ width, height ],  // front
    [ width, height ],  // back
    [ width, length ],  // top
    [ width, length ]   // bottom
  ];

  var _position = [
    [ -1.0, 0.0, 0.0 ],
    [ 1.0, 0.0, 0.0 ],
    [ 0.0, 0.0, 1.0 ],
    [ 0.0, 0.0, -1.0 ],
    [ 0.0, 1.0, 0.0 ],
    [ 0.0, -1.0, 0.0 ]
  ];

  var _rotation = [
    [ 0.0, Math.PI * 0.5, 0.0 ],
    [ 0.0, -Math.PI * 0.5, 0.0 ],
    [ 0.0, Math.PI, 0.0 ],
    [ 0.0, 0.0, 0.0 ],
    [ Math.PI * 0.5, 0.0, 0.0 ],
    [ -Math.PI * 0.5, 0.0, 0.0 ]
  ];

  for ( var i = 0; i < 6; i++ ) {
    var rectShape = new THREE.Shape();
    var _width = _size[i][0];
    var _height = _size[i][1];

    rectShape.moveTo( -_width * 0.5, -_height * 0.5 );
    rectShape.lineTo( -_width * 0.5, _height * 0.5 );
    rectShape.lineTo( _width * 0.5, _height * 0.5 );
    rectShape.lineTo( _width * 0.5, -_height * 0.5 );
    rectShape.lineTo( -_width * 0.5, -_height * 0.5 );

    for ( var j = 0; j < this.holes[i].length; j++ ) {
      var _hole_entries = this.holes[i][j];
      var _hole_rect_pts = _createRect( _hole_entries[0], _hole_entries[1], _hole_entries[2], _hole_entries[3] )
      var _holePath = new THREE.Path();

      _holePath.moveTo( -_width * 0.5 + _hole_rect_pts[0][0], -_height * 0.5 + _hole_rect_pts[0][1] );
      _holePath.lineTo( -_width * 0.5 + _hole_rect_pts[1][0], -_height * 0.5 + _hole_rect_pts[1][1] );
      _holePath.lineTo( -_width * 0.5 + _hole_rect_pts[2][0], -_height * 0.5 + _hole_rect_pts[2][1] );
      _holePath.lineTo( -_width * 0.5 + _hole_rect_pts[3][0], -_height * 0.5 + _hole_rect_pts[3][1] );
      _holePath.lineTo( -_width * 0.5 + _hole_rect_pts[0][0], -_height * 0.5 + _hole_rect_pts[0][1] );

      rectShape.holes.push( _holePath );
    }

    var geometry = new THREE.ShapeGeometry( rectShape );
    geometry.computeFaceNormals();
    // var _texture = _textureLoader.load( 'tex/UV_Grid_Sm.jpg' );
    var _texture = _textureLoader.load( tex_name );
    _texture.repeat.set( 0.02, 0.02 );
    _texture.wrapS = THREE.RepeatWrapping;
    _texture.wrapT = THREE.RepeatWrapping;

    var material = new THREE.MeshLambertMaterial( { color: 0xffffff, map: _texture, side: THREE.FrontSide } );
    var mesh = new THREE.Mesh( geometry, material ) ;
    mesh.position.set( _position[i][0] * width * 0.5, _position[i][1] * height * 0.5, _position[i][2] * length * 0.5 );
    mesh.rotation.set( _rotation[i][0], _rotation[i][1], _rotation[i][2] );

    this.object3D.add( mesh );
  }

  this.bbox.setFromObject( this.object3D );

  function _createRect( left, bottom, width, height ) {
    var _ret = [];
    _ret.push( [ left, bottom ] );
    _ret.push( [ left + width, bottom ] );
    _ret.push( [ left + width, bottom + height ] );
    _ret.push( [ left, bottom + height ] );

    return _ret;
  }
}

MazeRoom.prototype.addHole = function ( wall_name, left, bottom, width, height ) {
  this.holes[ getWallId( wall_name ) ].push( [ left, bottom, width, height ] );
}

MazeRoom.prototype.addSideHole = function ( wall_name, left, bottom, width, height ) {
  // if ( wall_name == 'left' ) {
  // 	wall_name = 'right';
  // 	left = this.length - left - width;
  // } else if ( wall_name == 'right' ) {
  // 	wall_name = 'left';
  // 	left = this.length - left - width;
  // } else if ( wall_name == 'front' ) {
  // 	wall_name = 'back';
  // 	left = this.width - left - width;
  // } else if ( wall_name == 'back' ) {
  // 	wall_name = 'front';
  // 	left = this.width - left - width;
  // } else if ( wall_name == 'top' ) {
  // 	wall_name = 'bottom';
  // 	bottom = this.length - bottom - height;
  // } else if ( wall_name == 'bottom' ) {
  // 	wall_name = 'top';
  // 	bottom = this.length - bottom - height;
  // }
  if ( wall_name == 'left' ) {
    wall_name = 'right';
    left = this.length - left - width;
  } else if ( wall_name == 'right' ) {
    wall_name = 'left';
    left = this.length - left - width;
  } else if ( wall_name == 'forward' ) {
    wall_name = 'back';
    left = this.width - left - width;
  } else if ( wall_name == 'back' ) {
    wall_name = 'forward';
    left = this.width - left - width;
  } else if ( wall_name == 'up' ) {
    wall_name = 'down';
    bottom = this.length - bottom - height;
  } else if ( wall_name == 'down' ) {
    wall_name = 'up';
    bottom = this.length - bottom - height;
  }
  this.holes[ getWallId( wall_name ) ].push( [ left, bottom, width, height ] );
}

MazeRoom.prototype.updateRoom = function () {

}

MazeRoom.prototype.addToScene = function ( scene ) {
  scene.add( this.object3D );
}

MazeRoom.prototype.hangTunnel = function ( wall_name, offset, size, length, door_data ) {
  this.addHole( wall_name, offset.x, offset.y, size.x, size.y );

  var _ret_tunnel = new MazeTunnel();

  _ret_tunnel.createTunnel( wall_name, this, offset, size, length, door_data );
  return _ret_tunnel;
}
