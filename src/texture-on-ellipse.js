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
import beanTexture from "./coffee-bean01.png";


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

// --- Helper: superellipse with blunter ends (ellipse-like but wider tips) ---
function createSuperellipseBeanSolid(x, y, {
  rx = 28,          // horizontal radius-ish
  ry = 24,          // vertical radius-ish
  nx = 2.6,         // >2 => blunter left/right tips (2 = perfect ellipse)
  ny = 2.0,         // keep ~2 to stay ellipse-like vertically
  segments = 84,    // smoothness
  style = { fillStyle: "#ff7f50", strokeStyle: "#111", lineWidth: 1 } // visible
} = {}) {
  const verts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const px = rx * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / nx);
    const py = ry * Math.sign(st) * Math.pow(Math.abs(st), 2 / ny);
    verts.push({ x: px, y: py });
  }

  // Build convex polygon from the vertex loop
  const body = Bodies.fromVertices(
    x, y,
    [verts],
    {
      restitution: 0.1,
      friction: 0.05,
      frictionAir: 0.01,
      render: style,
      label: "bean"
    },
    true
  );

  // Defensive fallback in case fromVertices returns null (shouldn't for this convex set)
  if (!body) {
    const r = Math.max(rx, ry);
    return Bodies.polygon(x, y, 14, r, {
      restitution: 0.1,
      friction: 0.05,
      frictionAir: 0.01,
      render: style,
      label: "bean-fallback"
    });
  }

  return body;
}


// ---- Beans ---- 
function addBeansAsImages(n = 70) {
  const w = render.options.width;
  const beans = [];

  for (let i = 0; i < n; i++) {
    const base = 20 + Math.random() * 5;   // overall size
    const rx = base * 1.4;                 // wider than tall
    const ry = base * 1.05;
    const x  = 60 + Math.random() * Math.max(0, w - 120);
    const y  = -i * 40 - 60;

    const bean = createSuperellipseBeanSolid(x, y, {
      rx, ry,
      nx: 2.7,   // tweak 2.3–3.2 for blunter tips
      ny: 2.0,
      segments: 84,
      style: { fillStyle: "#F7A", strokeStyle: "#111", lineWidth: 1 }
    });

    beans.push(bean);
  }

  Composite.add(world, beans);
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
addBeansAsImages();
makeBallsDraggable();

window.addEventListener("resize", handleResize);
