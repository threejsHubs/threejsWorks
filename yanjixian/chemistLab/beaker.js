/**
 * 烧杯
 * @param position
 * @param callback
 * @constructor
 */
Chemist.Beaker = function (position, callback) {
     var beaker = null;
     
    Chemist.objLoader.load("obj/beaker.obj", function (objects) {
        var scale = 0.5;

        beaker = objects.children[0];

        beaker.material.transparent = true;
        beaker.material.opacity = 0.3;
        beaker.material.refractionRatio = 0.85;
        beaker.position.copy(position);
        beaker.scale.set(scale, scale, scale);
        beaker.castShadow = true;

        Chemist.Base.call(beaker, {
            type: Chemist.type.vessel,
            ot: new THREE.Vector3(0.74, 1.52, 0),
            scale: scale,
            detail: Chemist.Equips.beaker
        });

        Chemist.scene.add(beaker);
        Chemist.objects.push(beaker);

        beaker.addEventListener("checkGas", function (event) {
            var len = this.pipes.length, i, pipe, otherLink;
                for (i = len -1 ; i >= 0; i--){
                    pipe = this.pipes[i];
                    otherLink = pipe.anotherSide.link ;
                    if(this.gas && otherLink) {
                        if (otherLink.gas) {
                            if(!_.isEqual(otherLink.gas.detail.ingredient, this.gas.detail.ingredient)){
                                otherLink.gas.detail.ingredient = _.union(otherLink.gas.detail.ingredient, this.gas.detail.ingredient);
                            }
                        }else{

                            otherLink.gas = {};
                            otherLink.gas.detail = Chemist.clone(this.gas.detail);
                            otherLink.gas.bubbles = Chemist.addBubbles(otherLink);

                        }
                    }
                }

        });

        callback && callback(beaker);
    });
};

