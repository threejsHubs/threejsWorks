/**
 * 
 * 
 * params 为参数对象
 * 包括 
 * img : 图像路径
 *
**/

Chemist.Platform = function (params) {
    var plane, geometry, material, 
    width = 18, 
    height = 12,
    params = params || {},
    color = params.color || new THREE.Color( 0x6699FF ),
    map = params.img && THREE.ImageUtils.loadTexture(params.img);
   if (map !== undefined){
        map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
        map.anisotropy = 16;
        material = new THREE.MeshBasicMaterial( {
            map : map
        } );
    } else {
        material = new THREE.MeshBasicMaterial( {
            color : color.getHex()
        } );
    }
    geometry = new THREE.PlaneGeometry(width, height, 16, 16);
    plane = new THREE.Mesh(geometry, material);
    plane.position.copy(Chemist.center);
    plane.rotation.x = - Math.PI / 2;
    plane.castShadow = true;
    plane.receiveShadow = true;
    
    plane.type = Chemist.type.platform;
    plane.status = Chemist.status.normal;
    
    return plane;
};