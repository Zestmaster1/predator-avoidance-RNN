const world = document.getElementById("world");
const ctx = world.getContext("2d");
world.width = 2000;
world.height = 2000;

const graph = document.getElementById("graph");
const graphCtx = graph.getContext("2d");
graph.width = 400;
graph.height = 200;

let populationDisplay = document.getElementById("popDisplay");
let generationDisplay = document.getElementById("genDisplay");
let predatorDisplay = document.getElementById("predDisplay");
let stepsLeftDisplay = document.getElementById("stepsLeft");

const inputNodes = 6;
const hiddenNodes = 20;
const outputNodes = 2;

const mutationDelta = 0.5;
const mutationRate = 0.2;
const parameterMutationChance = 0.01;
const seeRange = 150;
const foodRate = 0.2;
const populationSize = 100;
const maxGenerationlength = 20000;
const genePoolSize = 20;
const crossoverChance = 0.25;
const predatorCooldown = 200;
const foodCount = 200;

let population = [];
let allFood = [];
let predators = [];

let simSpeed = 1;
let predSpeed = 0.25;

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

let stepCounter = maxGenerationlength;

function step() {
  for (let i = 0; i < simSpeed; i++) {
    stepCounter--;

    for (let ind of population) ind.update();
    for (let ind of predators) ind.update();

    population = population.filter(ind => ind.energy >= 0);

    // if (Math.random() < foodRate) allFood.push(new Food());

    if (population.length <= genePoolSize || stepCounter <= 0) {
      updateGraph();

      if (population.length === 0) {
        for (let i = 0; i < populationSize; i++) population.push(new Agent());
      } else {

        for (let ind of allFood) {
          ind.x = Math.random() * world.width;
          ind.y = Math.random() * world.height;
        }

        for (let ind of predators) {
          ind.x = Math.random() * world.width;
          ind.y = Math.random() * world.height;
        }

        let totalEnergy = 0;

        for (let ind of population) {
          totalEnergy += ind.energy;
        }

        let newPopulation = [];
        let mateSearchRange = Math.min(genePoolSize, population.length);

        for (let i = 0; i < populationSize; i++) {
          let r = Math.random() * totalEnergy;
          let chosen;
          
          for (let ind of population) {
            r -= ind.energy;
            if (r <= 0) {
              chosen = ind;
              break;
            }
          }

          let mate = Math.random() < crossoverChance ?
          population[Math.floor(Math.random() * mateSearchRange)] :
          chosen;
          newPopulation.push(chosen.reproduce(mate));
        }

        population = newPopulation;
      }

      let allGens = [];
      for (let ind of population) allGens.push(ind.generation);
      generationDisplay.textContent = Math.max(...allGens);

      stepCounter = maxGenerationlength;
    }
  }

  populationDisplay.textContent = population.length;
  predatorDisplay.textContent = predators.length;
  stepsLeftDisplay.textContent = stepCounter;

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
  for (let ind of predators) {
    ind.cooldown ?
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)" :
    ctx.fillStyle = "red";

    ctx.beginPath();
    ctx.arc(ind.x, ind.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

graphCtx.lineWidth = 4;
graphCtx.globalAlpha = 0.75;

let dataSpan = 15;

let popPoints = new Array(dataSpan).fill(0);
let predPoints = new Array(dataSpan).fill(0);
let inertiaPoints = new Array(dataSpan).fill(0);

function updateGraph() {
  graphCtx.clearRect(0, 0, graph.width, graph.height);

  popPoints.splice(0, 1);
  popPoints.push(population.length);
  predPoints.splice(0, 1);
  predPoints.push(predators.length);
  inertiaPoints.splice(0, 1);
  let inertiaSum = 0;
  for (let ind of population) inertiaSum += ind.neuralNet.inertia;
  inertiaPoints.push(inertiaSum / population.length);

  graphCtx.strokeStyle = "black";
  for (let i = 0; i < popPoints.length - 1; i++) {
    let x = (i / (popPoints.length - 1)) * graph.width;
    let y = graph.height - (popPoints[i] / populationSize) * graph.height;

    graphCtx.beginPath();
    graphCtx.moveTo(x, y);
    let x2 = ((i + 1) / (popPoints.length - 1)) * graph.width;
    let y2 = graph.height - (popPoints[i + 1] / populationSize) * graph.height;
    graphCtx.lineTo(x2, y2);
    graphCtx.stroke();
  }

  graphCtx.strokeStyle = "red";
  for (let i = 0; i < predPoints.length - 1; i++) {
    let x = (i / (predPoints.length - 1)) * graph.width;
    let y = graph.height - (predPoints[i] / populationSize) * graph.height;

    graphCtx.beginPath();
    graphCtx.moveTo(x, y);
    let x2 = ((i + 1) / (predPoints.length - 1)) * graph.width;
    let y2 = graph.height - (predPoints[i + 1] / populationSize) * graph.height;
    graphCtx.lineTo(x2, y2);
    graphCtx.stroke();
  }

  graphCtx.strokeStyle = "rgba(0, 255, 0, 0.5)";
  for (let i = 0; i < inertiaPoints.length - 1; i++) {
    let x = (i / (inertiaPoints.length - 1)) * graph.width;
    let y = graph.height - (inertiaPoints[i]) * graph.height;

    graphCtx.beginPath();
    graphCtx.moveTo(x, y);
    let x2 = ((i + 1) / (inertiaPoints.length - 1)) * graph.width;
    let y2 = graph.height - (inertiaPoints[i + 1]) * graph.height;
    graphCtx.lineTo(x2, y2);
    graphCtx.stroke();
  }
}

function handleInput() {
  simSpeed = Number(document.getElementById("simSpeed").value);
  predSpeed = Number(document.getElementById("predSpeed").value);
}

for (let i = 0; i < populationSize; i++) population.push(new Agent());
for (let i = 0; i < 10; i++) predators.push(new Predator(predatorCooldown));
for (let i = 0; i < foodCount; i++) allFood.push(new Food());

step();