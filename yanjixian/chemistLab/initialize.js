/**
 * 
 * 
 * 
**/
Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
var Chemist = {

        Version : 0.1,
        
        type : {
            vessel : "vessel",
            container : "container",
            platform : "platform",
            virtual : "virtual",
            instrument : "instrument",  //铁架台、酒精灯。。。
            tool : "tool",  //火柴、ph纸、温度计等
            pillar : "pillar"   //水柱
        },
        
        status : {
            normal : "normal",
            moving : "moving",
            pouring : "pouring",
            influxing : "influxing",
            burning : "burning",
            linking : "linking",
            reacting : "reacting"
        },

        utils : {},  //工具集方法对象

        container : document.getElementById("container"),
        mouse : new THREE.Vector2(),  // [-1, 1]
        offset : new THREE.Vector3(), //物体位置与选中点的偏移量
        objects : [],  //会被鼠标选择的东西
        virtualPlaneH : null,
        virtualPlaneV : null,
        hovered : null,
        selected : null,
        windowWidth : window.innerWidth,
		windowHeight : window.innerHeight,
        canvasWidth : window.innerWidth,
        canvasHeight : window.innerHeight,

        camera : (function () {
           var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
           	camera.position.set(0, 5, 15);
            camera.lookAt(new THREE.Vector3(0,0,0));
            return camera;
        })(),
        controls : null,
        scene : new Physijs.Scene({reportSize:50, broadphase:"dynamic", fixedTimeStep: 1/ 60}),
        restrictScene : new THREE.Scene(),
        waterScene : new THREE.Scene(),
        renderer : new THREE.WebGLRenderer(),
        composer : null,
        projector : new THREE.Projector(),
        objLoader : new THREE.OBJLoader(),
        OTLoader : new THREE.OBJMTLLoader(),
        loadQueue : new createjs.LoadQueue(true),



        ambientLient : new THREE.AmbientLight(0x9C9C9C),
        directionalLight : (function () {
            var light = new THREE.DirectionalLight(0xffeedd, 0.8);
            light.position.set(0, 1, 3);
            return light;
        })(),
        spotLight : (function () {
            var light = new THREE.SpotLight( 0xffffff );
            light.position.set( 0, 20, 0 );      
 //         light.shadowCameraVisible = true;   //调试用
            light.castShadow = true; 
            light.shadowCameraNear = 1;
            light.shadowCameraFar = 5000;
            light.shadowCameraFov = 48;
            light.shadowDarkness = 0.5;
            light.shadowMapWidth = 2048;
            light.shadowMapHeight = 2048;
            return light;
        })(),
        
        center : new THREE.Vector3(0, -1, 0),
        beakerPosition : new THREE.Vector3(0, -1 + 0.03, 0),
        stickPosition : new THREE.Vector3(0, - 0.2, 0),
        pipePosition : new THREE.Vector3(0, 0, 0),
        hiddenPosition : new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
        waterPillar : [], //所有水柱
        plane : null,
        target: null,
        clock: new THREE.Clock(),

        init : function (callback) {

            this.controls = this.createControls(this.camera);

            this.canvasWidth = this.windowWidth;
            this.canvasHeight = this.windowHeight;
            this.onWindowResize();

            this.scene.add(this.ambientLient);
   //        this.scene.add(this.directionalLight);
            this.scene.add(this.spotLight);

            this.scene.setGravity(new THREE.Vector3( 0, -10, 0 ));
            this.scene.addEventListener(
                'update',
                function() {
                    Chemist.scene.simulate( undefined, 2 ); //场景刷新5次，最少模拟1次
                }
            );

            this.renderer.shadowMapEnabled = true;
			this.renderer.shadowMapType = THREE.PCFShadowMap;
            this.renderer.autoClear = false;
            this.renderer.setSize(this.canvasWidth, this.canvasHeight);
            this.container.appendChild(this.renderer.domElement);
          
            var rtParams = {
                minFilter : THREE.LinearFilter,
                magFilter : THREE.LinearFilter,
                format : THREE.RGBFormat,
                stencilBuffer : true
            };
            
            this.composer = new THREE.EffectComposer(this.renderer, new THREE.WebGLRenderTarget(this.windowWidth, this.windowHeight, rtParams));

            var virtualPlaneH = this.virtualPlaneH = new Chemist.Platform();
            virtualPlaneH.scale.set(20,30,1);
            virtualPlaneH.visible = false;
            virtualPlaneH.material.side = THREE.DoubleSide;
            virtualPlaneH.type = this.type.virtual;
            this.scene.add(virtualPlaneH);

            var virtualPlaneV = this.virtualPlaneV = new Chemist.Platform();
            virtualPlaneV.position.set(0, 0, 0);
            virtualPlaneV.rotation.x = 0  ;
            virtualPlaneV.scale.set(3,3,1);
            virtualPlaneV.material.side = THREE.DoubleSide;
            virtualPlaneV.visible = false;
            virtualPlaneH.type = this.type.virtual;
            this.scene.add(virtualPlaneV);

            if (callback) {
                callback.call(this);
            }
        },
        
        createControls : function (camera) {
				var controls = new THREE.ColumnControls(camera);
				//旋转速度
				controls.rotateSpeed = 0.8;
				//变焦速度
				controls.zoomSpeed = 1.2;
				//平移速度
				controls.panSpeed = 0.8;
				//是否不变焦
				controls.noZoom = false;
				//是否不平移,鼠标右键平移
				controls.noPan = false;
				//可能是惯性 true没有惯性
				controls.staticMoving = true;
				//动态阻尼系数 就是灵敏度
				controls.dynamicDampingFactor = 0.3;
                //controls.noRotate = true;
				return controls;
		},
        
        postProcess : function () {
            var render = new THREE.RenderPass(this.scene, this.camera);
            var waterRender = new THREE.RenderPass(this.waterScene, this.camera);
            waterRender.clear = false;
            var clearMask = new THREE.ClearMaskPass();
            var renderMask = new THREE.MaskPass(this.restrictScene, this.camera);
            var copyPass = new THREE.ShaderPass(THREE.CopyShader);
            copyPass.renderToScreen = true;
          
            this.composer.addPass(render);
            this.composer.addPass(renderMask);
            this.composer.addPass(waterRender);
            this.composer.addPass(clearMask);
            this.composer.addPass(copyPass);
        },

        // 每次渲染前执行， 进行一些循环工作
        beforeRender : function () {
            var delta = Chemist.clock.getDelta(), i, len, temp;

            if ( (len=Chemist.waterPillar.length) > 0) {
                for(i=len-1; i>=0;i-- ){
                    temp = Chemist.waterPillar[i];
                    temp.geometry.verticesNeedUpdate = true;
                    temp.geometry.colorsNeedUpdate = true;
                    temp.material.needUpdates = true;
                }
            }

            //运动轨迹动画
            TWEEN.update();

            //fire动画
            for (i=0, len = Chemist.objects.length; i<len; i++ ) {
                if (Chemist.objects[i].fire) {
                    Chemist.objects[i].fire.time.value += delta;
                }
            }

            for ( i = 0, len = Chemist.objects.length; i < len; i++) {
                //Chemist.objects的元素变化后，vessel就有可能是undefined
                var vessel = Chemist.objects[i];

                if (vessel && vessel.hasSetLevel && vessel.getStatus() === Chemist.status.influxing && vessel.target.type === Chemist.type.vessel) {

                    //倾倒液体
                     //倾倒的杯子恢复原状,vessel是倒入的杯子，vessel.target是倒出的杯子
                    if (vessel.target && vessel.target.liquid) {

                        Chemist.dumpWater(vessel.target, vessel, function (dumpedObj) {

                            dumpedObj.status.pop();
                            dumpedObj.target.status.pop();

                            Chemist.dumpOver(dumpedObj);

                        });
                    }

                    if(vessel.target && vessel.target.solid) {
                    //倾倒固体
                        Chemist.dumpSolid(vessel.target, vessel, function (dumpedObj) {

                            //倾倒的杯子恢复原状,vessel是倒入的杯子，vessel.target是导出的杯子
                            dumpedObj.status.pop();
                            dumpedObj.target.status.pop();

                            Chemist.dumpOver(dumpedObj);


                        });
                    }

                    if(vessel.target && !vessel.target.liquid && !vessel.target.solid) {
                        //倾倒的空杯子恢复原状
                        vessel.status.pop();
                        vessel.target.status.pop();

                        Chemist.dumpOver(vessel);
                    }

                }else if ( vessel && vessel.hasSetLevel && vessel.getStatus() === Chemist.status.influxing && vessel.target.type === Chemist.type.container ) {

                    //从罐子中取液体
                    if (vessel.target.liquid) {
                        Chemist.dumpWater(vessel.target, vessel, function (dumpedObj) {

                            //倾倒的罐子直接移除
                            dumpedObj.status.pop();
                            dumpedObj.target.status.pop();

                            dumpedObj.target.waterPillar.args.position.copy(Chemist.hiddenPosition);
                            Chemist.scene.remove(dumpedObj.target.waterPillar);
                            Chemist.waterPillar.remove(dumpedObj.target.waterPillar);
                            dumpedObj.target.waterPillar = null;

                            Chemist.removeObj(dumpedObj.target);
                            //取消联系
                            dumpedObj.target = null;
                            dumpedObj.hasSetLevel = false;
                            dumpedObj.args = null;

                        });
                    }else {

                        //从罐子中取固体
                        Chemist.dumpSolid(vessel.target, vessel, function (dumpedObj) {

                            //倾倒的罐子直接移除
                            dumpedObj.status.pop();
                            dumpedObj.target.status.pop();

                            Chemist.removeObj(dumpedObj.target);
                            //取消联系
                            dumpedObj.target = null;
                            dumpedObj.hasSetLevel = false;
                            dumpedObj.args = null;

                        });
                    }

                }
            }



            
            //反应
            for ( i = 0, len = Chemist.objects.length; i < len; i++) {
                  vessel = Chemist.objects[i], key = "", tempArray=[];
                //监测反应
                if (vessel.type === Chemist.type.vessel) {

                    if (vessel.liquid && vessel.getStatus() !== Chemist.status.reacting) {
                        tempArray = tempArray.concat(vessel.liquid.detail.ingredient);
                    }
                    if(vessel.solid && vessel.solid.length>0 && vessel.getStatus !== Chemist.status.reacting) {
                        tempArray =  tempArray.concat(vessel.solid.detail.ingredient);
                    }
                    if(vessel.gas && vessel.getStatus() !== Chemist.status.reacting) {
                        tempArray = tempArray.concat(vessel.gas.detail.ingredient);
                    }
                    if(tempArray.length>0){
                        key = _.uniq(tempArray.sort(), true).join("+");
                    }
                    if ( key.length > 0 && Chemist.Reactions[key] && Chemist.Reactions[key].condition(vessel)) {
                        vessel.reaction = Chemist.clone(Chemist.Reactions[key]);
                        vessel.status.push(Chemist.status.reacting);
                    }


                    //发生发应
                    if (vessel.getStatus() === Chemist.status.reacting) {
                        vessel.reaction.phenomenon(vessel , function (result) {

                            if (result.target.liquid) {
                                result.target.liquid.detail.ingredient = result.concat();
                            }
                            if (result.target.solid) {
                                result.target.solid.detail.ingredient = result.concat();
                            }
                            result.target.status.pop();

                            $("#info").fadeOut(5000);
                        });
                        if (vessel.reaction.delta === 1) {
                            vessel.reaction.info();
                        }
                        vessel.reaction.delta += 1; //反应速度

                    }

                }
            }

            //set physiobj __dirtyPosition or __dirtyRotation flag to true
            for (i=0,len = Chemist.objects.length; i<len; i++) {
                temp = Chemist.objects[i];

                 //修正位置
                if(temp.wall && !temp.position.equals(temp.wall.position) ){
                    var originalPos = temp.wall.position.clone();
                    temp.wall.position.copy(temp.position);
                    if (temp.solid && temp.solid.length>0) {
                        for (var j = temp.solid.length-1; j >= 0; j--) {
                            temp.solid[j].dispatchEvent('calculateOffset',{ vPosition: originalPos});
                            temp.solid[j].position.addVectors(temp.position, temp.solid[j].offset);
                        }
                    }
                    temp.action = true;
                }

                if ( temp.action === true) {
                    if (temp instanceof Physijs.Mesh) {
                        temp.__dirtyPosition = true;
                        temp.__dirtyRotation = true;
                    }
                    if (temp.wall) {
                        temp.wall.__dirtyPosition = true;
                        temp.wall.__dirtyRotation = true;
                        for (j = temp.wall.children.length-1; j>=0; j--) {
                            temp.wall.children[j].__dirtyPosition = true;
                            temp.wall.children[j].__dirtyRotation = true;
                        }
                    }
                    if (temp.solid &&  temp.solid.length > 0) {
                        for (j = temp.solid.length-1; j >= 0; j--) {
                            temp.solid[j].__dirtyPosition = true;
                            temp.solid[j].__dirtyRotation = true;
                        }
                    }
                    temp.action = false;
                }
            }
        },
        
        render : function () {
            Chemist.beforeRender();
            Chemist.controls.update();
            Chemist.scene.simulate();
            Chemist.renderer.clear();
            Chemist.renderer.render(Chemist.scene, Chemist.camera);
        },
        
        composerRender : function () {
            Chemist.beforeRender();
            Chemist.controls.update();
            Chemist.scene.simulate();
            Chemist.renderer.clear();
            Chemist.composer.render();
        },
        
        animate : function (render) {
            
            render();
            
            requestAnimationFrame(function () {
                return Chemist.animate(render);
                });
        },
        
        onWindowResize : function () {

            Chemist.windowWidth = window.innerWidth;
            Chemist.windowHeight = window.innerHeight;

            Chemist.canvasWidth = Chemist.windowWidth;
            Chemist.canvasHeight = Chemist.windowHeight;

			Chemist.camera.aspect = Chemist.canvasWidth / Chemist.canvasHeight;
			Chemist.camera.updateProjectionMatrix();

			Chemist.renderer.setSize( Chemist.canvasWidth , Chemist.canvasHeight );

		},
        
        getIntersect : function (obj) {
            var point = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5),
            raycaster = this.projector.pickingRay(point, this.camera),
            intersect  = raycaster.intersectObject(obj);
            return intersect[0];
        },
        
        getIntersects : function () {
            var point = new THREE.Vector3(this.mouse.x, this.mouse.y, 0),
            raycaster = this.projector.pickingRay(point, this.camera);
            return raycaster.intersectObjects(this.objects);
        },
        
        isIntersect : function (obj) {
            var object = this.getIntersect(obj) && this.getIntersect(obj).object, bool = false,
            intersects = this.getIntersects();
            if (object === obj) {
                bool = (intersects[0].object === object);
            }
            return bool;
        },
        
        unprojectPoint : function (vec2, z) {
            var vec3 = new THREE.Vector3(vec2.x, vec2.y, z);
            this.projector.unprojectVector(vec3, this.camera);
            return vec3;
        },
        
        
        verdictPlaneMove : function () {
            if (!Chemist.controls){
                return;
            }
            if (Chemist.isIntersect(Chemist.plane)) {
                Chemist.controls.noRotate = false;
                Chemist.controls.noPan = false;
                return true;
            }else{
                Chemist.controls.noRotate = true;
                Chemist.controls.noPan = true;
                return false;
            }
        },
        
        //判断两容器是否重叠,AABB包围盒
        isSuperposition : function (objA, objB) {
            objA.geometry.computeBoundingBox();
            objB.geometry.computeBoundingBox();
            var boxA = objA.geometry.boundingBox,
                boxB = objB.geometry.boundingBox,
                boxa = boxA.clone().applyMatrix4(objA.matrixWorld),
                boxb = boxB.clone().applyMatrix4(objB.matrixWorld);


            //有火焰的情况
            if (objA.fire) {
                var fire = objA.fire,
                    fireBox = null,
                    i = 0;
                for (i=0; i < fire.children.length; i++) {
                    fire.children[i].geometry.computeBoundingBox();
                    fireBox = fire.children[i].geometry.boundingBox.clone().applyMatrix4(fire.matrixWorld);
                    boxa.expandByPoint(fireBox.min);
                    boxa.expandByPoint(fireBox.max);
                }
            }
            if (objB.fire) {
                 fire = objB.fire;
                    fireBox = null;
                for (i=0; i < fire.children.length; i++) {
                    fire.children[i].geometry.computeBoundingBox();
                    fireBox = fire.children[i].geometry.boundingBox.clone().applyMatrix4(fire.matrixWorld);
                    boxb.expandByPoint(fireBox.min);
                    boxb.expandByPoint(fireBox.max);
                }
            }

            return boxa.isIntersectionBox(boxb);    
        },

    /**
     * 得到与obj重叠的元素,target保留obj
     * @param obj
     * @returns {*}
     */
        getIntersectVessel : function (obj) {
            var result = null, i, len, temp;
            for (i=0,len=Chemist.objects.length; i<len; i++) {
                temp = Chemist.objects[i];
                if ( Chemist.isSuperposition(obj, temp) ) {
                    result = temp;
                    if (result.type === Chemist.type.platform || result === obj || result.type === Chemist.type.pillar){
                        result = null;
                        continue;
                    }
                    if(obj.body === result || obj.left === result || obj.right === result){
                        result = null;
                        continue;
                    }
                    result.target = obj;      //保留与它相交的元素
                    return result;
                }
            }
            return result;
        },
        
        isDiscard : function (obj) {
            var plane = Chemist.plane,
                box,
            pos = new THREE.Vector3(0, 5, 0);
            plane.geometry.computeBoundingBox();
            box = plane.geometry.boundingBox.clone().applyMatrix4(plane.matrixWorld);
            box.addPoint(pos);
            return ! box.containsPoint(obj.position);
        },
        
        getBoundingBox : function (obj) {
            obj.geometry.computeBoundingBox();
            return obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
        },
        
        //液体高度【0,1】，liquid为液体名称, reset为true时不重置高度
        addLiquid : function (vessel, liquid, height, reset) {
            var water = Chemist.Chemicals.liquids[liquid],
                waterHeight =( height === undefined ? vessel.waterHeight :  height ) * vessel.height,
                waterMaterial = new THREE.MeshBasicMaterial({
                    color : water.color || 0x5E89CB,		
                    side : THREE.FrontSide,
                    transparent : true,
                    opacity : 0.8,
                    depthTest:true
                }),
                waterCubeLength = vessel.radius * 2,
                waterGeometry = new THREE.CubeGeometry(waterCubeLength*1.2 , vessel.height , waterCubeLength*1.2 ),
                waterMesh ,
                restrictMaterial = new THREE.ShaderMaterial({
                    vertexShader : THREE.WaterShader.vertexShader,
                    fragmentShader : THREE.WaterShader.fragmentShader
                }),            
                restrictVessel = vessel.clone();
                waterGeometry.dynamic = true;
            
            waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
            waterMesh.position.copy( vessel.position );
            waterMesh.position.y += waterHeight - vessel.height / 2;
            
            restrictVessel.material = restrictMaterial;
            restrictVessel.position = vessel.position;
            vessel.restrictVessel = restrictVessel;
            if (!reset) {
                vessel.waterHeight = waterHeight / vessel.height;
            }
            waterMesh.detail = Chemist.clone(water);
            Chemist.restrictScene.add(restrictVessel);
            Chemist.waterScene.add(waterMesh);
            return waterMesh;
        },

        //[0,1]的相对高度转换成个数
        heightToNum : function (vessel, height) {
            var solidHeight = (height === undefined ? vessel.solidHeight : height) * vessel.height,
                solidNum = solidHeight * vessel.radius / 0.02;
            return Math.ceil(solidNum);
        },
        
        addSolid : function (vessel, solidName, height, reset) {
            var solid = Chemist.Chemicals.solids[solidName],
                solidHeight = (height === undefined ? vessel.solidHeight : height) * vessel.height,
                solidNum = Chemist.heightToNum(vessel, height),
                wall_material = Physijs.createMaterial(
                    new THREE.MeshBasicMaterial(),
                    0.8, // high friction  摩擦系数
                    0.2 // low restitution  弹性系数
                );


            if (!vessel.wall) {

                // Ground
                var ground = new Physijs.BoxMesh(
                    new THREE.CubeGeometry(vessel.radius * 2, 0.05, vessel.radius * 2),
                    wall_material,
                    0 // mass 表示无限不会动
                );
                ground.position.copy(vessel.position);
                ground.type = Chemist.type.virtual;
              ground.visible = false;


                var wallf = new Physijs.BoxMesh(
                    new THREE.CubeGeometry(vessel.radius * 2, .05, vessel.height),
                    wall_material,
                    0 // mass 表示无限不会动
                );
                wallf.rotation.x = - Math.PI / 2;
                wallf.position.z = - (vessel.radius - 0.08 );
                wallf.position.y = vessel.height/2;
                wallf.visible = false;

                ground.add(wallf);

                var wallb = new Physijs.BoxMesh(
                    new THREE.CubeGeometry(vessel.radius * 2, .05, vessel.height),
                    wall_material,
                    0 // mass 表示无限不会动
                );
                wallb.rotation.x = - Math.PI / 2;
                wallb.position.z = (vessel.radius - 0.08 );
                wallb.position.y = vessel.height/2;
                wallb.visible = false;
                ground.add(wallb);

                var walll = new Physijs.BoxMesh(
                    new THREE.CubeGeometry(vessel.radius * 2, .05, vessel.height),
                    wall_material,
                    0 // mass 表示无限不会动
                );
                walll.rotation.z= - Math.PI / 2;
                walll.rotation.x= - Math.PI / 2;
                walll.position.y = vessel.height/2;
                walll.position.x = -(vessel.radius - 0.08 );
                walll.visible = false;
                ground.add(walll);

                var wallr = new Physijs.BoxMesh(
                    new THREE.CubeGeometry(vessel.radius * 2, .05, vessel.height),
                    wall_material,
                    0 // mass 表示无限不会动
                );
                wallr.rotation.z= - Math.PI / 2;
                wallr.rotation.x= - Math.PI / 2;
                wallr.position.x = (vessel.radius - 0.08 );
                wallr.position.y = vessel.height/2;
                wallr.visible = false;
                ground.add(wallr);

                Chemist.scene.add( ground );
                vessel.wall = ground;
                vessel.action = false;
            }

             var solidMesh =[];

            solidMesh.detail = Chemist.clone(solid);
            vessel.solidCount = solidNum;
            if (!reset) {
                vessel.solidHeight = solidHeight / vessel.height;

            }

            var times = 0,
                int = setInterval(function () {
                if(times >= vessel.solidCount) {
                    clearInterval(int);
                    return;
                }
                solidMesh.push(Chemist.createPiece(vessel, solidName, vessel.height*2));
                times++;
            }, 100);

            return solidMesh;
        },

    /**
     *
     * @param vessel :加入的容器
     * @param solidName :固体名称
     * @param height ：固体降落高度
     *
     */
        createPiece : function (vessel, solidName, height) {
            var solid = Chemist.Chemicals.solids[solidName],
                material = new THREE.MeshPhongMaterial({
                    color : solid.color,
                    ambient : solid.color,
                    shininess : 50
                }),
                solid_material = Physijs.createMaterial(
                    material,
                    0.8, // low friction
                    0.2 // high restitution
                ),
                solidPiece = new Physijs.BoxMesh(
                    new THREE.OctahedronGeometry(0.03*Math.random()+0.05, 1),   //八面体
                    solid_material,
                    1 + Math.random() * 10
                );
                solidPiece.position.copy(vessel.position);
                solidPiece.position.y += height;
                solidPiece.castShadow = true;
                Chemist.scene.add(solidPiece);

                solidPiece.addEventListener("calculateOffset", function(event) {
                    //回调函数中，event.type 表示事件名称，event.target 和this 都表示调用对象，还有其他自定义属性event.vPosition表示容器位置
                    this.offset = this.position.clone().sub(event.vPosition);
                });

             return solidPiece;
        },

    /**
     * 从vessel中删除固体
     * @param vessel
     * @param num ： 要删除的个数
     */
        deletePiece : function (vessel, num) {

            var solid= vessel.solid, i, index = 0, len = solid.length, temp;
            for (i=0; i<num; i++) {
                index = Math.floor(Math.random() * len) ;
                temp = solid.splice(index,1);
                Chemist.scene.remove(temp[0]);
                len--;
            }
            //若固体个数为0则移除成分
            if( len <= 0 ) {
                solid.detail.ingredient.length = 0;
                solid.detail = null;
            }

        },

    /**
     *
     * @param object :加火焰的对象, 默认object的position在对象中心
     * @param size :火焰大小
     * @param color :火焰颜色
     * @param offset :火焰位置调整的向量
     */
        addFire : function (object, size, color, offset) {
            object.fire = new THREE.Fire(size, color);
            if(object.length){
                object.fire.position.copy(object.position.clone().add(object.direct.normalize().multiplyScalar(object.length / 2)).add(offset));
            }else if (object.height) {
                object.fire.position.copy(object.position.clone().add(object.direct.normalize().multiplyScalar(object.height / 2)).add(offset));
            }
            object.fire.offset = object.fire.position.clone().sub(object.position);  //从obj的position指向fire的position的向量
            Chemist.scene.add(object.fire);
        },

    /**
     *
     * @param vessel :到入的容器
     * @param container ：到出的容器
     */
        mixChemicals : function ( vessel, container) {
            var i = 0, len = 0, ingredient  ;
            if (container.liquid) {
                ingredient = container.liquid.detail.ingredient;
                len = ingredient.length;
                for (i=0; i<len ; i++) {
                    vessel.liquid.detail.ingredient.push(ingredient[i]);
                    if (vessel.solid) {
                        vessel.solid.detail.ingredient.push(ingredient[i]);
                    }
                }    
            }else if (container.solid) {
                ingredient = container.solid.detail.ingredient;
                len = ingredient.length;
                for (i=0; i<len ; i++) {
                   vessel.solid.detail.ingredient.push(ingredient[i]);
                    if (vessel.liquid) {
                        vessel.liquid.detail.ingredient.push(ingredient[i]);
                    }
                }   
            }
           
        },

    //删除一个对象,及关联东西
    removeObj : function (obj){
        //水面高度刻度
        if (obj.waterLevel != undefined ) {
            Chemist.scene.remove(obj.waterLevel);
            obj.waterLevel = null;
        }
        if ( obj.liquid != undefined ) {
            Chemist.waterScene.remove(obj.liquid);
            Chemist.restrictScene.remove(obj.restrictVessel);
            obj.liquid = null;
            obj.restrictVessel = null;
        }
        if ( obj.gas ) {
            if (obj.gas.bubbles) {
                Chemist.scene.remove(obj.gas.bubbles);
            }
            obj.gas = null;
        }
        if ( obj.sediment ) {
            Chemist.scene.remove(obj.sediment);
            obj.sediment = null;
        }
        if ( obj.fire ) {
            Chemist.scene.remove(obj.fire);
            obj.fire = null;
        }
        if ( obj.solid ) {
            for (j = obj.solid.length-1; j >= 0; j--) {
               Chemist.scene.remove(obj.solid[j]);
            }
            obj.solid = null;
        }
        if ( obj.wall ) {
            Chemist.scene.remove(obj.wall);
            obj.wall = null;
        }
        if (obj.pipes && obj.pipes.length > 0) {
            obj.pipes.length = 0;
        }


        //导管
        if (obj.name === "pipe" || obj.name === "ironSupport" || obj.name === "ironSupport_bar" ){
            obj.dispatchEvent({type: "delete"});
        }else{
            Chemist.objects.remove(obj);
            Chemist.scene.remove(obj);
        }
    },



    //移动物体，及关联东西
     moveObj : function (obj, pos) {
        if(pos) {
            obj.position.copy(pos);
        }

        if( obj.liquid ) {
            obj.restrictVessel.position.copy(obj.position);
            obj.liquid.position.copy(obj.position);
            obj.liquid.position.y += obj.waterHeight * obj.height - obj.liquid.geometry.height / 2;
        }

        if(obj.fire) {
            obj.fire.position.copy(obj.position);
            obj.fire.position.add(obj.fire.offset);
        }

        if (obj.wall) {
            var originalPos = obj.wall.position.clone();
            obj.wall.position.copy(obj.position);
            obj.action = true;

            if (obj.solid && obj.solid.length > 0) {
                for (var j = obj.solid.length-1; j >= 0; j--) {
                    var temp = obj.solid[j];
                    temp.dispatchEvent('calculateOffset',{ vPosition: originalPos});
                    temp.position.addVectors(obj.position, temp.offset);
                }
            }
        }

         //连接导管时
         if (obj.pipes && obj.pipes.length > 0) {
            for (var i = obj.pipes.length -1; i >= 0; i-- ) {
                var pipe = obj.pipes[i];
                pipe.position.copy(obj.position);

                pipe.position.y += obj.height  ;

                pipe.dispatchEvent({type:"move", position: pipe.position.clone()});
            }
         }

         //有气泡时
         if (obj.gas && obj.gas.bubbles) {
            obj.gas.bubbles.position.copy(obj.position);
         }

         if ( obj.sediment ) {
             obj.sediment.position.copy(obj.position);
             obj.sediment.position.y += obj.sediment.height * 2 / 3;
         }

         if(obj.detail && obj.detail.id === "pipe") {
             obj.dispatchEvent({type:"move", position: obj.position.clone()});
         }

         if(obj.detail && obj.detail.id === "ironSupport") {
            obj.dispatchEvent({type:"move", pos: obj.position.clone()});
         }

    },

        isOnFire : function (obj, fireObj) {
            var fire = fireObj.fire,
                objBox = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld),
                box = null,
                temp,
                i = 0;
            for (i=0; i < fire.children.length; i++) {
                fire.children[i].geometry.computeBoundingBox();
                if( !box ) {
                    box = fire.children[i].geometry.boundingBox.clone().applyMatrix4(fire.matrixWorld);
                }else {
                    temp = fire.children[i].geometry.boundingBox.clone().applyMatrix4(fire.matrixWorld);
                    box.expandByPoint(temp.min);
                    box.expandByPoint(temp.max);
                }
            }
            return objBox.isIntersectionBox(box);
        },

        addFrame : function (obj) {
            var box = Chemist.getBoundingBox(obj),
                center = box.center(),
                size = box.size(),
                geometry = new THREE.CubeGeometry(size.x, size.y, size.z),
                material = new THREE.MeshBasicMaterial({
                    wireframe: true,
                    wireframeLinewidth : 0.01
                }),
                mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(center);
            mesh.type = Chemist.type.virtual;
            obj.frame = mesh;
            Chemist.scene.add(mesh);
        },
        
        //深复制
        clone : function (obj) {
                if (obj == null){
                    return null; 
                }
                var o = obj.constructor === Array ? [] : {};
                for(var i in obj){
                    if(obj.hasOwnProperty(i)){
                        o[i] = typeof obj[i] === "object" ? arguments.callee(obj[i]) : obj[i];
                    }
                }
                return o;
        }


};

