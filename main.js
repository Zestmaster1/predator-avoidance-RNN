const world = document.getElementById("world");
const ctx = world.getContext("2d");
world.width = 2000;
world.height = 2000;

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
    for (let ind of allFood) ind.age++;
    for (let ind of predators) ind.update();

    population = population.filter(ind => ind.energy >= 0);
    allFood = allFood.filter(ind => ind.age < 1000);

    if (Math.random() < foodRate) allFood.push(new Food());

    // if (population.length <= 10 && population.length > 0) {
    //   let newInds = [];
    //   for (let ind of population) newInds.push(ind.reproduce());
    //   population.push(...newInds);

    //   // for (let i = 0; i < 10; i++) population.push(new Agent());
    // }

    if (population.length <= 20 || stepCounter <= 0) {
      if (population.length === 0) {
        for (let i = 0; i < populationSize; i++) population.push(new Agent());
      } else {
        allFood = [];
        for (let ind of predators) {
          ind.x = Math.random() * world.width;
          ind.y = Math.random() * world.height;
        }

        let totalEnergy = 0;

        for (let ind of population) {
          totalEnergy += ind.energy;
        }

        let newPopulation = [];

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

          newPopulation.push(chosen.reproduce());
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
  ctx.fillStyle = "red";
  for (let ind of predators) {
    ctx.beginPath();
    ctx.arc(ind.x, ind.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleInput() {
  simSpeed = Number(document.getElementById("simSpeed").value);
  predSpeed = Number(document.getElementById("predSpeed").value);
}

for (let i = 0; i < populationSize; i++) population.push(new Agent());
for (let i = 0; i < 5; i++) predators.push(new Predator());

step();
