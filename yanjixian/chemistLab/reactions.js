Chemist.Reactions = {
    //NaOH+HCL
    "hydrochloricAcid+sodiumHydroxide" : {
        //反应条件，满足返回true，vessel是容器
        condition : function (vessel) {
            return true;
        },
        //反应现象
        phenomenon : function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x5E89CB );
            
            if (this.delta === 100) {
                result.push("sodiumChloride");
                result.target = vessel;
                callback && callback(result);
            }
            
        },
        //反应信息
        info : function () {
            Chemist.utils.info("<div>NaOH + HCl = NaCl + H<sub>2</sub>O</div>");
        },
        delta : 0 //反应程度0-100
    },
    //NaOH + HCl + 酚酞
    "hydrochloricAcid+pphenolphthalein+sodiumHydroxide" : {
        condition : function (vessel) {
            return true;
        },
        phenomenon : function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x5E89CB );
            
            if (this.delta === 100) {
                result.push("sodiumChloride");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info : function () {
            Chemist.utils.info("<div>NaOH + HCl = NaCl + H<sub>2</sub>O</div>");
        },
        delta : 0
    },
    //NaOH+酚酞
    "phenolphthalein+sodiumHydroxide" : {
        condition : function (vessel) {
            return true;
        },
        phenomenon : function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex(0xF621AD);
            
            if (this.delta === 100) {
                //反应后的结果
                result.push("sodiumHydroxide");
                result.push("pphenolphthalein");  //pphenolphthalein表示不存在的酚酞
                result.target = vessel;
                callback && callback(result);
            }
        },
        info : function () {
            Chemist.utils.info("<div>NaOH 遇酚酞变成红色。</div>");
        },
        delta : 0
    },
    //NaOH+H2SO4
    "sodiumHydroxide+sulfuricAcid": {
        condition : function (vessel) {
            return true;
        },
        phenomenon: function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x5E89CB );

            if (this.delta === 100) {
                result.push("sodiumSulfate");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info: function () {
            Chemist.utils.info("<div>2NaOH + H<sub>2</sub>SO<sub>4</sub> = Na<sub>2</sub>SO<sub>4</sub> + 2H<sub>2</sub>O</div>");
        },
        delta: 0
    },
    //NaOH + H2SO4 + 酚酞
    "pphenolphthalein+sodiumHydroxide+sulfuricAcid" : {
        condition : function (vessel) {
            return true;
        },
        phenomenon : function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x5E89CB );

            if (this.delta === 100) {
                result.push("sodiumSulfate");
                result.push("pphenolphthalein");  //pphenolphthalein表示不存在的酚酞
                result.target = vessel;
                callback && callback(result);
            }
        },
        info : function () {
            Chemist.utils.info("<div>2NaOH + H<sub>2</sub>SO<sub>4</sub> = Na<sub>2</sub>SO<sub>4</sub> + 2H<sub>2</sub>O</div>");
        },
        delta : 0
    },
    //NaOH+CuSO4
    "copperSulfate+sodiumHydroxide": {
        condition : function (vessel) {
            return true;
        },
        phenomenon: function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x217BF3 );

            if(this.delta === 40) {
                vessel.sediment = Chemist.addSediment(vessel, 0x0159FC);
            }
            if(this.delta === 100) {
                result.push("sodiumSulfate");
                result.push("copperHydroxide");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info: function () {
            Chemist.utils.info("<div>2NaOH + CuSO<sub>4</sub> = Na<sub>2</sub>SO<sub>4</sub> + Cu(OH)<sub>2</sub></div>");
        },
        delta: 0
    },
    //Zn+HCl
    "hydrochloricAcid+zinc" : {
        condition : function (vessel) {
            return true;
        },
        phenomenon: function (vessel, callback) {
            var liquid = vessel.liquid, result = [];
            liquid.material.color.setHex( 0x5E89CB );

            if(this.delta === 40) {
                vessel.gas = {};
                vessel.gas.detail = Chemist.clone(Chemist.Chemicals.gases["hydrogen"]);
                vessel.gas.bubbles = Chemist.addBubbles(vessel);
            }
            if(this.delta === 100) {
                result.push("zincChloride");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info: function () {
            Chemist.utils.info("<div>Zn + 2HCl = ZnCl<sub>2</sub> + H<sub>2</sub>↑</div>");
        },
        delta: 0
    },
    //加热NaHCO3
    "sodiumBicarbonate" : {
        condition : function (vessel) {
            if (vessel.onIronSupport && vessel.intersectVessel && vessel.intersectVessel.burner) {
                return vessel.intersectVessel.burner.fire;
            }
            return false;
        },
        phenomenon: function (vessel, callback) {
            var  result = [];

            if(this.delta === 40) {
                vessel.gas = {};
                vessel.gas.detail = Chemist.clone(Chemist.Chemicals.gases["carbonDioxide"]);
                vessel.gas.bubbles = Chemist.addBubbles(vessel);
            }
            if(this.delta === 100) {
                result.push("sodiumCarbonate");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info: function () {
            Chemist.utils.info("<div>2NaHCO<sub>3</sub> ≜ Na<sub>2</sub>CO<sub>3</sub> + CO<sub>2</sub>↑ + H<sub>2</sub>O</div>");
        },
        delta: 0
    },
    //CO2+CaCO3
    "calciumHydroxide+carbonDioxide" : {
        condition : function (vessel) {
            return true;
        },
        phenomenon: function (vessel, callback) {
            var result = [];
            vessel.material.color.setHex(0xF2F2F2);

            if(this.delta === 40) {
                vessel.sediment = Chemist.addSediment(vessel, 0xFAFBFD);
            }
            if(this.delta === 100) {
                result.push("calciumCarbonate");
                result.target = vessel;
                callback && callback(result);
            }
        },
        info: function () {
            Chemist.utils.info("<div>CO<sub>2</sub> + CaCO<sub>3</sub> = CaCO<sub>3</sub>↓ + H<sub>2</sub>O</div>");
        },
        delta: 0
    }
};