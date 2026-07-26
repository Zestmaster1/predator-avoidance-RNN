function saveAgent(agent) {
  let data = JSON.stringify(agent.export());

  let blob = new Blob([data], {
    type: "application/json"
  });

  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "network.json";
  a.click();
}

function importAgent(data) {
  let net = new NeuralNet(false);

  net.B_hidden = data.B_hidden;
  net.B_output = data.B_output;

  net.W_input_hidden = data.W_input_hidden;
  net.W_hidden_hidden = data.W_hidden_hidden;
  net.W_hidden_output = data.W_hidden_output;

  net.inertia = data.inertia;

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
    population.push(importAgent(data));
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