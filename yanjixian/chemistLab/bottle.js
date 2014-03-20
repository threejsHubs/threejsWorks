

Chemist.Bottle = function (position, callback) {
     var bottle = null, scale = 0.01;
     
    Chemist.objLoader.load("obj/bottle.obj", function (objects) {
        bottle = objects.children[0];

        bottle.material.transparent = true;
        bottle.material.opacity = 0.3;
        bottle.material.refractionRatio = 0.85;
        bottle.position.copy(position);
        bottle.scale.set(scale, scale, scale);
        bottle.castShadow = true;

        Chemist.Base.call(bottle, {
            type: Chemist.type.container,
            scale: scale,
            ot: new THREE.Vector3(17.97, 88.5, 0),
            name: "bottle"
        });

        Chemist.scene.add(bottle);
        Chemist.objects.push(bottle);

        callback && callback(bottle);
    });
};

