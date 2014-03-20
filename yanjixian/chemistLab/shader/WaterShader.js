
THREE.WaterShader = {

	uniforms: {

		

	},

	vertexShader: [
    
        "varying float show;",
        "void main() {",
            "vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);", 
            "gl_Position = projectionMatrix * mvPosition;",
            
            "if(dot(position - vec3(0.0, 1.0, 0.0), normal) <= 0.0){",
                "show = 1.0;",
                "}else{",
                "show = -1.0;",
            "}",
        "}"

	].join("\n"),

	fragmentShader: [

		 "precision mediump float;",
         "varying float show;",
         "void main() {",
            
            "if( show >= 0.0 ) {",
                "gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);",
            "}else{",
                "discard;",
            "}",
        "}"

	].join("\n")

};
