import "./styles.css";
import {
  Engine,
  Render,
  Runner,
  Composite,
  Bodies,
  Mouse,
  MouseConstraint,
} from "matter-js";

const engine = Engine.create();
const world = engine.world;

const canvas = document.getElementById("bean-canvas");

const render = Render.create({
  engine,
  canvas,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
    pixelRatio: window.devicePixelRatio,
  },
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Ensure initial size & DPR are correct
Render.setSize(render, window.innerWidth, window.innerHeight);
Render.setPixelRatio(render, window.devicePixelRatio);

// ---- Walls ----
let walls = [];
function buildWalls() {
  if (walls.length) {
    Composite.remove(world, walls);
    walls = [];
  }

  const w = render.options.width;
  const h = render.options.height;
  const t = 100;

  const floor = Bodies.rectangle(w / 2, h + t / 2, w, t, { isStatic: true });
  const left = Bodies.rectangle(-t / 2, h / 2, t, h, { isStatic: true });
  const right = Bodies.rectangle(w + t / 2, h / 2, t, h, { isStatic: true });

  walls = [floor, left, right];
  Composite.add(world, walls);
}

// ---- Balls ---- 
function addBalls(n = 200) {
  const w = render.options.width;
  const balls = [];

  for (let i = 0; i < n; i++) {
    const r = 20 + Math.random() * 15;
    const x = 60 + Math.random() * Math.max(0, w - 120);
    const y = -i * 40 - 60;

    balls.push(
      Bodies.circle(x, y, r, {
        restitution: 0.1,
        friction: 0.05,
        frictionAir: 0.01,
      })
    );
  }

  Composite.add(world, balls);
}

// ---- Dragging ----
let mouse; // hoist so resize can touch pixelRatio
function makeBallsDraggable() {
  mouse = Mouse.create(canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      angularStiffness: 0.2,
      render: { visible: false },
    },
  });
  Composite.add(world, mouseConstraint);
  render.mouse = mouse;
}

// ---- Resize: use Render helpers, don't touch canvas.width/height directly ----
function handleResize() {
  Render.setSize(render, window.innerWidth, window.innerHeight);
  Render.setPixelRatio(render, window.devicePixelRatio);
  if (mouse) mouse.pixelRatio = window.devicePixelRatio;
  buildWalls();
}


// init

buildWalls();
addBalls();
makeBallsDraggable();

window.addEventListener("resize", handleResize);
