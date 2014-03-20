
/**
 *
 * pipe代表导管
 *
 * position : 初始位置
 *
 *
 *
 **/

Chemist.Pipe = function (position) {
     var pipe, pipel, piper, material, cornerl, cornerr,
         length = 2, radius = 0.03, lrLength = 0.5;

    material = new THREE.MeshPhongMaterial({color : 0xffffff});
    material.transparent = true;
    material.opacity = 0.3;
    material.refractionRatio = 0.85;

    pipel = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, lrLength), material.clone());
    pipel.position.set( -length / 2, -lrLength / 2 , 0);
    pipel.length = lrLength;
    pipel.radius = radius;
    pipel.fixed = false;  //是否连接物体
    pipel.link = null;   //连接的物体
    pipel.name = "pipe";
    pipel.type = Chemist.type.instrument;
    pipel.status = [Chemist.status.normal];

    piper = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, lrLength), material.clone());
    piper.position.set(length / 2 ,-lrLength / 2 , 0);
    piper.length = lrLength;
    piper.radius = radius;
    piper.fixed = false;  //绑定状态
    piper.link = null;   //连接的物体
    piper.name = "pipe";
    piper.type = Chemist.type.instrument;
    piper.status = [Chemist.status.normal];

    cornerl = new THREE.Mesh(new THREE.SphereGeometry(radius), material.clone());
    cornerl.position.set(0, lrLength / 2,0);
    cornerr = cornerl.clone();

    pipel.add(cornerl);
    piper.add(cornerr);

    pipel.castShadow = true;
    piper.castShadow = true;

    pipel.detail = Chemist.clone(Chemist.Equips.pipe);
    piper.detail = Chemist.clone(Chemist.Equips.pipe);
    pipel.anotherSide = piper;
    piper.anotherSide = pipel;
    piper.detail.side = "right";
    pipel.detail.side = "left";



    /**
     *
     * @param radius 管半径
     * @param length 管长
     * @param position 位置
     * @param right 右边的管
     * @param left 左边的管
     * @param axis
     * @param alpha
     */
    function createPipe(radius, length, position, right, left, axis, alpha) {
        var geometry = new THREE.CylinderGeometry( radius, radius, length),
        pipe = new THREE.Mesh(geometry , material.clone() );
        pipe.right = right;
        pipe.left = left;
        pipe.rotation.z = Math.PI / 2;


        if(axis){
            pipe.updateMatrixWorld();
            pipe.worldToLocal(axis);

            pipe.rotateOnAxis(axis.normalize(), alpha);

        }

        pipe.position.copy(position);

        pipe.type = Chemist.type.instrument;
        pipe.status = [Chemist.status.normal];

        pipe.castShadow = true;
        pipe.length =  length;
        pipe.radius = radius;

        //pipe的方向
        pipe.direct = new THREE.Vector3(1, 0, 0);  //由左向右
        pipe.detail = Chemist.clone(Chemist.Equips.pipe);
        pipe.name = "pipe";

        left.body = right.body = pipe;


        pipe.addEventListener("move", function (event) {
            var dir = this.direct.clone().multiplyScalar(this.length/2),
                high = new THREE.Vector3(0, -this.right.length/2,0);
            this.position.copy(event.position);
            this.right.position.copy(event.position).add(dir).add(high);
            this.left.position.copy(event.position).add(dir.negate()).add(high);
            this.left.gas = null;
            this.right.gas = null;
        });

        pipe.addEventListener("delete" , function() {
            Chemist.objects.remove(this.left);
            Chemist.scene.remove(this.left);
            Chemist.objects.remove(this.right);
            Chemist.scene.remove(this.right);
            Chemist.objects.remove(this);
            Chemist.scene.remove(this);
            this.left = null;
            this.right = null;
        });

        return pipe;
    }


    var onMove = function (event) {
            var dir = this.body.direct.clone().multiplyScalar(this.body.length/2).multiplyScalar(this.detail.side === "left" ? 1: -1),
                high = new THREE.Vector3(0, this.length/2,0);
            if(this.anotherSide.fixed){
                this.position.copy(event.position);
                this.dispatchEvent({type:'createBody', position: this.position});
            }else{
                this.position.copy(event.position);
                this.body.position.copy(event.position).add(high).add(dir);
                this.anotherSide.position.copy(event.position).add(dir.multiplyScalar( 2));
                if ( this.anotherSide.position.y.toFixed(2) != (Chemist.pipePosition.y - this.length / 2).toFixed(2) ){
                    this.anotherSide.position.y = Chemist.pipePosition.y - this.length / 2;
                    this.dispatchEvent({type:'createBody', position: this.position});
                }
            }
        },
        onCreateBody = function (event) {
            Chemist.scene.remove(this.body);
            Chemist.objects.remove(this.body);
            var dir =  this.body.right.position.clone().sub(this.body.left.position),
                length = dir.length(),
                oldDir = new THREE.Vector3(1,0,0),
                alpha = dir.angleTo(oldDir.negate()),
                axis = oldDir.cross(dir).normalize(),
                high = new THREE.Vector3(0, this.length/2,0),
                pos = this.body.left.position.clone().add(dir.multiplyScalar(1/2)).add(high),
                pipe = createPipe(this.radius, length, pos, this.body.right, this.body.left, axis, alpha);
            pipe.direct = dir.clone().normalize();
            pipe.status.push(Chemist.status.linking);
            Chemist.scene.add(pipe);
            Chemist.objects.push(pipe);
        },
        onLink = function (event) {
            this.link = this.intersectVessel;
            this.link.pipes.push(this);
            this.fixed = true;
            this.body.status.push(Chemist.status.linking);

            this.position.copy(this.intersectVessel.position);
            this.position.y = this.intersectVessel.height - 1 ;
            this.material.opacity = 1;
            Chemist.objects.remove(this);

            // this要连有气泡的
            if (this.link.gas ) {
                var detail = Chemist.Chemicals.gases[this.link.gas.detail.key];
                //记录导管属性
                if(this.gas) {
                    this.gas.detail.ingredient.push(detail.key);
                }else{
                    this.gas =  {};
                    this.gas.detail = Chemist.clone(detail);
                }

                if (this.anotherSide.gas) {
                    this.anotherSide.gas.detail.ingredient.push(detail.key);
                }else{
                    this.anotherSide.gas = {};
                    this.anotherSide.gas.detail = Chemist.clone(detail);
                }
                //为另一边加气泡
                if (this.anotherSide.link && this.link.gas.bubbles) {
                    if (!this.anotherSide.link.gas) {
                        this.anotherSide.link.gas = {};
                        this.anotherSide.link.gas.detail = Chemist.clone(detail);
                    }
                    if (!this.anotherSide.link.gas.bubbles) {
                        this.anotherSide.link.gas.bubbles = Chemist.addBubbles(this.anotherSide.link);
                    }
                }

            }

            //anotherSide有气泡，
            if (this.anotherSide.link && this.anotherSide.link.gas ) {
                 detail = Chemist.Chemicals.gases[this.anotherSide.link.gas.detail.key];
                if(this.gas) {
                    this.gas.detail.ingredient.push(detail.key);
                }else{
                    this.gas =  {};
                    this.gas.detail = Chemist.clone(detail);
                }

                if (this.link.gas) {
                    this.gas.detail.ingredient.push(detail.key);
                }else{
                    this.gas =  {};
                    this.gas.detail = Chemist.clone(detail);
                }

                if (  this.anotherSide.link.gas.bubbles ) {
                    if (!this.link.gas) {
                        this.link.gas = {};
                        this.link.gas.detail = Chemist.clone(detail);
                    }
                    if ( !this.link.gas.bubbles ) {
                        this.link.gas.bubbles = Chemist.addBubbles(this.link);
                    }
                }


            }

        },
        onDelete = function () {

        };


    pipel.addEventListener("move", onMove);
    piper.addEventListener("move", onMove);

    pipel.addEventListener("createBody", onCreateBody);
    piper.addEventListener("createBody", onCreateBody);

    pipel.addEventListener("link" , onLink);
    piper.addEventListener("link" , onLink);

    pipel.addEventListener("delete" , onDelete);
    piper.addEventListener("delete" , onDelete);


    pipe = createPipe(radius, length, position, piper, pipel);

    Chemist.scene.add(pipe);
    Chemist.scene.add(pipel);
    Chemist.scene.add(piper);

    Chemist.objects.push(pipe);
    Chemist.objects.push(pipel);
    Chemist.objects.push(piper);

    return pipe;

};

