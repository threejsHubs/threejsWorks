/**
 * 铁架台
 *
 */

(function (global) {

     Chemist.IronSupport = function (position, callback) {
        var iron = null, scale = 0.03, path = "obj/ironSupport/", offset = new THREE.Vector3();

        Chemist.OTLoader.load(path+"dizuo.obj", path + "dizuo.mtl", function (objects) {

            var i,len;
            for (i = 0,len = objects.children.length; i < len; i++) {
                if ( !iron ) {
                    iron = objects.children[1];
                }else{
                    iron.add(objects.children[2]);  //加入beaker后children中的会删除？
                }
            }

            offset.subVectors(position, iron.position);
            iron.position.copy(position);
            iron.scale.set(scale, scale, scale);
            iron.castShadow = true;

            Chemist.Base.call(iron, {
                type: Chemist.type.instrument,
                scale: scale,
                detail: Chemist.Equips.ironSupport
            });

            iron.burnerPosition = new THREE.Vector3(35.29, 5.152, 0).multiplyScalar(scale);
            iron.beakerPosition = new THREE.Vector3(35.39, 39.60, 0).multiplyScalar(scale).add(new THREE.Vector3(0,0.1,0));
            iron.tubePosition = new THREE.Vector3(39.52, 76.535,-3).multiplyScalar(scale).add(new THREE.Vector3(0,-1,0));

            iron.addEventListener("move", function (e) {
                this.position.copy(e.pos);
                this.bar.position.copy(e.pos).add(iron.bar.offset);
                this.ring.position.copy(e.pos).add(iron.ring.offset);
                this.clamp.position.copy(e.pos).add(iron.clamp.offset);

                if (this.burner) {
                    Chemist.moveObj(this.burner, this.position.clone().add(this.burnerPosition));
                }

                if (this.beaker) {
                    Chemist.moveObj(this.beaker, this.position.clone().add(this.beakerPosition));
                }

                if (this.testTube) {
                    Chemist.moveObj(this.testTube, this.position.clone().add(this.tubePosition));
                }

            });
            iron.addEventListener("delete", function (e) {
                Chemist.scene.remove(this);
                Chemist.scene.remove(this.bar);
                Chemist.scene.remove(this.ring);
                Chemist.scene.remove(this.clamp);

                Chemist.objects.remove(this);
                Chemist.objects.remove(this.bar);

                if (this.burner) {
                    Chemist.removeObj(this.burner);
                    this.burner = null;
                }
                if (this.beaker) {
                    Chemist.removeObj(this.beaker);
                    this.beaker = null;
                }
                if (this.testTube)
                {
                    Chemist.removeObj(this.testTube);
                    this.testTube = null;
                }


                this.bar = null;
                this.ring = null;
                this.clamp = null;
            });


            Chemist.scene.add(iron);
            Chemist.objects.push(iron);

            //竖棍
            iron.bar = objects.children[0];
            iron.bar.position.add(offset);
            iron.bar.scale.set(scale, scale, scale);
            iron.bar.castShadow = true;
            iron.bar.offset = iron.bar.position.clone().sub(iron.position);
            iron.bar.base = iron;

            Chemist.Base.call(iron.bar, {
                type: Chemist.type.instrument,
                scale: scale,
                detail: Chemist.Equips.ironSupport,
                name: "ironSupport_bar"
            });

            iron.bar.addEventListener("move", function(e) {

                var b = this.base;
                this.position.copy(e.pos);
                b.position.subVectors(this.position, this.offset);
                b.ring.position.addVectors(b.position, b.ring.offset);
                b.clamp.position.addVectors(b.position, b.clamp.offset);

                if (b.burner) {
                    Chemist.moveObj(b.burner, b.position.clone().add(b.burnerPosition));
                }

                if (b.beaker) {
                    Chemist.moveObj(b.beaker, b.position.clone().add(b.beakerPosition));
                }

                if (b.testTube) {
                    Chemist.moveObj(b.testTube, b.position.clone().add(b.tubePosition));
                }

            });
            iron.bar.addEventListener("delete", function () {
                var b = this.base;
                Chemist.scene.remove(this);
                Chemist.scene.remove(b);
                Chemist.scene.remove(b.ring);
                Chemist.scene.remove(b.clamp);

                Chemist.objects.remove(this);
                Chemist.objects.remove(b);

                if (b.burner) {
                    Chemist.removeObj(b.burner);
                    b.burner = null;
                }
                if (b.beaker) {
                    Chemist.removeObj(b.beaker);
                    b.beaker = null;
                }
                if (b.testTube) {
                    Chemist.removeObj(b.testTube);
                    b.testTube = null;
                }

                b.bar = null;
                b.ring = null;
                b.clamp = null;
            });

            Chemist.scene.add(iron.bar);
            Chemist.objects.push(iron.bar);

            var onMove = function (e) {

            };

            //托环
            Chemist.objLoader.load(path+"zaiju.obj", function(objects){

                iron.ring = objects.children[0];
                iron.ring.material = new THREE.MeshPhongMaterial({color: 0x787B82, ambient: 0x47494D });
                iron.ring.position.add(offset).add(new THREE.Vector3(0,0.1,0));
                iron.ring.scale.set(scale, scale, scale);
                iron.ring.castShadow = true;
                iron.ring.offset = iron.ring.position.clone().sub(iron.position) ;
                iron.ring.base = iron;

                Chemist.Base.call(iron.ring, {
                    type: Chemist.type.instrument,
                    scale: scale,
                    name: "ironSupport_ring"
                });

                iron.ring.addEventListener("move", onMove);

                Chemist.scene.add(iron.ring);
            //    Chemist.objects.push(iron.ring);
            });

            //夹子
            Chemist.objLoader.load(path+"qianzi.obj", function(objects){

                iron.clamp = objects.children[0];
                iron.clamp.material = new THREE.MeshPhongMaterial({color: 0x787B82, ambient: 0x47494D });
                iron.clamp.position.add(offset);
                iron.clamp.scale.set(scale, scale, scale);
                iron.clamp.castShadow = true;
                iron.clamp.offset = iron.clamp.position.clone().sub(iron.position);
                iron.clamp.visible = false;
                iron.clamp.base = iron;

                Chemist.Base.call(iron.clamp, {
                    type: Chemist.type.instrument,
                    scale: scale,
                    name: "ironSupport_clamp"
                });

                iron.clamp.addEventListener("move", onMove);

                Chemist.scene.add(iron.clamp);
            //    Chemist.objects.push(iron.clamp);
            });


            callback && callback(iron);

        });

    };

})(this);