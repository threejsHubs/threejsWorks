(function(Chemist){
    var o, i, equips = Chemist.Equips, liquids = Chemist.Chemicals.liquids, solids = Chemist.Chemicals.solids, gases = Chemist.Chemicals.gases;


 $(function(){


     window.onload = function () {

         var onFileLoad = function () {
            $("body").hideLoading();
   //          Chemist.loadQueue.off("fileload", arguments.callee);
         };

         Chemist.loadQueue.on("complete", onFileLoad, this);

         //预加载模型
         Chemist.loadQueue.loadFile({src: "obj/beaker.obj"});
         Chemist.loadQueue.loadFile({src: "obj/bottle.obj"});
         Chemist.loadQueue.loadFile({src: "obj/burner.obj"});
         Chemist.loadQueue.loadFile({src: "obj/testTube.obj"});
         Chemist.loadQueue.loadFile({src: "obj/ironSupport/dizuo.obj"});
         Chemist.loadQueue.loadFile({src: "obj/ironSupport/dizuo.mtl"});
         Chemist.loadQueue.loadFile({src: "obj/ironSupport/zaiju.obj"});
         Chemist.loadQueue.loadFile({src: "obj/ironSupport/qianzi.obj"});
         Chemist.loadQueue.loadFile({src: "obj/ironSupport/yincaizhi.bmp"});
     };

    //切换桌布
    var tables = Chemist.TableClothes, i = 0, len = 0, cloth, map;
    for (i=0, len = tables.length; i < len; i++) {
        cloth = $("#table_" + tables[i].name);
        cloth.bind("click", (function () {
            var url = tables[i].url;
            return function () {
                map = THREE.ImageUtils.loadTexture(url);
                map.wrapS = map.wrapT = THREE.RepeatWrapping;
                map.anisotropy = 16;
                Chemist.plane.material.map = map;
            };
        })());
    }
    
    //阴影开关
    var shadowPad = $("#shadowPad").children()[0];
    shadowPad.onchange = function (event) {
        var bool = event.target.checked;
        Chemist.renderer.shadowMapEnabled = bool;
        Chemist.renderer.updateShadowMap(Chemist.scene, Chemist.camera);
    };
    
    //reset
    $("#resetDesk").click( function (event) {
        var i = 0, len = 0, objs = Chemist.objects, obj;
        for (i=0, len=objs.length; i < len; i++ ) {
            obj = objs[i];
            if( obj.type === Chemist.type.platform ) continue;
            Chemist.removeObj(obj);
        }
        for (i in Chemist.Tools) {
            if (Chemist.Tools.hasOwnProperty(i)) {
                Chemist.Tools[i] = null;
            }
        }
        Chemist.objects.push(Chemist.plane);
    });
    $("#resetCamera").click( function (event) {
        Chemist.controls.reset();
    });
     //提示设置
     $("#infoPad_show").on("click", function() {
         $("#info").show().delay(3000).fadeOut(2000);
     });
    
    
    //绑定器材事件
     var equipments = $("#equipments"),li;
    for ( o in equips ) {
        if( equips.hasOwnProperty(o) ) {
            li = $("<li>").bind("click",equips[o].create).append($("<img>").attr({"alt": equips[o].name, "src": equips[o].img, title :  equips[o].name}));
            equipments.append(li);
        }    
    }    
   
   //绑定药品
    var chemicals = $("#chemicalList"), btn;
   for (o in liquids) {
        if (liquids.hasOwnProperty(o) ) {
            li = $("<li>");
            btn = $("<img>").attr({"alt": liquids[o].name, "src": liquids[o].img})
                .bind("click", (function(event){
                var obj = o;
                return function (event) {   
                    Chemist.Bottle(Chemist.beakerPosition, function (bottle) {
                     
                        bottle.liquid = Chemist.addLiquid(bottle, obj, 0.7);
                            
                    });    
                };
            })());
            li.append(btn);
            chemicals.append(li);
        }
   }


    for (o in solids) {
        if (solids.hasOwnProperty(o) ) {
            li = $("<li>");
            btn = $("<div>").css({position: "absolute", width: "30px", height: "40px", right: 0, "z-index": 100, color: "#"+solids[o].color.toString(16), "font-size": "20px", cursor: "pointer"}).html("棒")
            .bind("click", (function(event){
                var obj = solids[o];
                return function (event) {
                    var stick = new Chemist.Stick(Chemist.beakerPosition, 0.5, obj, obj.key+"_bar");
                    stick.rotation.z =  Math.PI / 2;
                    stick.direct.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                    stick.position.y = Chemist.stickPosition.y;
                };
            })());
            li.append(btn);
            btn = $("<img>").attr({"alt": solids[o].name, "src": solids[o].img, title: solids[o].name}).bind("click", (function(event){
                var obj = o;
                return function (event) {
                    Chemist.Bottle(Chemist.beakerPosition, function (bottle) {
                        //加固体的代码
                        bottle.solid = Chemist.addSolid(bottle, obj, 0.8);
                   });
                };
            })());
            li.append(btn);
            chemicals.append(li);
        }
    }
    //滚动条
    chemicals.mCustomScrollbar({
        horizontalScroll:true
    });


    //工具事件
    $("#glassBar").bind("click", function (event) {
        if (Chemist.Tools.glassBar) {
            Chemist.Tools.glassBar.position.copy(Chemist.beakerPosition);
            Chemist.Tools.glassBar.position.y += Chemist.Tools.glassBar.length / 2;
        }else{
            Chemist.Tools.glassBar = new Chemist.Stick(Chemist.beakerPosition, 0.8, {color: 0xffffff}, "glassBar" , true);
            Chemist.Tools.glassBar.canFire = false;
            Chemist.Tools.glassBar.position.y += Chemist.Tools.glassBar.length / 2;
        }
    });
    $("#match").bind("click", function(event){

        if (Chemist.Tools.match) {
            Chemist.Tools.match.position.copy(Chemist.beakerPosition);
            Chemist.Tools.match.position.y = Chemist.stickPosition.y;
            Chemist.Tools.match.fire.position.copy(Chemist.Tools.match.position);
            Chemist.Tools.match.fire.position.add(Chemist.Tools.match.fire.offset);
        }else{
            Chemist.Tools.match = new Chemist.Stick(Chemist.beakerPosition, 0.3, {color: 0xffff00}, "match");
            Chemist.Tools.match.position.y = Chemist.stickPosition.y;
            Chemist.Tools.match.rotation.z = Math.PI / 2;
            Chemist.Tools.match.direct.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2).normalize();
            Chemist.addFire(Chemist.Tools.match, 0.8, null, new THREE.Vector3(0, 0.35, 0));
        }
    });

 });

})(Chemist);