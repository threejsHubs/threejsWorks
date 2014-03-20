(function(Chemist){
    var o, i, equips = Chemist.Equips, liquids = Chemist.Chemicals.liquids, solids = Chemist.Chemicals.solids, gases = Chemist.Chemicals.gases;
    
    var onMouseMove = function (event) {
       
        Chemist.mouse.x = event.offsetX / Chemist.canvasWidth * 2 - 1;
        Chemist.mouse.y = - event.offsetY / Chemist.canvasHeight * 2 + 1;
        Chemist.hovered = (Chemist.getIntersects()[0] || null )&& Chemist.getIntersects()[0].object;



        //得到重叠元素
        if (Chemist.selected) {
            Chemist.selected.intersectVessel = Chemist.getIntersectVessel(Chemist.selected);
            if (  Chemist.selected.intersectVessel && (!Chemist.selected.oldIntersectVessel || Chemist.selected.intersectVessel !== Chemist.selected.oldIntersectVessel) ) {
                if(!Chemist.selected.oldIntersectVessel || Chemist.selected.oldIntersectVessel.name !== "ironSupport") {

                    Chemist.selected.oldIntersectVessel = Chemist.selected.intersectVessel;
                }
            }
        }

        //移动烧杯，撤销倒水任务
        if ( Chemist.selected && Chemist.selected.getStatus() === Chemist.status.pouring ) {
                discardScaleLevel(event);
                Chemist.selected.status.pop();
        }

        //颜色反应
        if(Chemist.selected){
            //移动棒子
            if ( Chemist.selected.intersectVessel && !Chemist.selected.fire && Chemist.selected.intersectVessel.fire && Chemist.selected.type === Chemist.type.tool) {
                generateFire(Chemist.selected, new THREE.Vector3(0, 0.5, 0), Chemist.selected.stuff.burningColor);
            }else if(Chemist.selected.fire && (!Chemist.selected.intersectVessel || !Chemist.selected.intersectVessel.fire) && Chemist.selected.type === Chemist.type.tool && Chemist.selected !== Chemist.Tools.match ) {
                Chemist.scene.remove(Chemist.selected.fire);
                Chemist.selected.fire = null;
            }
            //移动火
            if(Chemist.selected.intersectVessel && Chemist.selected.fire && !Chemist.selected.intersectVessel.fire && Chemist.selected.intersectVessel.type === Chemist.type.tool) {
                generateFire(Chemist.selected.intersectVessel, new THREE.Vector3(0, 0.5, 0), Chemist.selected.intersectVessel.stuff.burningColor);
            }else if (Chemist.selected.oldIntersectVessel && Chemist.selected.oldIntersectVessel.fire && (!Chemist.selected.intersectVessel || !Chemist.selected.intersectVessel.fire ) && Chemist.selected.oldIntersectVessel.type === Chemist.type.tool  && Chemist.selected.oldIntersectVessel !== Chemist.Tools.match) {
                Chemist.scene.remove(Chemist.selected.oldIntersectVessel.fire);
                Chemist.selected.oldIntersectVessel.fire = null;
            }
        }

    };
    
    var onMouseDown = function (event) {

        Chemist.selected = Chemist.hovered;
        
        console.log(Chemist.selected);
        
         if (Chemist.selected !== null && Chemist.selected.type !== Chemist.type.platform && Chemist.selected.getStatus() !== Chemist.status.influxing) {
            readyToMove(event);
            document.addEventListener("mousemove", moveObject, false );
         } else if (Chemist.selected !== null && Chemist.selected.scaleLevel &&  Chemist.selected.getStatus() === Chemist.status.influxing) {
            readyToMoveScaleLevel(event);
            document.addEventListener("mousemove", moveScaleLevel, false);
         }
         
        //移除移动桌子
        document.removeEventListener("mousemove",Chemist.verdictPlaneMove, false);
    };
    
    var onMouseUp = function (event) {
        var intersectVessel ;

        if (Chemist.selected !== null){
            intersectVessel = Chemist.selected.intersectVessel;

            if (  (Chemist.selected.type === Chemist.type.vessel || Chemist.selected.type === Chemist.type.container) ) {   //容器行为

                if (Chemist.selected.getStatus() === Chemist.status.moving) {
                    moveVesselOver(event);
                    document.removeEventListener("mousemove", moveObject, false );
                }else if (Chemist.selected.getStatus() === Chemist.status.influxing && Chemist.selected.scaleLevel && Chemist.selected.scaleLevel.getStatus() === Chemist.status.moving) {
                    moveScaleLevelOver(event);
                    document.removeEventListener("mousemove", moveScaleLevel, false );
                }
                if (Chemist.selected.getStatus() === Chemist.status.normal && intersectVessel && intersectVessel.getStatus() === Chemist.status.normal ) {
                    generateScaleLevel(event);
                }

            }else if ( Chemist.selected.type === Chemist.type.tool) {  //移动工具

                 if (Chemist.selected.getStatus() === Chemist.status.moving) {
                    moveToolsOver(event);
                    document.removeEventListener("mousemove", moveObject, false );
                 }
                if (intersectVessel && Chemist.selected.fire && intersectVessel.canFire === true && !intersectVessel.fire) {
                    generateFire(intersectVessel, new THREE.Vector3(0, 0.8, 0), null, true);
                }

            }else if ( Chemist.selected.type === Chemist.type.instrument) {   //移动设备

                 if (Chemist.selected.getStatus() === Chemist.status.moving || Chemist.selected.getStatus() === Chemist.status.linking) {
                        moveEquipsOver(event);
                    document.removeEventListener("mousemove", moveObject, false );
                 }
            }


             Chemist.selected = null;
        }

        //移动桌子
       document.addEventListener("mousemove", Chemist.verdictPlaneMove, false);
    };
    
    var readyToMove = function (event) {
            var intersect;
            event.target.style.cursor = "pointer";
              //得到交点，计算offset
            if( event.button === 0 ){
                intersect = Chemist.getIntersect(Chemist.virtualPlaneH);
            }else if (event.button === 2) {
                intersect = Chemist.getIntersect(Chemist.virtualPlaneV);
            }
            Chemist.offset.subVectors(Chemist.selected.position, intersect.point);
    };

    //移动所有物体
    var moveObject = function (event) {
            if ( ! Chemist.selected || Chemist.selected.type === Chemist.type.platform ) {
                return;
            }

            if(Chemist.selected.getStatus() === Chemist.status.normal) {
                Chemist.selected.status.push(Chemist.status.moving);
            }

             var intersect = null;
            //得到交点位置，移动selected
             if( event.button === 0 ){
                intersect = Chemist.getIntersect(Chemist.virtualPlaneH);
            }else if (event.button === 2) {
                intersect = Chemist.getIntersect(Chemist.virtualPlaneV);
            }
            var position = intersect.point.add(Chemist.offset);

            Chemist.moveObj(Chemist.selected, position);

    };


    //移动容器over
    var moveVesselOver = function (event) {
           var sele =  Chemist.selected;
         if( event.button === 0 ){
            Chemist.selected.position.y = Chemist.beakerPosition.y;
        }else if (event.button === 2) {
            //放开右键，使selected回到桌面
            Chemist.selected.position.y = Chemist.beakerPosition.y;
        }

        //烧杯
        if (sele.name === "beaker" ) {

            if(sele.oldIntersectVessel && sele.oldIntersectVessel.beaker === sele) {
                sele.oldIntersectVessel.beaker = null;
                sele.oldIntersectVessel = null;
                sele.onIronSupport = false;
            }

            if(sele.intersectVessel && sele.intersectVessel.name === "ironSupport" && !sele.intersectVessel.beaker && !sele.intersectVessel.testTube){
                sele.intersectVessel.beaker = sele;
                sele.intersectVessel.clamp.visible = false;
                sele.intersectVessel.ring.visible = true;
                sele.onIronSupport = true;
                Chemist.moveObj(sele, sele.intersectVessel.position.clone().add(sele.intersectVessel.beakerPosition));
            }

        }

        //试管
        if (sele.name === "testTube" ) {

            if(sele.oldIntersectVessel && sele.oldIntersectVessel.testTube === sele) {
                sele.oldIntersectVessel.testTube = null;
                sele.oldIntersectVessel = null;
                sele.onIronSupport = false;
            }

            if(sele.intersectVessel && sele.intersectVessel.name === "ironSupport" && !sele.intersectVessel.beaker && !sele.intersectVessel.testTube){
                sele.intersectVessel.testTube = sele;
                sele.intersectVessel.clamp.visible = true;
                sele.intersectVessel.ring.visible = false;
                sele.onIronSupport = true;
                Chemist.moveObj(sele, sele.intersectVessel.position.clone().add(sele.intersectVessel.tubePosition));
            }

        }

        if( Chemist.selected.pipes && Chemist.selected.pipes.length > 0 ) {
            for (var i = Chemist.selected.pipes.length - 1 ; i >= 0; i--) {
                var pipe = Chemist.selected.pipes[i];
                pipe.dispatchEvent({type: "createBody", position : pipe.position});
            }
        }
        
        //修正位置
      Chemist.moveObj(Chemist.selected);


        //超出桌面的selected抛弃
        if ( Chemist.isDiscard(Chemist.selected) ) {
            Chemist.removeObj(Chemist.selected);
        }

        if (Chemist.selected.getStatus() === Chemist.status.moving) {
            Chemist.selected.status.pop();
        }
    };

    //移动tools over
      var moveToolsOver = function () {
          Chemist.selected.position.y = Chemist.stickPosition.y;

          //修正位置
          Chemist.moveObj(Chemist.selected);

          //超出桌面的selected抛弃
          if ( Chemist.isDiscard(Chemist.selected) ) {
              Chemist.removeObj(Chemist.selected);
              for (var k in Chemist.Tools){
                if( Chemist.selected === Chemist.Tools[k]){
                    Chemist.Tools[k] = null;
                }
              }
          }

          if (Chemist.selected.getStatus() === Chemist.status.moving) {
              Chemist.selected.status.pop();
          }
      };

    //移动instrument over  , 酒精灯等
      var moveEquipsOver = function () {
          var sele =Chemist.selected;
         sele.position.y = Chemist.beakerPosition.y;

           //导管
          if(sele.name === "pipe") {

                if (sele.getStatus() === Chemist.status.linking || (sele.body &&sele.body.getStatus() === Chemist.status.linking) )  {
                    //有绑定

                    if (sele.left) {
                        //select是主体
                       sele.position.y = Chemist.pipePosition.y;
                        if (sele.left.fixed) {
                            var left =sele.left;
                            left.material.opacity = 0.3;
                            Chemist.objects.push(left);
                            left.link.pipes.remove(left);
                            left.link = null;
                            left.fixed = false;
                        }
                        if (sele.right.fixed) {
                            var right =sele.right;
                            right.material.opacity = 0.3;
                            Chemist.objects.push(right);
                            right.link.pipes.remove(right);
                            right.link = null;
                            right.fixed = false;
                        }

                       sele.status.pop();
                        Chemist.moveObj(sele);
                    }else if (sele.body) {
                        //select是两侧分支
                       sele.position.y = Chemist.pipePosition.y -sele.length / 2;

                        //绑定事件
                        if(sele.intersectVessel &&sele.intersectVessel.type === Chemist.type.vessel) {

                           sele.dispatchEvent({type:"link"});
                            //修正位置
                            Chemist.moveObj(sele);
                        }

                       sele.dispatchEvent({type:"createBody", position:sele.position});


                    }
                }else {
                    //未绑定

                  if (sele.left) {
                      //select是主体
                     sele.position.y = Chemist.pipePosition.y;

                      //为两侧分支计算intersectVessel
                     sele.left.intersectVessel = Chemist.getIntersectVessel(sele.left);
                     sele.right.intersectVessel = Chemist.getIntersectVessel(sele.right);

                      //监测绑定，并触发绑定事件
                       if(sele.left.intersectVessel &&sele.left.intersectVessel.type === Chemist.type.vessel && !sele.left.link) {
                          sele.left.dispatchEvent({type:"link"});
                           //修正位置
                           Chemist.moveObj(sele.left);
                       }else if (sele.right.intersectVessel &&sele.right.intersectVessel.type === Chemist.type.vessel && !sele.right.link) {
                          sele.right.dispatchEvent({type:"link"});
                           //修正位置
                           Chemist.moveObj(sele.right);
                       }

                  }else if (sele.body) {
                      //select是两侧分支
                     sele.position.y = Chemist.pipePosition.y -sele.length / 2;

                      //计算另一边的intersectVessel
                     sele.anotherSide.intersectVessel = Chemist.getIntersectVessel(sele.anotherSide);

                      //监测绑定，并触发绑定事件
                      if(sele.intersectVessel &&sele.intersectVessel.type === Chemist.type.vessel) {

                           sele.dispatchEvent({type:"link"});
                          //修正位置
                          Chemist.moveObj(sele);
                      }else if (sele.anotherSide.intersectVessel &&sele.anotherSide.intersectVessel.type === Chemist.type.vessel) {
                         sele.anotherSide.dispatchEvent({type:"link"});
                          //修正位置
                          Chemist.moveObj(sele.anotherSide);
                      }

                  }


                }

          }

          //酒精灯
          if (sele.name === "burner") {

              if(sele.oldIntersectVessel && sele.oldIntersectVessel.burner === sele) {
                  sele.oldIntersectVessel.burner = null;
                  sele.oldIntersectVessel = null;
                  sele.onIronSupport = false;
              }

              if( sele.intersectVessel && sele.intersectVessel.name === "ironSupport" && !sele.intersectVessel.burner){
                   sele.intersectVessel.burner = sele;
                  sele.onIronSupport = true;
                  Chemist.moveObj(sele, sele.intersectVessel.position.clone().add(sele.intersectVessel.burnerPosition));
              }

          }

          //铁架台
          if (sele.name === "ironSupport") {
                //TODO
             sele.position.y = Chemist.center.y;

              Chemist.moveObj(sele);
          }

          if (sele.name === "ironSupport_bar") {
              //TODO
             sele.base.position.y = Chemist.center.y;

              Chemist.moveObj(sele.base);

          }


          //超出桌面的selected抛弃
          if ( Chemist.isDiscard(sele) ) {
             Chemist.removeObj(sele);
          }

          if (sele.getStatus() === Chemist.status.moving) {
             sele.status.pop();
          }
      };
    
    //移动scaleLevel
      var readyToMoveScaleLevel = function (event) {
            var intersect;
            event.target.style.cursor = "s-resize";
              //得到交点，计算offset
            intersect = Chemist.getIntersect(Chemist.virtualPlaneV);
            Chemist.offset.subVectors(Chemist.selected.position, intersect.point);
    };
    
    var moveScaleLevel = function (event) {
       if ( (!Chemist.selected) || Chemist.selected.type === Chemist.type.platform ) {
            return;
        }
        
        var intersect  ;
        
        Chemist.selected.scaleLevel.status.push(Chemist.status.moving);
        //得到交点位置，移动selected
        intersect = Chemist.getIntersect(Chemist.virtualPlaneV);
        Chemist.selected.scaleLevel.position.y = intersect.point.add(Chemist.offset).y;
        
         var maxHightLevel = Chemist.getBoundingBox(Chemist.selected).size().y + Chemist.beakerPosition.y;
        if (Chemist.selected.scaleLevel.position.y > maxHightLevel) {
            Chemist.selected.scaleLevel.position.y = maxHightLevel;
        }
       
    };
    
    var moveScaleLevelOver = function (event) {

        //设置液体高度
        if (Chemist.selected.target.liquid) {
            Chemist.selected.oldWaterHeight = Chemist.selected.waterHeight;
            Chemist.selected.waterHeight = (Chemist.selected.scaleLevel.position.y - Chemist.beakerPosition.y) / Chemist.selected.height;
            Chemist.selected.target.oldWaterHeight = Chemist.selected.target.waterHeight;
            //修正液体高度
            if ( Chemist.selected.waterHeight > Chemist.selected.oldWaterHeight + Chemist.selected.target.oldWaterHeight && Chemist.selected.target.type === Chemist.type.vessel) {
                Chemist.selected.waterHeight = Chemist.selected.oldWaterHeight + Chemist.selected.target.oldWaterHeight;
            }
            if (Chemist.selected.waterHeight > Chemist.selected.oldWaterHeight){
                Chemist.selected.target.waterHeight = Chemist.selected.target.oldWaterHeight - (Chemist.selected.waterHeight - Chemist.selected.oldWaterHeight) ;
            }else{
                Chemist.selected.waterHeight = Chemist.selected.oldWaterHeight;
            }
        }

        //设置固体高度
        if ( Chemist.selected.target.solid ) {
            Chemist.selected.oldSolidHeight = Chemist.selected.solidHeight;
            Chemist.selected.solidHeight = (Chemist.selected.scaleLevel.position.y - Chemist.beakerPosition.y) / Chemist.selected.height;
            Chemist.selected.target.oldSolidHeight = Chemist.selected.target.solidHeight;
            //修正
            if ( Chemist.selected.solidHeight > Chemist.selected.oldSolidHeight + Chemist.selected.target.oldSolidHeight && Chemist.selected.target.type === Chemist.type.vessel) {
                Chemist.selected.solidHeight = Chemist.selected.oldSolidHeight + Chemist.selected.target.oldSolidHeight;
            }
            if (Chemist.selected.solidHeight > Chemist.selected.oldSolidHeight){
                Chemist.selected.target.solidHeight = Chemist.selected.target.oldSolidHeight - (Chemist.selected.solidHeight - Chemist.selected.oldSolidHeight) ;
            }else{
                Chemist.selected.solidHeight = Chemist.selected.oldSolidHeight;
            }
        }


        if(Chemist.selected.target.liquid || Chemist.selected.target.solid) {
            var args = Chemist.beforeDump(Chemist.selected.target, Chemist.selected);
            Chemist.selected.args =  args;

        }

        Chemist.selected.hasSetLevel = true;
        //删除scaleLeve
        discardScaleLevel(event);
    };
    
    var generateScaleLevel = function (event) {
         var intersectVessel = Chemist.selected.intersectVessel;
     
         if ( intersectVessel && intersectVessel.type === Chemist.type.vessel) {
                Chemist.readyToDump(Chemist.selected, intersectVessel);
                intersectVessel.scaleLevel = Chemist.addScaleLevel(intersectVessel);
                
                Chemist.selected.status.push( Chemist.status.pouring);
                intersectVessel.status.push(Chemist.status.influxing);
        }
    };
    
    var discardScaleLevel = function (event) {
        if (Chemist.selected.scaleLevel && Chemist.selected.scaleLevel.getStatus() === Chemist.status.moving) {
            Chemist.selected.scaleLevel.status.pop();
            Chemist.scene.remove(Chemist.selected.scaleLevel);
            Chemist.selected.scaleLevel = null;
        }


        if (Chemist.selected.oldIntersectVessel && Chemist.selected.oldIntersectVessel.scaleLevel ) {
            Chemist.scene.remove(Chemist.selected.oldIntersectVessel.scaleLevel);
            Chemist.selected.oldIntersectVessel.status.pop();
            Chemist.selected.oldIntersectVessel.scaleLevel = null;
            Chemist.selected.oldIntersectVessel = null;
        }

    };

    /**
     * 生成火
     * @param obj 生火的对象
     * @param offset
     * @param color
     * @param disappear 点火后火柴是否消失
     */
    var generateFire = function (obj, offset, color, disappear) {
        Chemist.addFire(obj, 0.8, color, offset);
        if (disappear && obj.target){
            Chemist.scene.remove(obj.target);
            Chemist.scene.remove(obj.target.fire);
            Chemist.objects.remove(obj.target);
            if(obj.target === Chemist.Tools.match) {
                Chemist.Tools.match = null;
            }
            obj.target = null;
        }
    };


    
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mousemove", Chemist.verdictPlaneMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("mousedown", onMouseDown, false);
    window.addEventListener("resize", Chemist.onWindowResize, false);
    
    
    //以下代码需要重构


})(Chemist);