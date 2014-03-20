
/**
 *
 * Stick代表棍状物体
 *
 * position : 初始位置
 * stuff : 原料
 *
 * transparent : 是否为玻璃棒
 **/

Chemist.Stick = function (position, scale, stuff, name, transparent) {
     var stick, material, geometry,
         length = 2, radius = 0.08;

    geometry = new THREE.CylinderGeometry( radius, radius, length);
    material = new THREE.MeshPhongMaterial({color : stuff.color, ambient : stuff.color});
    stick = new THREE.Mesh(geometry , material );
    stick.position.copy(position);
    stick.scale.multiplyScalar(scale);
    //玻璃棒
    if (transparent) {
        stick.material.transparent = true;
        stick.material.opacity = 0.3;
        stick.material.refractionRatio = 0.85;
        stick.stuff = $.extend(stuff, {name:"glass"});
    }
    stick.castShadow = true;

    Chemist.Base.call(stick, {
        type: Chemist.type.tool,
        scale: scale,
        direct: new THREE.Vector3(0, 1, 0),
        canFire: true,
        name: name
    });

    stick.length = length * scale;

    stick.stuff = stuff;

    Chemist.scene.add(stick);
    Chemist.objects.push(stick);

    return stick;

};

