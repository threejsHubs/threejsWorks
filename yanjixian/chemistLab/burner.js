/**
 * Burner  酒精灯
 * @param position
 * @param callback
 * @constructor
 */
Chemist.Burner = function (position, callback) {
     var burner = null, scale = 0.008;
     
    Chemist.objLoader.load("obj/burner.obj", function (objects) {
        burner = objects.children[0];

        burner.material.transparent = true;
        burner.material.opacity = 0.3;
        burner.material.refractionRatio = 0.85;
        burner.position.copy(position);
        burner.scale.set(scale, scale, scale);
        burner.castShadow = true;

        Chemist.Base.call(burner, {
            type: Chemist.type.instrument,
            canFire: true,
            scale: scale,
            direct: new THREE.Vector3(0, 1, 0),
            detail: Chemist.Equips.burner
        });

        Chemist.scene.add(burner);
        Chemist.objects.push(burner);

        callback && callback(burner);
    });
};

