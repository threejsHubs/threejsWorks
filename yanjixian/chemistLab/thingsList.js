(function (Chemist) {
    //桌布
    var tp = "textures/",
        ip = "images/";
    Chemist.TableClothes = [
        {
            name: "blue",
            url: tp + "Blue.jpg"
        },
        {
            name: "travel",
            url: tp + "Travel.jpg"
        },
        {
            name: "wow",
            url: tp + "WoW.jpg"
        }
    ];
        
        //器材
    Chemist.Equips = {
        beaker : {
            name : "烧杯",
            id : "beaker",
            img : ip + "beaker.jpg",
            create : function () {
                Chemist.Beaker(Chemist.beakerPosition);
            }
        },

        burner : {
            name : "酒精灯",
            id : "burner",
            img : ip + "burner.jpg",
            create : function () {
                Chemist.Burner(Chemist.beakerPosition);
            }
        },

        testTube : {
            name : "试管",
            id : "testTube",
            img : ip + "testTube.jpg",
            create : function () {
                Chemist.TestTube(Chemist.beakerPosition);
            }
        },

        pipe : {
            name : "导管",
            id : "pipe",
            img : ip + "pipe.jpg",
            create : function () {
                Chemist.Pipe(Chemist.pipePosition);
            }
        },

        ironSupport : {
            name : "铁架台",
            id: "ironSupport",
            img : ip + "ironSupport.jpg",
            create : function () {
                Chemist.IronSupport(Chemist.center);
            }
        }
        
    };
    
    Chemist.Chemicals = {
        solids : {
            sodium : {
                id : "Na",
                key : "sodium",
                name : "钠",
                img : ip + "sodium.jpg",
                color : 0xffffff,
                solutionColor : null,     //溶液颜色
                burningColor : 0xF4FE81,
                ingredient : ["sodium"], //成分
                meltingPoint : 97  //摄氏度
            },
            copper : {
                id : "Cu",
                key : "copper",
                name : "铜",
                img : ip + "copper.jpg",
                color : 0xB58442,
                solutionColor : null,
                burningColor : 0x0EA107,
                ingredient : ["copper"], //成分
                meltingPoint : 1084
            },
            zinc : {
                id : "Zn",
                key : "zinc",
                name : "锌",
                img : ip + "zinc.jpg",
                color : 0xA7B3D0,
                solutionColor : null,
                burningColor : 0x33C6FA,
                ingredient : ["zinc"], //成分
                meltingPoint : 419.5
            },
            copperOxide : {
                id : "CuO",
                key : "copperOxide",
                name : "氧化铜",
                img : ip + "copperOxide.jpg",
                color : 0x352621,
                solutionColor : null,
                burningColor : 0xF4FE81,
                ingredient : ["copperOxide"], //成分
                meltingPoint : 1326
            },
            copperHydroxide : {
                id : "CuOH2",
                key : "copperHydroxide",
                name : "氢氧化铜",
                img : ip + "copperHydroxide.jpg",
                color : 0x0159FC,
                solutionColor : null,
                burningColor : null,
                ingredient : ["copperHydroxide"], //成分
                meltingPoint : 80
            },
            calciumCarbonate : {
                id : "CaCO3",
                key : "calciumCarbonate",
                name : "碳酸钙",
                img : ip + "calciumCarbonate.jpg",
                color : 0xFFFFFF,
                solutionColor : null,
                burningColor : null,
                ingredient : ["calciumCarbonate"], //成分
                meltingPoint : 825
            }
        },

        liquids : {
            water : {
                id : "H2O",
                key : "water",
                name : "水",
                img : ip + "water.jpg",
                color : 0x5E89CB,
                ingredient : [], //成分
                percent : 0.0,
                ph : 7
            },
            sodiumHydroxide : {
                id : "NaOH",
                key : "sodiumHydroxide",
                name : "氢氧化钠",
                img : ip + "sodiumHydroxide.jpg",
                color : 0x5E89CB,
                ingredient : ["sodiumHydroxide"], //成分
                percent : 0.5,
                ph : 10
            },
            hydrochloricAcid : {
                id : "HCl",
                key : "hydrochloricAcid",
                name : "盐酸",
                img : ip + "hydrochloricAcid.jpg",
                color : 0x5E89CB,
                ingredient : ["hydrochloricAcid"], //成分
                percent : 0.4,
                ph : 4
            },
            phenolphthalein : {
                id : "C20H14O4",
                key : "phenolphthalein",
                name : "酚酞",
                img : ip + "phenolphthalein.jpg",
                color : 0x5E89CB,
                ingredient : ["phenolphthalein"], //成分
                percent : 0,
                ph : 0
            },
            sulfuricAcid : {
                id : "H2SO4",
                key : "sulfuricAcid",
                name : "硫酸",
                img : ip + "sulfuricAcid.jpg",
                color : 0x5E89CB,
                ingredient : ["sulfuricAcid"],
                percent : 0.98,
                ph : 0
            },
            copperSulfate : {
                id : "CuSO4",
                key: "copperSulfate",
                name: "硫酸铜",
                img : ip + "copperSulfate.jpg",
                color : 0x217BF3,
                ingredient: ["copperSulfate"],
                percent : 0.1,
                ph : 4
            },
            sodiumBicarbonate : {
                id : "NaHCO3",
                key : "sodiumBicarbonate",
                name : "碳酸氢钠",
                img : ip + "sodiumBicarbonate.jpg",
                color : 0x5E89CB,
                ingredient : ["sodiumBicarbonate"], //成分
                percent: 0.5,
                ph: 9
            },
            calciumHydroxide : {
                id : "CaOH2",
                key : "calciumHydroxide",
                name : "氢氧化钙",
                img : ip + "calciumHydroxide.jpg",
                color : 0x5E89CB,
                ingredient : ["calciumHydroxide"], //成分
                percent: 0.02,
                ph: 12
            }

        },

        gases : {
            hydrogen: {
                id: "H2",
                key: "hydrogen",
                name: "氢气",
                color : null,
                burningColor : 0x8DA9EA,
                ingredient: ["hydrogen"]
            },
            carbonDioxide: {
                id: "CO2",
                key: "carbonDioxide",
                name: "二氧化碳",
                color : null,
                burningColor : null,
                ingredient: ["carbonDioxide"]
            }

        }
    };
        
    Chemist.Sounds = {
    
    };
    
    Chemist.Tools = {
        glassBar : null,
        match : null,
        phPaper : null,
        thermometer : null
    };
    
    Chemist.Tips = {
    
    };
    
    Chemist.Equations = {
    
    };
})(Chemist);
