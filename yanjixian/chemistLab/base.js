/**
 * 基类
 * @param options : type 器材类型, ot 中心到杯嘴向量, canFire 是否能点燃, detail, scale 大小缩放, direct 器材朝向,name 名字
 * @constructor
 */
Chemist.Base = function (options) {

    this.type = options.type;
    this.status = [Chemist.status.normal];

    //底部圆心到杯嘴向量
    this.ot = options.ot;
    if (this.ot) {
        this.ot.multiplyScalar(options.scale||1);
    }
    this.direct = options.direct;

    //体积参数
    this.geometry.computeBoundingBox();
    var size = this.geometry.boundingBox.size();
    this.height = size.y * (options.scale || 1) ;
    this.radius = size.x * (options.scale || 1) /2 ;

    //固体，液体
    this.waterHeight = 0;
    this.solidHeight = 0;
    this.solidCount = 0;
    this.currentNum = 0; //固体的实时个数仅用于dumpSolid

    //导管
    this.pipes = [];

    //火焰
    this.canFire = !!options.canFire;
    if (options.canFire) {
        this.fire = null;
    }

    this.onIronSupport = false;

    this.detail = Chemist.clone(options.detail);
    this.name = options.name || options.detail.id;

};