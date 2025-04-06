let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Events = Matter.Events;

let engine = Engine.create();
let world = engine.world;

let canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let render = Render.create({
  element: document.body,
  engine: engine,
  canvas: canvas,
  options: {
    width: canvas.width,
    height: canvas.height,
    wireframes: false,
    background: "transparent"
  }
});

Render.run(render);
let runner = Runner.create();
Runner.run(runner, engine);

let ground = Bodies.rectangle(canvas.width / 2, canvas.height - 40, canvas.width, 40, { isStatic: true, render: { fillStyle: "brown" } });
World.add(world, ground);

let equipmentImages = [
  "https://upload.wikimedia.org/wikipedia/commons/6/6f/Stopwatch_2.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/4e/Simple_balance_scale.svg",
  "https://upload.wikimedia.org/wikipedia/commons/b/bb/Spring-scale.svg"
];

let currentIndex = 0;
let textureBodies = [];
let loadedTextures = [];

function preloadImages(sources, callback) {
  let count = 0;
  sources.forEach((src, index) => {
    let img = new Image();
    img.onload = () => {
      loadedTextures[index] = img;
      count++;
      if (count === sources.length) callback();
    };
    img.src = src;
  });
}

function createEquipmentBody(x, y) {
  let texture = equipmentImages[currentIndex];
  let body = Bodies.rectangle(x, y, 80, 80, {
    density: 0.004,
    restitution: 0.6,
    render: {
      sprite: {
        texture: texture,
        xScale: 0.2,
        yScale: 0.2
      }
    }
  });
  currentIndex = (currentIndex + 1) % equipmentImages.length;
  return body;
}

preloadImages(equipmentImages, () => {
  let rock = createEquipmentBody(150, 450);
  let anchor = { x: 150, y: 450 };

  let elastic = Constraint.create({
    pointA: anchor,
    bodyB: rock,
    stiffness: 0.05,
    render: { strokeStyle: "red" }
  });

  World.add(world, [rock, elastic]);

  let mouse = Mouse.create(render.canvas);
  let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });

  World.add(world, mouseConstraint);
  render.mouse = mouse;

  let previousRock = null;
  let launchTime = null;
  let initialPosition = null;

  Events.on(mouseConstraint, "enddrag", function(event) {
    if (event.body === rock) {
      launchTime = Date.now();
      initialPosition = { x: rock.position.x, y: rock.position.y };
    }
  });

  Events.on(engine, "afterUpdate", function () {
    if (mouseConstraint.mouse.button === -1 && (rock.position.x > 170 || rock.position.y < 430)) {
      if (previousRock) {
        World.remove(world, previousRock);
      }
      previousRock = rock;
      rock = createEquipmentBody(150, 450);
      World.add(world, rock);
      elastic.bodyB = rock;
    }
  });

  Events.on(engine, "beforeRender", function () {
    Render.lookAt(render, {
      min: { x: rock.position.x - 200, y: 0 },
      max: { x: rock.position.x + 200, y: canvas.height }
    });
  });

  Events.on(engine, "collisionStart", function(event) {
    event.pairs.forEach(pair => {
      if (pair.bodyA === ground || pair.bodyB === ground) {
        let endTime = Date.now();
        let timeTaken = (endTime - launchTime) / 1000;
        let finalPosition = rock.position;
        let distance = Math.sqrt(Math.pow(finalPosition.x - initialPosition.x, 2) + Math.pow(finalPosition.y - initialPosition.y, 2));
        let velocity = Math.sqrt(Math.pow(rock.velocity.x, 2) + Math.pow(rock.velocity.y, 2));
        let acceleration = velocity / timeTaken;

        document.getElementById("speedLabel").innerText = velocity.toFixed(2);
        document.getElementById("distanceLabel").innerText = distance.toFixed(2);
        document.getElementById("accelerationLabel").innerText = acceleration.toFixed(2);
        document.getElementById("displacementLabel").innerText = distance.toFixed(2);
      }
    });
  });
  

  document.getElementById("resetButton").addEventListener("click", function() {
    location.reload();
  });

  document.getElementById("QuitButton").addEventListener("click", function() {
    let confirmQuit = confirm("Are you sure you want to quit?");
    if (confirmQuit) {
      window.location.href = "index.html";
    }
  });
});