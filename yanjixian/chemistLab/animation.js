(function (Chemist) {
    //抬起被倒出物体
    Chemist.readyToDump = function (dumpObj, dumpedObj) {
        var vec3 = dumpObj.position.clone().sub(dumpedObj.position),
            ot = dumpObj.ot.clone().setY(0),
            temp = vec3.clone().negate(),
            alpha = ot.angleTo(temp);

        vec3.normalize().multiplyScalar(  dumpedObj.radius * 1.2 + dumpObj.radius );
        vec3.y =  dumpedObj.height * 2;
        vec3.add(dumpedObj.position);
        dumpObj.position.copy(vec3);
        if(ot.cross(temp).y > 0){

            //         dumpObj.rotation.y += alpha;
            dumpObj.ot.applyAxisAngle(new THREE.Vector3( 0, 1, 0), alpha);
        }  else {

            //        dumpObj.rotation.y += - alpha;
            dumpObj.ot.applyAxisAngle(new THREE.Vector3( 0, 1, 0), -alpha);
        }

        Chemist.moveObj(dumpObj);

    };

    //设置level高度后，倾斜烧杯，生成下落的水柱或固体，返回杯子旋转的参数
    Chemist.beforeDump = function (dumpObj, dumpedObj) {

        //dumpObj 倾斜
        var vec3 = dumpedObj.position.clone().sub(dumpObj.position),
            roAxis = vec3.clone().cross(dumpObj.ot).normalize(),
            roAlpha = - Math.PI / 6; // 倾斜的角度
        dumpObj.rotateOnAxis(roAxis, roAlpha);
        if(dumpObj.restrictVessel){
            dumpObj.restrictVessel.rotateOnAxis(roAxis, roAlpha);
        }
        dumpObj.ot.applyAxisAngle(roAxis, roAlpha);

        if (dumpObj.liquid) {
            dumpObj.liquid.position.y = dumpObj.position.y + dumpObj.ot.y - dumpObj.liquid.geometry.height / 2;
            dumpObj.liquid.position.x += vec3.x / 4;
            dumpObj.liquid.position.z += vec3.z / 4;

            //如果有水，生成水柱
            var pillarPosition = dumpObj.position.clone().add(dumpObj.ot);

                dumpObj.waterPillar = new THREE.Pillar(pillarPosition.clone(), 0.2, new THREE.Color( dumpObj.liquid.detail.color ), 0.2, 1.4);
                dumpObj.waterPillar.type = Chemist.type.pillar;
                Chemist.waterPillar.push(dumpObj.waterPillar);
                Chemist.scene.add(dumpObj.waterPillar);

        }

        //有固体倾斜
        if (dumpObj.wall) {

            dumpObj.wall.rotateOnAxis(roAxis, roAlpha);

            if (dumpObj.solid && dumpObj.solid.length > 0 ) {
                for (var i = dumpObj.solid.length - 1; i >= 0; i--) {
                    dumpObj.solid[i].rotateOnAxis(roAxis, roAlpha);
                }
            }



            dumpObj.action = true;
        }

        return {
            roAxis : roAxis,
            alpha :roAlpha
        };
        
    };


    /**
     *
     * @param dumpObj ： 倾倒的容器
     * @param dumpedObj :倒入的容器
     * @param callback
     */
    Chemist.dumpWater = function (dumpObj, dumpedObj, callback) {
        var height = dumpedObj.waterHeight - dumpedObj.oldWaterHeight, delta = 0.001;
        //生成水面
        if(dumpedObj.liquid && dumpObj.liquid){
            if ( height > 0 ) {
            
                dumpedObj.liquid.position.y += delta;
                
                if ( dumpedObj.liquid.position.y + dumpedObj.liquid.geometry.height / 2 - dumpedObj.position.y >= dumpedObj.waterHeight * dumpedObj.height) {
                    dumpObj.liquid.position.y = dumpObj.position.y + dumpObj.waterHeight * dumpObj.height - dumpObj.liquid.geometry.height / 2;
                    Chemist.mixChemicals(dumpedObj, dumpObj);
                    callback(dumpedObj);
                }
                
            }else {

                callback(dumpedObj);
            }
            
        }else{
            if (dumpObj.liquid) {
                //向空杯中倒，先生成液体
                dumpedObj.liquid = Chemist.addLiquid(dumpedObj, dumpObj.liquid.detail.key, 0, true);
            }else {
                callback(dumpedObj);
            }
        }
    };

    /**
     *
     * @param dumpObj
     * @param dumpedObj
     * @param callback
     */
    Chemist.dumpSolid = function (dumpObj, dumpedObj, callback) {
        var height = dumpedObj.solidHeight - dumpedObj.oldSolidHeight, delta = 0.1;

        //currentNum：这次已经加的
        if(dumpedObj.currentNum === 0){
            dumpedObj.oldSolidCount = dumpedObj.solidCount;
            //这次需要加的
            dumpedObj.solidCount = Chemist.heightToNum(dumpedObj, height);

            //dumpedObj生成wall，和固体数组,
            dumpedObj.solid = Chemist.addSolid(dumpedObj, dumpObj.solid.detail.key,  height, true);
        }

        if (dumpedObj.solid && dumpObj.solid) {
            if ( height > 0) {

                dumpedObj.currentNum += delta;
                if(  dumpedObj.currentNum >= dumpedObj.solidCount){
                    Chemist.mixChemicals(dumpedObj, dumpObj);
                    Chemist.deletePiece(dumpObj, dumpedObj.solidCount);
                    dumpedObj.currentNum = 0;
                    dumpedObj.solidCount +=  dumpedObj.oldSolidCount;
                    callback(dumpedObj);
                }

            }else{
                callback(dumpedObj);
            }
        } else if (!dumpObj.solid) {

                 callback(dumpedObj);

        }

    };

    // dumpedObj是导入的杯子，dumpedObj.target是导出的杯子
    Chemist.dumpOver = function (dumpedObj) {
        dumpedObj.target.position.y = Chemist.beakerPosition.y;
        if(dumpedObj.args) {
            dumpedObj.target.rotateOnAxis(dumpedObj.args.roAxis, -dumpedObj.args.alpha);
            dumpedObj.target.ot.applyAxisAngle(dumpedObj.args.roAxis, -dumpedObj.args.alpha);

            if (dumpedObj.target.wall) {
                dumpedObj.target.wall.rotateOnAxis(dumpedObj.args.roAxis, -dumpedObj.args.alpha);
                if (dumpedObj.target.solid && dumpedObj.target.solid.length > 0 ) {
                    for (var i = dumpedObj.target.solid.length - 1; i >= 0; i--) {
                        dumpedObj.target.solid[i].rotateOnAxis(dumpedObj.args.roAxis, -dumpedObj.args.alpha);
                    }
                }
            }
        }

        if( dumpedObj.target.liquid ) {
            if (dumpedObj.target.waterHeight > 0 ) {
                dumpedObj.target.restrictVessel.position.copy(dumpedObj.target.position);
                dumpedObj.target.restrictVessel.rotateOnAxis(dumpedObj.args.roAxis, -dumpedObj.args.alpha);
                dumpedObj.target.liquid.position.copy(dumpedObj.target.position);
                dumpedObj.target.liquid.position.y += dumpedObj.target.waterHeight  * dumpedObj.target.height - dumpedObj.target.liquid.geometry.height / 2;
            }else {
                Chemist.restrictScene.remove(dumpedObj.target.restrictVessel);
                dumpedObj.target.restrictVessel = null;
                Chemist.waterScene.remove(dumpedObj.target.liquid);
                dumpedObj.target.liquid = null;
            }
        }


        if (dumpedObj.target.waterPillar) {
            dumpedObj.target.waterPillar.args.position.copy(Chemist.hiddenPosition);
            Chemist.scene.remove(dumpedObj.target.waterPillar);
            Chemist.waterPillar.remove(dumpedObj.target.waterPillar);
            dumpedObj.target.waterPillar = null;
        }

        Chemist.moveObj(dumpedObj.target);

        //取消联系
        dumpedObj.target.intersectVessel = null;
        dumpedObj.target = null;
        dumpedObj.args = null;
        dumpedObj.hasSetLevel = false;
        dumpedObj = null;

    };

     //生成移动的水平面标尺
    Chemist.addScaleLevel = function (vessel) {
        var  radius = vessel.radius,
            center = vessel.position,
            material =  new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } ),
            geometry = new THREE.CircleGeometry( radius, 20, 0, Math.PI * 2 ),
            scaleLevel = new THREE.Mesh( geometry, material );
        scaleLevel.position.copy(center);
        scaleLevel.rotation.x = - Math.PI / 2 ;
        scaleLevel.type = Chemist.type.virtual;
        scaleLevel.status = [Chemist.status.normal];
        Chemist.scene.add(scaleLevel);
        return scaleLevel;
    };

    //反应冒泡
    Chemist.addBubbles = function (vessel) {
        var bubbles = new THREE.Object3D(), i = 10, r = 0.03, bubble, ratio = 0.75, height = vessel.waterHeight * vessel.height * ratio,
            material = new THREE.MeshPhongMaterial({color : 0xffffff, depthTest: false}),
            random = Chemist.utils.getRandom ;
            material.transparent = true;
            material.opacity = 0.5;
            material.refractionRatio = 0.9;
        if (height <= 0) {
            return ;
        }
         for (; i >= 0; i--) {
             bubble = new THREE.Mesh(new THREE.SphereGeometry(r), material);
             bubbles.add(bubble);
             bubble.position.set(random(-vessel.radius * ratio, vessel.radius* ratio), random(0, height), random(-vessel.radius* ratio, vessel.radius* ratio));

             var onComplete = (function(){
                 var temp = bubble.position.clone();
                 return function () {
                     this.copy(temp);
                 };
             })();
             bubble.tween = Chemist.utils.moveTo(bubble.position, {y : height}, null, null, onComplete, true);
         }
         bubbles.position.copy(vessel.position);

        vessel.dispatchEvent({type:"checkGas"});

        Chemist.scene.add(bubbles);
        return bubbles;
    };

    //反应生成固体(把一些tube，用噪声函数处理成不规则固体)
    Chemist.addSediment = function (vessel, color) {
        var ratio = 0.75,
            height = vessel.waterHeight * vessel.height * ratio,
            segments = 200,
            radius = 1,
            radiusSegments = 12,
            geometry , material,
            sediment;
        if(height <=0) {
            return ;
        }
        geometry = new THREE.TubeGeometry(new THREE.Curves.GrannyKnot(), segments, radius, radiusSegments);
        Chemist.utils.randomize(geometry);
        material = new THREE.MeshBasicMaterial({
            color: color,
            opacity: 0.8,
            transparent: true,
            depthTest: false
        });
        sediment = new THREE.Mesh(geometry, material);
        sediment.position.copy(vessel.position);

        geometry.computeBoundingBox();
        var vec3 = geometry.boundingBox.size(),
            scale = vessel.radius / Math.max(vec3.x, vec3.y, vec3.z);
        sediment.scale.set(scale, scale, scale );

        sediment.height = vec3.y * scale;
        sediment.position.y += sediment.height * 2 / 3 ;

        Chemist.scene.add(sediment);
        return sediment;
    };


})(Chemist);