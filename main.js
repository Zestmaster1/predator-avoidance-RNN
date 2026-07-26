const world = document.getElementById("world");
const ctx = world.getContext("2d");
world.width = 2000;
world.height = 2000;

const graph = document.getElementById("graph");
const graphCtx = graph.getContext("2d");
graph.width = 450;
graph.height = 300;

let populationDisplay = document.getElementById("popDisplay");
let generationDisplay = document.getElementById("genDisplay");
let predatorDisplay = document.getElementById("predDisplay");
let stepsLeftDisplay = document.getElementById("stepsLeft");

const inputNodes = 6;
const hiddenNodes = 20;
const outputNodes = 2;

const mutationDelta = 0.5;
const mutationRate = 0.1;
const parameterMutationChance = 0.01;
const seeRange = 150;
const foodRate = 0.2;
const populationSize = 100;
const maxGenerationlength = 15000;
const genePoolSize = 20;
const crossoverChance = 0.5;
const predatorCooldown = 200;
const foodCount = 100;

let population = [];
let allFood = [];
let predators = [];

let simSpeed = 1;
let predSpeed = 0.25;
let mutation = true;

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
let lastBest;

function step() {
  for (let i = 0; i < simSpeed; i++) {
    stepCounter--;

    for (let ind of population) ind.update();
    for (let ind of predators) ind.update();
    for (let ind of allFood) {
      ind.timer++;

      if (ind.timer === 2500) {
        ind.x = Math.random() * world.width;
        ind.y = Math.random() * world.height;
        ind.timer = 0;
      }
    }

    population = population.filter(ind => ind.energy >= 0);

    // if (stepCounter % (maxGenerationlength / 2) === 0) updateGraph();

    if (population.length <= genePoolSize || stepCounter <= 0) {
      updateGraph();
      population.sort((a, b) => b.energy - a.energy);
      lastBest = population[0];

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

        for (let i = 0; i < populationSize - 1; i++) {
          if (i === 0) newPopulation.push(lastBest.reproduce(lastBest));

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

      stepCounter = maxGenerationlength;
    }

    displayStats();
  }

  draw();
  setTimeout(() => step(), 1);
}

function displayStats() {
  let allGens = [];
  for (let ind of population) allGens.push(ind.generation);
  generationDisplay.textContent = Math.max(...allGens);

  populationDisplay.textContent = population.length;
  predatorDisplay.textContent = predators.length;
  stepsLeftDisplay.textContent = stepCounter;
}

function handleInput() {
  simSpeed = Number(document.getElementById("simSpeed").value);
  predSpeed = Number(document.getElementById("predSpeed").value);
  mutation = document.getElementById("mutation").checked;
}

let speciesThreshold = 0;

function diversity() {
  let representatives = [];

  for (let agent of population) {
    let found = false;

    for (let rep of representatives) {
      if (
        genomeDistance(agent.neuralNet,rep.neuralNet) <= speciesThreshold
      ) {
        found = true;
        break;
      }
    }

    if (!found) {
      representatives.push(agent);
    }
  }

  return representatives.length;
}

function genomeDistance(a, b) {
  let d = 0;

  for (let i = 0; i < hiddenNodes; i++) {
    d += Math.abs(
      a.B_hidden[i] -
      b.B_hidden[i]
    );
  }

  return d;
}

graphCtx.lineWidth = 5;
graphCtx.globalAlpha = 0.75;

let dataSpan = 20;

let popPoints = new Array(dataSpan).fill(0);
let predPoints = new Array(dataSpan).fill(0);
let inertiaPoints = new Array(dataSpan).fill(0);
let diversityPoints = new Array(dataSpan).fill(0);

function updateGraph() {
  graphCtx.clearRect(0, 0, graph.width, graph.height);

  // grid
  graphCtx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  // vertical grid
  for (let i = 0; i < dataSpan; i++) {
    let x = (i / (dataSpan - 1)) * graph.width;

    graphCtx.beginPath();
    graphCtx.moveTo(x, 0);
    graphCtx.lineTo(x, graph.height);
    graphCtx.stroke();
  }

  // horizontal grid
  for (let i = 0; i <= 10; i++) {
    let y = (i / 10) * graph.height;

    graphCtx.beginPath();
    graphCtx.moveTo(0, y);
    graphCtx.lineTo(graph.width, y);
    graphCtx.stroke();
  }

  popPoints.splice(0, 1);
  popPoints.push(population.length);
  predPoints.splice(0, 1);
  predPoints.push(predators.length);
  inertiaPoints.splice(0, 1);
  let inertiaSum = 0;
  for (let ind of population) inertiaSum += ind.neuralNet.inertia;
  inertiaPoints.push(inertiaSum / population.length);
  diversityPoints.splice(0, 1);
  diversityPoints.push(diversity() / population.length);

  // population
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

  // predators
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

  // avg inertia
  graphCtx.strokeStyle = "rgba(0, 0, 255, 0.5)";
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

  // diversity
  graphCtx.strokeStyle = "rgba(50, 255, 0, 0.5)";
  for (let i = 0; i < diversityPoints.length - 1; i++) {
    let x = (i / (diversityPoints.length - 1)) * graph.width;
    let y = graph.height - (diversityPoints[i]) * graph.height;

    graphCtx.beginPath();
    graphCtx.moveTo(x, y);
    let x2 = ((i + 1) / (diversityPoints.length - 1)) * graph.width;
    let y2 = graph.height - (diversityPoints[i + 1]) * graph.height;
    graphCtx.lineTo(x2, y2);
    graphCtx.stroke();
  }
}

ctx.strokeStyle = "red";
ctx.lineWidth = 3;

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);
  // ctx.fillStyle = "white";
  // ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  // ctx.fillRect(0, 0, world.width, world.height);
  
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

for (let i = 0; i < populationSize; i++) population.push(new Agent());
for (let i = 0; i < 10; i++) predators.push(new Predator(predatorCooldown));
for (let i = 0; i < foodCount; i++) allFood.push(new Food());
lastBest = population[0];

step();