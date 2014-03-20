/**
 * 试管
 * @param position
 * @param callback
 * @constructor
 */
Chemist.TestTube = function (position, callback) {
     var tube = null;
     
    Chemist.objLoader.load("obj/testTube.obj", function (objects) {
        tube = objects.children[0];

        tube.material.transparent = true;
        tube.material.opacity = 0.3;
        tube.material.refractionRatio = 0.85;
        tube.position.copy(position);
        tube.castShadow = true;

        Chemist.Base.call(tube, {
            type: Chemist.type.vessel,
            ot: new THREE.Vector3(0.09, 1.52, 0),
            detail: Chemist.Equips.testTube
        });

        Chemist.scene.add(tube);
        Chemist.objects.push(tube);

        callback && callback(tube);
    });
};

