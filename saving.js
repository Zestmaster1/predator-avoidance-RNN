function saveAgent(agent) {
  let data = JSON.stringify(agent.export());

  let blob = new Blob([data], {
    type: "application/json"
  });

  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "networkdownload.json";
  a.click();
}

function importAgent(data) {
  let net = new NeuralNet(false);

  net.B_hidden = data.B_hidden;
  net.B_output = data.B_output;

  net.W_input_hidden = data.W_input_hidden;
  net.W_hidden_hidden = data.W_hidden_hidden;
  net.W_hidden_output = data.W_hidden_output;

  net.alpha = data.alpha;

  let agent = new Agent(null, null, net);
  agent.generation = data.generation;

  return agent;
}

function loadAgent() {
  let input = document.getElementById("networkFile");

  if (input.files.length === 0) {
    return;
  }

  let file = input.files[0];
  let reader = new FileReader();

  reader.onload = function(event) {
    let data = JSON.parse(event.target.result);
    let agent = importAgent(data);
    if (uploadMarkers) agent.uploaded = true;
    population.push(agent);
  };

  reader.readAsText(file);
}

function refreshWithAgent() {
  let input = document.getElementById("networkFile");

  if (input.files.length === 0) return;

  let file = input.files[0];
  let reader = new FileReader();

  reader.onload = function(event) {
    let data = JSON.parse(event.target.result);

    population = [];

    for (let i = 0; i < populationSize; i++) {
      population.push(importAgent(data));
    }
  };

  reader.readAsText(file);
}

function saveWorld() {
  let world = {
    population: [],
    predators: [],
    allFood: []
  };

  for (let ind of population) {
    let agent = {};

    agent.net = ind.export();

    agent.V_input = JSON.parse(JSON.stringify(ind.neuralNet.V_input)),
    agent.V_hidden = JSON.parse(JSON.stringify(ind.neuralNet.V_hidden)),
    agent.V_output = JSON.parse(JSON.stringify(ind.neuralNet.V_output))

    agent.x = ind.x;
    agent.y = ind.y;

    agent.energy = ind.energy;
    agent.angle = ind.angle;

    world.population.push(agent);
  }

  for (let ind of predators) {
    let pred = {};

    pred.x = ind.x;
    pred.y = ind.y;
    pred.cooldown = ind.cooldown;

    world.predators.push(pred);
  }

  for (let ind of allFood) {
    let food = {};

    food.x = ind.x;
    food.y = ind.y;
    food.timer = ind.timer;

    world.allFood.push(food);
  }

  world.stepCounter = stepCounter;
  world.predSpeed = predSpeed;
  world.crossoverChance = crossoverChance;
  world.mutationRate = mutationRate;

  let data = JSON.stringify(world);

  let blob = new Blob([data], {
    type: "application/json"
  });

  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "worldsave.json";
  a.click();

  URL.revokeObjectURL(a.href);
}

function loadWorld(data) {
  let input = document.getElementById("worldFile");

  if (input.files.length === 0) return;

  let file = input.files[0];
  let reader = new FileReader();

  reader.onload = function(event) {
    let data = JSON.parse(event.target.result);

    population = [];
    allFood = [];
    predators = [];

    for (let agentData of data.population) {
      let agent = importAgent(agentData.net);
      agent.angle = agentData.angle;
      agent.energy = agentData.energy;
      agent.x = agentData.x;
      agent.y = agentData.y;
      
      agent.neuralNet.V_input = agentData.V_input;
      agent.neuralNet.V_hidden = agentData.V_hidden;
      agent.neuralNet.V_output = agentData.V_output;

      agent.fx = Math.cos(agent.angle);
      agent.fy = Math.sin(agent.angle);

      population.push(agent);
    }

    for (let foodData of data.allFood) {
      let food = new Food();
      food.x = foodData.x;
      food.y = foodData.y;
      food.timer = foodData.timer;

      allFood.push(food);
    }

    for (let predData of data.predators) {
      let pred = new Predator(predatorCooldown);
      pred.x = predData.x;
      pred.y = predData.y;
      pred.cooldown = predData.cooldown;

      predators.push(pred);
    }

    stepCounter = data.stepCounter;
    mutationRate = data.mutationRate;
    crossoverChance = data.crossoverChance;
    predSpeed = data.predSpeed;

    document.getElementById("mutationRate").value = mutationRate;
    document.getElementById("crossoverChance").value = crossoverChance;
    document.getElementById("predSpeed").value = predSpeed;
  };

  reader.readAsText(file);
}