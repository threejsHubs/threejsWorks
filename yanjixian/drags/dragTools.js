/**
* 拖拽插件,鼠标左键水平移动，右键垂直移动，按住shift绕y轴旋转
* 依赖threejs 
*
*/
(function (globle) {
    var Drags = globle.Drags = function () {
        this.objects = []; //所有可拖拽物体
        this.selected = null;  //已选的
        this.hover = null;  //接触的
        this.mouse = new THREE.Vector2();  //鼠标在标准视口坐标【-1， 1】
        this.offset = new THREE.Vector3(); //鼠标平面交点到物体位置的偏移量
        this.virtualPlaneH = null;   //虚拟的水平平面
        this.virtualPlaneV = null;   //虚拟的垂直平面
        this.clickPosition = new THREE.Vector2(); //鼠标按下时的mouse值
        
        this.disableH = false;  //禁止水平移动
        this.disableV = false;   //禁止垂直移动
        this.disableR = false;   //禁止旋转
    };
    
    Drags.prototype = {
        /**
        * new 完之后必须初始化
        * @param options 应该包括scene，camera，canvas(容器即可)，width（用于createPlane），height（用于createPlane）， canvasWidth， canvasHeight（canvas长宽），
        */
        init : function (options) {
            var vpv = this.virtualPlaneV = this.createPlane(options.width, options.height);
            vpv.name = "virtualPlaneV";         
            var vph = this.virtualPlaneH = this.createPlane(options.width, options.height);
            vph.rotation.x = - Math.PI / 2;
            vph.name = "virtualPlaneH";
            
            options.scene.add(vpv);
            options.scene.add(vph);

            //绑定自定义事件mousemove,mouseup,mousedown。在外部也可以绑定事件
            this.addEventListener("mousemove", this.onMousemove);
            this.addEventListener("mousedown", this.onMousedown);
            this.addEventListener("mouseup", this.onMouseup);
            this.addEventListener("keydown", function (event) {
                var keyCode = event.domEvent.keyCode;
                switch (keyCode) {
                    case 16:
                        this.onShiftkeydown(event);
                        break;
                    default:

                }
            });
            this.addEventListener("keyup", function (event) {
                var keyCode = event.domEvent.keyCode;
                switch (keyCode) {
                    case 16:
                        this.onShiftkeyup(event);
                        break;
                    default:

                }
            });

            document.addEventListener("mousemove", this.proxy(function (event) {
                this.dispatchEvent({type: "mousemove", domEvent: event, camera: options.camera, canvas: options.canvas, canvasWidth: options.canvasWidth, canvasHeight: options.canvasHeight});
            }), false);
            document.addEventListener("mouseup", this.proxy(function (event) {
                this.dispatchEvent({type: "mouseup", domEvent: event, camera: options.camera, canvas: options.canvas, canvasWidth: options.canvasWidth, canvasHeight: options.canvasHeight});
            }), false);
            document.addEventListener("mousedown", this.proxy(function (event) {
                this.dispatchEvent({type: "mousedown", domEvent: event, camera: options.camera, canvas: options.canvas, canvasWidth: options.canvasWidth, canvasHeight: options.canvasHeight});
            }), false);

            document.addEventListener("keydown", this.proxy(function (event) {
                this.dispatchEvent({type: "keydown", domEvent: event, canvas: options.canvas});
            }), false);
            document.addEventListener("keyup", this.proxy(function (event) {
                this.dispatchEvent({type: "keyup", domEvent: event, canvas: options.canvas,  camera: options.camera, canvasWidth: options.canvasWidth, canvasHeight: options.canvasHeight});
            }), false);

        },
        createPlane : function (width, height) {
            var plane, geometry, material;
            material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
                opacity: 0.2,
                transparent: true,
                wireframe: true
            });
            geometry =  new THREE.PlaneGeometry(width || 1000, height || 1000, 16, 16);
            plane = new THREE.Mesh(geometry, material);
            plane.position.set(0, 0, 0);
            plane.visible = false;
            return plane;  //返回一垂直平面
        },
        /**
         * 添加移动对象
         * @param obj
         */
        add : function (obj) {
            if (this.objects.indexOf(obj) === -1) {
                this.objects.push(obj);
            }
        },
        /**
         * 删除移动对象
         * @param obj
         * @returns {*}
         */
        remove: function(obj) {
            var i = 0, len = this.objects.length;
            for (i = 0; i<len; i++) {
                if ( this.objects[i] === obj ) {
                    this.objects.splice(i, 1);
                    return obj;
                }
            }
        },
        /**
        * 返回objects中与鼠标相交的第一个交点对象
        * @param camera
        * @param obj 若传入，则返回鼠标与obj的第一个交点对象
        */
        getIntersect : function (camera, obj) {
            var point = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5),
            projector = new THREE.Projector(),
            raycaster = projector.pickingRay(point, camera),
            intersects;
            if (typeof obj === "undefined"){
                intersects = raycaster.intersectObjects(this.objects);
            }else {
                intersects = raycaster.intersectObject(obj);
            }
            return intersects[0];
        },
        /**
        * 判断鼠标与obj是否相交
        * @param obj
        * @param camera
        */
        isIntersect : function (obj, camera) {
            var object = this.getIntersect(camera, obj) && this.getIntersect(camera, obj).object, bool = false,
            intersect = this.getIntersect();
            if (object === obj) {
                bool = (intersect.object === object);
            }
            return bool;
        },
        /**
         * 设置鼠标坐标，鼠标移动时触发
         * @param event 包括domEvent，canvasWidth，canvasHeight
         */
        setMouse : function (event) {
            this.mouse.x = event.domEvent.offsetX / event.canvasWidth * 2 - 1;
            this.mouse.y = - event.domEvent.offsetY / event.canvasHeight * 2 + 1;
        },
        /**
         * 设置鼠标碰到的元素
         * @param camera 场景相机
         */
        setHover: function (camera) {
            var intersect = this.getIntersect(camera);
            if (intersect) {
                this.hover = intersect.object;
            }else{
                this.hover = null;
            }
        },
        /**
         *
         * @param select
         */
        setSelected: function (select) {
            if (typeof select === "undefined") {
                this.selected = this.hover;
            }else{
                this.selected = select;
            }
        },
        /**
         * 设置offset, 由point指向selected
         * @param point 鼠标射线与对应屏幕的交点
         */
        setOffset: function (point) {
            this.offset.subVectors(this.selected.position, point);
        },
        /**
         * 修正虚拟平面的位置
         */
        movePlane: function () {
            if ( this.hover ) {
               this.virtualPlaneH.position.copy(this.hover.position);
               this.virtualPlaneV.position.copy(this.hover.position);
            }
        },
        /**
         * 突出显示物体，不传obj则显示selected
         * @param bool true开启，false正常
         * @param obj
         */
        highlight: function (bool, obj) {
            var that = obj || this.selected;
            if ( that.material.opacity === 0.3 && bool === true) {
                return;
            }
            if (bool===true){
                that.material.oldTransparent = that.material.transparent;
                that.material.oldOpacity = that.material.opacity;
                that.material.transparent = true;
                that.material.opacity = 0.3;
            }else if (that.material.oldOpacity) {
                that.material.transparent = that.material.oldTransparent;
                that.material.opacity = that.material.oldOpacity;
            }
        },
        /**
         * 设置鼠标样式
         * @param canvas dom元素
         * @param style 样式字符串，如：'url(rotate.cur),auto'、'point'
         */
        changeMouseStyle: function (canvas, style) {
            canvas.style.cursor = style;
        },
        /**
         *
         * @param event
         */
        onMousedown: function (event) {
            event.domEvent.preventDefault();
            var intersect;
            this.setSelected();
            this.clickPosition.copy(this.mouse);
            if (this.selected !== null) {
                this.highlight(true);
                if (event.domEvent.shiftKey && !this.disableR) {
                    this.changeMouseStyle(event.canvas, "url(js/rotate.cur),pointer");
                    this.addEventListener("mousemove", this.rotateSelected);
                }else{
                    if( event.domEvent.button === 0 ){
                        intersect = this.getIntersect(event.camera, this.virtualPlaneH);
                    }else if (event.domEvent.button === 2) {
                        intersect = this.getIntersect(event.camera, this.virtualPlaneV);
                    }
                    if (intersect ) {
                        this.setOffset(intersect.point);                 
                    }
                    this.changeMouseStyle(event.canvas, "move");
                    this.addEventListener("mousemove", this.moveSelected);
                }
            }
        },
        /**
         *
         * @param event
         */
        onMousemove: function (event) {
            event.domEvent.preventDefault();
            this.setMouse(event);
            this.setHover(event.camera);
            if (this.selected === null){
                if (this.hover) {
                    this.changeMouseStyle(event.canvas, "pointer");
                }else{
                    this.changeMouseStyle(event.canvas, "auto");
                }
                //mouseup会触发mousemove事件，所以只需加在mousemove事件中即可
                this.movePlane();
            }
        },
        /**
         *
         * @param event
         */
        moveSelected: function (event) {
            if ( ! this.selected ) {
                return;
            }
            var intersect = null;
            if( event.domEvent.button === 0 && !this.disableH){
                intersect = this.getIntersect(event.camera, this.virtualPlaneH);
            }else if (event.domEvent.button === 2 && !this.disableV) {
                intersect = this.getIntersect(event.camera, this.virtualPlaneV);
            }
            if (intersect ){
                this.selected.position.copy(intersect.point.add(this.offset));
            }
        },
        /**
         * 绕y轴旋转selected
         * @param event
         */
        rotateSelected: function (event) {
            if ( ! this.selected) {
                return;
            }
            var delta = -(this.clickPosition.x - this.mouse.x) ;
            if (Math.abs(delta) > 1) {
                return;
            }
            this.clickPosition.copy(this.mouse);
            this.selected.rotation.y += delta;
        },
        /**
         *
         * @param event
         */
        onMouseup: function (event) {
            event.domEvent.preventDefault();
            if (this.selected !== null) {
                this.highlight(false);
                this.removeEventListener("mousemove", this.rotateSelected);
                this.removeEventListener("mousemove", this.moveSelected);
                this.setSelected(null);
            }
        },
        /**
         *
         * @param event
         */
        onShiftkeyup : function (event) {
            event.domEvent.preventDefault();
            if(this.disableR){
                return;
            }
            this.removeEventListener("mousemove", this.rotateSelected);
            if (this.selected) {
                this.onMouseup(event);
                this.onMousedown(event);
            }else {
                this.onMousemove(event);
            }
            
        },
        /**
         *
         * @param event
         */
        onShiftkeydown: function (event) {
            event.domEvent.preventDefault();
            if(this.disableR){
                return;
            }
            if (this.selected) {
                this.removeEventListener("mousemove", this.moveSelected);
                this.clickPosition.copy(this.mouse);
                this.changeMouseStyle(event.canvas, "url(rotate.cur),pointer");
                this.addEventListener("mousemove", this.rotateSelected);
            }
        },
        /**
         * 绑定fn的作用域为this或obj
         * @param fn 要绑定的函数
         * @param obj 调用函数的对象，obj为空则为this
         * @returns {Function}
         */
        proxy: function (fn, obj) {
            var that = obj || this;
            return function () {
                return fn.apply(that ,arguments);
            }
        }
    };
    
    THREE.EventDispatcher.prototype.apply(Drags.prototype);
})(this);  //this可以改为已有的命名空间