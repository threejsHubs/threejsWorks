(function(){
    //返回移除的个数
    Array.prototype.remove = function (obj) {
        var i = 0, len = this.length, n=0;
        for (i = 0; i<len; i++) {
            if ( this[i] === obj ) {
                this.splice(i, 1);
                n++;
            }
        }
        return n;
    };

    Chemist.utils.info = function (value) {
        var info = $("#info");
        info.fadeIn();
        if(info.children("div").length >= 5) {
            info.children("div").first().slideUp(500, function () {
                this.remove();
            });
        }
        info.append(value);
    };

    //设置物体及其子物体的颜色
    Chemist.utils.setColor = function (obj, color) {

    };

    Chemist.utils.getRandom = function (min, max) {
        return min + Math.random() * (max - min);
    };

    /**
     * 控制对象移动
     * @param start 该对象可以有多个属性，只有和end中的对应属性才计算值
     * @param end
     * @param ease 轨迹模式, 默认TWEEN.Easing.Sinusoidal.InOut
     * @param update 每运动一次回调
     * @param complete  完成时回调
     * @param loop 是否循环
     */
    Chemist.utils.moveTo = function (start, end, ease, update, complete, loop) {
        var tween = new TWEEN.Tween(start).to(end, 3000 * Math.random()).easing(ease || TWEEN.Easing.Sinusoidal.InOut).delay(500);
        tween.onUpdate(update);
        tween.onComplete(complete);
        if (loop) {
            tween.chain(tween);
        }
        tween.start();
        return tween;
    };

    //根据z坐标，使圆柱形物体表面不规则
    Chemist.utils.randomize = function(geometry) {
        var vertices = geometry.vertices, i , vertex,
            NoiseGen = new SimplexNoise();

        for (i =  vertices.length-1; i>=0; i--) {
            vertex = vertices[i];
            vertex.x += NoiseGen.noise( vertex.z, vertex.z);
            vertex.y += NoiseGen.noise( vertex.z, vertex.z);
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
    };

    THREE.Mesh.prototype.getStatus = function () {
        if(!this.status) return;
        return this.status[this.status.length-1];
    };


})();