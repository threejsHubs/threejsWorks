/*
 * pillar.js - generate the water column .
 * version 0.01
 * author yanjixian
 *
 * This class is dependent on threejs and sparksjs.
 * render方法中需要有：
 *              pillar.geometry.verticesNeedUpdate = true;
 *              pillar.geometry.colorsNeedUpdate = true;
 *
 *
 */

THREE.Pillar = function (position, size, color, length, flow) {

	var pillar,
	particles,
	material,
	emitterpos,
	sparksEmitter,
	args = {};
	// Create particle objects for Three.js

	var Pool = {
		__pools : [],
		get : function () {
			if (this.__pools.length > 0) {
				return this.__pools.pop();
			}
			console.log("pool ran out!")
			return null;
		},
		// Release a vector back into the pool
		add : function (v) {
			this.__pools.push(v);
		}
	};

	args.size = size || 10;
	args.color = color || new THREE.Color(0xffffff);
	args.length = length || 1.0;
	args.flow = flow || 0.0;
	args.position = position;

	particles = new THREE.Geometry();
	for (i = 0; i < 2000; i++) {
		particles.vertices.push(new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY));
		particles.colors.push(new THREE.Color(0x000000)); ////background color
		Pool.add(i);
	}

	var sprite = new THREE.Texture(generateSprite(args.color));
	sprite.needsUpdate = true;
	material = new THREE.ParticleBasicMaterial({
			size : args.size,
			map : sprite,
	//		blending : THREE.AdditiveBlending,
			depthTest : true,
			transparent : true,
			vertexColors : THREE.VertexColors
		});
	pillar = new THREE.ParticleSystem(particles, material);
 
	pillar.args = args;

	// EMITTER STUFF
	sparksEmitter = new SPARKS.Emitter(new SPARKS.SteadyCounter(500)); //每秒创建的离子数
	emitterpos = new THREE.Vector3( Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY );
	sparksEmitter.addInitializer( new SPARKS.Position( new SPARKS.PointZone( emitterpos ) ) ); //设置初始位置，PointZone从指定点开始
	sparksEmitter.addInitializer(new SPARKS.Lifetime(args.length, args.length + 0.2)); //粒子存在时间（0到1秒）
	sparksEmitter.addInitializer(new SPARKS.Target(null, setTargetParticle)); //初始化时运行回调函数, 并设置回调函数的结果为 the particle's target.
	sparksEmitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(0, -3, 0)))); //设置速度
	sparksEmitter.addAction(new SPARKS.Age()); //handle the lifetime of each particle
	sparksEmitter.addAction(new SPARKS.Accelerate(0, -0, 0)); //设置一个运动的加速度
	sparksEmitter.addAction(new SPARKS.Move()); //使粒子运动
	sparksEmitter.addAction( new SPARKS.RandomDrift( flow, 10, flow ) );   //粒子位置的最大摆动

	sparksEmitter.addCallback(SPARKS.EVENT_PARTICLE_CREATED, onParticleCreated);
	sparksEmitter.addCallback(SPARKS.EVENT_PARTICLE_DEAD, onParticleDead);
	sparksEmitter.start();
	// End Particles

	return pillar;

	function setTargetParticle() {
		var target = Pool.get();
		return target;
	}

	function onParticleCreated(particle) {
		var position = particle.position,
		target = particle.target;
		if (target) {
			emitterpos.copy(args.position);
			particles.colors[target].setRGB(1, 1, 1);
			particles.vertices[target] = position;
		}
	}

	function onParticleDead(particle) {
		var target = particle.target;
		if (target) {
			particles.vertices[target].set(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
			particles.colors[target].setRGB(0, 0, 0); //background color
			Pool.add(target);
		}
	}

	function generateSprite(color) {

		var canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 32;

		var context = canvas.getContext('2d');

        var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
		
		gradient.addColorStop(0.0, 'rgba(' + Math.round(color.r * 255) + ',' + Math.round(color.g * 255) + ',' + Math.round(color.b * 255) + ',1.0)');
		gradient.addColorStop(0.5, 'rgba(' + Math.round(color.r * 255) + ',' + Math.round(color.g * 255) + ',' + Math.round(color.b * 255) + ',0.8)');
		gradient.addColorStop(1, 'rgba(' + Math.round(color.r * 255) + ',' + Math.round(color.g * 255) + ',' + Math.round(color.b * 255) + ',0.3)');
		context.fillStyle = gradient;
        context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI*2);
        context.fill();

		return canvas;

	}

};