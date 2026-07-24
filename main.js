const world = document.getElementById("world");
const ctx = world.getContext("2d");
world.width = 2000;
world.height = 2000;

let populationDisplay = document.getElementById("popDisplay");
let oldGenDisplay = document.getElementById("oldGenDisplay");
let newGenDisplay = document.getElementById("newGenDisplay");

const inputNodes = 6;
const hiddenNodes = 20;
const outputNodes = 2;

const mutationDelta = 0.5;
const mutationRate = 0.2;
const parameterMutationChance = 0.05;
const seeRange = 150;
const foodRate = 0.2;

let population = [];
let allFood = [];
let predators = [];
let simSpeed = 1;

function wrappedDist(a, b, range) {
  let d = b - a;

  if (d > range / 2) d -= range;
  if (d < -range / 2) d += range;

  return d;
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

function softsign(x) {
  return x / (1 + Math.abs(x));
}

let stepCounter = 0;

function step() {
  stepCounter++;

  for (let i = 0; i < simSpeed; i++) {
    for (let ind of population) ind.update();
    for (let ind of allFood) ind.age++;
    for (let ind of predators) ind.update();

    population = population.filter(ind => ind.energy > 0);
    allFood = allFood.filter(ind => ind.age < 1000);

    if (population.length <= 10 && population.length > 0) {
      let newInds = [];
      for (let ind of population) newInds.push(ind.reproduce());
      population.push(...newInds);

      // for (let i = 0; i < 10; i++) population.push(new Agent());
    }

    if (Math.random() < foodRate) allFood.push(new Food());
  }

  if (stepCounter % 50 === 0) {
    if (population.length > 0) {
      let allGens = [];
      for (let ind of population) allGens.push(ind.generation);

      populationDisplay.textContent = population.length;
      oldGenDisplay.textContent = Math.min(...allGens);
      newGenDisplay.textContent = Math.max(...allGens);
    } else {
      populationDisplay.textContent = 0;
      oldGenDisplay.textContent = 0;
      newGenDisplay.textContent = 0;
    }

    stepCounter = 0;
  }

  draw();
  setTimeout(() => step(), 1);
}

ctx.strokeStyle = "red";
ctx.lineWidth = 3;

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);
  
  //food
  ctx.fillStyle = "black";
  for (let ind of allFood) {
    ctx.fillRect(ind.x - 3, ind.y - 3, 6, 6);
  }

  // agents
  for (let ind of population) {
    // ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
    // ctx.beginPath();
    // ctx.arc(ind.x, ind.y, seeRange, 0, Math.PI * 2);
    // ctx.fill();
    // ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.arc(ind.x, ind.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(ind.x, ind.y);
    let x = ind.x + 20 * Math.cos(ind.angle);
    let y = ind.y + 20 * Math.sin(ind.angle);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // predators
  ctx.fillStyle = "red";
  for (let ind of predators) {
    ctx.beginPath();
    ctx.arc(ind.x, ind.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleInput() {
  simSpeed = Number(document.getElementById("simSpeed").value);
}

for (let i = 0; i < 20; i++) population.push(new Agent());

step();
