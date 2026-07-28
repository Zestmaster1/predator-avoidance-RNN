class Agent {
  constructor(x, y, neuralNet, generation) {
    this.x = x ?? Math.random() * world.width;
    this.y = y ?? Math.random() * world.height;
    this.neuralNet = neuralNet ?? new NeuralNet();
    this.angle = Math.random() * Math.PI * 2;
    this.energy = 0;

    this.fx = Math.cos(this.angle);
    this.fy = Math.sin(this.angle);

    this.generation = generation ?? 0;

    this.uploaded = false;
  }

  update() {
    this.senseNearestFood();
    this.senseNearestPredator();

    this.neuralNet.update();
    
    this.angle += this.neuralNet.V_output[0] / 10;
    let speed = Math.max(0, this.neuralNet.V_output[1]) / 1.5;
    this.x += Math.cos(this.angle) * speed;
    this.y += Math.sin(this.angle) * speed;

    this.fx = Math.cos(this.angle);
    this.fy = Math.sin(this.angle);

    if (this.x < 0) this.x += world.width;
    if (this.y < 0) this.y += world.height;
    if (this.x > world.width) this.x -= world.width;
    if (this.y > world.height) this.y -= world.height;
  }

  senseNearestFood() {
    let nearest;
    let minDist = seeRange ** 2;

    for (let ind of allFood) {
      let dx = wrappedDist(this.x, ind.x, world.width);
      let dy = wrappedDist(this.y, ind.y, world.height);
      let distSq = dx * dx + dy * dy;

      if (distSq < 10 ** 2) {
        // allFood.splice(allFood.indexOf(ind), 1);
        ind.age = Infinity;
        ind.x = Math.random() * world.width;
        ind.y = Math.random() * world.height;
        this.energy++;
        break;
      }

      if (distSq < minDist) {
        nearest = ind;
        minDist = distSq;
      }
    }

    if (nearest) {
      let dx = wrappedDist(this.x, nearest.x, world.width);
      let dy = wrappedDist(this.y, nearest.y, world.height);
      let dist = Math.sqrt(dx * dx + dy * dy);

      this.neuralNet.V_input[0] = dot(dx, dy, this.fx, this.fy) / dist;
      this.neuralNet.V_input[1] = cross(dx, dy, this.fx, this.fy) / dist;
      this.neuralNet.V_input[2] = 1 - dist / seeRange;
    }
  }

  senseNearestPredator() {
    let nearest;
    let minDist = seeRange ** 2;

    for (let ind of predators) {
      let dx = wrappedDist(this.x, ind.x, world.width);
      let dy = wrappedDist(this.y, ind.y, world.height);
      let distSq = dx * dx + dy * dy;

      if (distSq < minDist) {
        nearest = ind;
        minDist = distSq;
      }

      if (distSq < ind.nearestAgent.distSq) {
        ind.nearestAgent.agent = this;
        ind.nearestAgent.distSq = distSq;
      }
    }

    if (nearest) {
      let dx = wrappedDist(this.x, nearest.x, world.width);
      let dy = wrappedDist(this.y, nearest.y, world.height);
      let dist = Math.sqrt(dx * dx + dy * dy);

      this.neuralNet.V_input[3] = dot(dx, dy, this.fx, this.fy) / dist;
      this.neuralNet.V_input[4] = cross(dx, dy, this.fx, this.fy) / dist;
      this.neuralNet.V_input[5] = 1 - dist / seeRange;
    }
  }

  reproduce(mate) {
    let childNeuralNet = this.neuralNet.crossover(mate.neuralNet);
    if (Math.random() < mutationRate) childNeuralNet.mutate();
    let child = new Agent(null, null, childNeuralNet, this.generation + 1);
    if (uploadMarkers) {
      child.uploaded = this.uploaded ? this.uploaded : mate.uploaded;
    } else child.uploaded = false;
    return child;
  }

  export() {
    return {
      B_hidden: this.neuralNet.B_hidden,
      B_output: this.neuralNet.B_output,
      W_input_hidden: this.neuralNet.W_input_hidden,
      W_hidden_hidden: this.neuralNet.W_hidden_hidden,
      W_hidden_output: this.neuralNet.W_hidden_output,
      alpha: this.neuralNet.alpha,
      generation: this.generation
    };
  }
}

class NeuralNet {
  constructor(random = true) {
    this.V_input = new Array(inputNodes).fill(0);
    this.V_hidden = new Array(hiddenNodes).fill(0);
    this.V_output = new Array(outputNodes).fill(0);

    this.B_hidden = [];
    this.B_output = [];

    this.W_input_hidden = [];
    this.W_hidden_hidden = [];
    this.W_hidden_output = [];

    this.alpha = 0;

    if (random) this.initialize();
  }

  initialize() {
    // hidden node biases
    for (let i = 0; i < hiddenNodes; i++) {
      this.B_hidden.push((Math.random() - 0.5) * 3);
    }

    // output node biases
    for (let i = 0; i < outputNodes; i++) {
      this.B_output.push((Math.random() - 0.5) * 3);
    }

    // input -> hidden
    for (let i = 0; i < inputNodes; i++) {
      let row = [];
      for (let j = 0; j < hiddenNodes; j++) {
        row.push((Math.random() - 0.5) * 3);
      }
      this.W_input_hidden.push(row);
    }

    // hidden -> hidden
    for (let i = 0; i < hiddenNodes; i++) {
      let row = [];
      for (let j = 0; j < hiddenNodes; j++) {
        row.push((Math.random() - 0.5) * 3);
      }
      this.W_hidden_hidden.push(row);
    }

    // hidden -> output
    for (let i = 0; i < hiddenNodes; i++) {
      let row = [];
      for (let j = 0; j < outputNodes; j++) {
        row.push((Math.random() - 0.5) * 3);
      }
      this.W_hidden_output.push(row);
    }

    // inertia
    this.alpha = Math.random() / 2;
    // this.inertia = Math.random();
  }

  update() {
    const newHidden = new Array(hiddenNodes);

    for (let i = 0; i < hiddenNodes; i++) {
      let sum = this.B_hidden[i];

      // input -> hidden
      for (let j = 0; j < inputNodes; j++) {
        sum += this.V_input[j] * this.W_input_hidden[j][i];
      }

      // hidden -> hidden
      for (let j = 0; j < hiddenNodes; j++) {
        sum += this.V_hidden[j] * this.W_hidden_hidden[j][i];
      }

      newHidden[i] =
        (1 - this.alpha) * this.V_hidden[i] +
        this.alpha * softsign(sum);
    }

    this.V_hidden = newHidden;

    // hidden -> output
    for (let i = 0; i < outputNodes; i++) {
      let sum = this.B_output[i];

      for (let j = 0; j < hiddenNodes; j++) {
        sum += this.V_hidden[j] * this.W_hidden_output[j][i];
      }

      // this.V_output[i] =
      //   this.inertia * this.V_output[i] +
      //   (1 - this.inertia) * softsign(sum);

      this.V_output[i] = softsign(sum);
    }
    
    for (let i = 0; i < inputNodes; i++) this.V_input[i] = 0;
  }

  clone() {
    let child = new NeuralNet(false);

    child.B_hidden = this.B_hidden.slice();
    child.B_output = this.B_output.slice();

    child.W_input_hidden = this.W_input_hidden.map(r => r.slice());
    child.W_hidden_hidden = this.W_hidden_hidden.map(r => r.slice());
    child.W_hidden_output = this.W_hidden_output.map(r => r.slice());

    child.alpha = this.alpha;

    return child;
  }

  crossover(mate) {
    let child = this.clone();

    // hidden node biases
    for (let i = 0; i < hiddenNodes; i++) {
      if (Math.random() < 0.5) {
        child.B_hidden[i] = mate.B_hidden[i];
      }
    }

    // output node biases
    for (let i = 0; i < outputNodes; i++) {
      if (Math.random() < 0.5) {
        child.B_output[i] = mate.B_output[i];
      }
    }

    // input -> hidden
    for (let i = 0; i < inputNodes; i++) {
      for (let j = 0; j < hiddenNodes; j++) {
        if (Math.random() < 0.5) {
          child.W_input_hidden[i][j] = mate.W_input_hidden[i][j];
        }
      }
    }

    // hidden -> hidden
    for (let i = 0; i < hiddenNodes; i++) {
      for (let j = 0; j < hiddenNodes; j++) {
        if (Math.random() < 0.5) {
          child.W_hidden_hidden[i][j] = mate.W_hidden_hidden[i][j];
        }
      }
    }

    // hidden -> output
    for (let i = 0; i < hiddenNodes; i++) {
      for (let j = 0; j < outputNodes; j++) {
        if (Math.random() < 0.5) {
          child.W_hidden_output[i][j] = mate.W_hidden_output[i][j];
        }
      }
    }

    if (Math.random() < 0.5) child.alpha = mate.alpha;

    return child;
  }

  mutate() {
    // biases

    for (let i = 0; i < this.B_hidden.length; i++) {
      if (Math.random() < parameterMutationChance) {
        this.B_hidden[i] += (Math.random() - 0.5) * mutationDelta;
      }
    }

    for (let i = 0; i < this.B_output.length; i++) {
      if (Math.random() < parameterMutationChance) {
        this.B_output[i] += (Math.random() - 0.5) * mutationDelta;
      }
    }

    // weights

    for (let i = 0; i < this.W_input_hidden.length; i++) {
      for (let j = 0; j < this.W_input_hidden[i].length; j++) {
        if (Math.random() < parameterMutationChance) {
          this.W_input_hidden[i][j] += (Math.random() - 0.5) * mutationDelta;
        }
      }
    }

    for (let i = 0; i < this.W_hidden_hidden.length; i++) {
      for (let j = 0; j < this.W_hidden_hidden[i].length; j++) {
        if (Math.random() < parameterMutationChance) {
          this.W_hidden_hidden[i][j] += (Math.random() - 0.5) * mutationDelta;
        }
      }
    }

    for (let i = 0; i < this.W_hidden_output.length; i++) {
      for (let j = 0; j < this.W_hidden_output[i].length; j++) {
        if (Math.random() < parameterMutationChance) {
          this.W_hidden_output[i][j] += (Math.random() - 0.5) * mutationDelta;
        }
      }
    }

    // alpha

    if (Math.random() < parameterMutationChance) {
      this.alpha = Math.max(0, Math.min(1, this.alpha + (Math.random() - 0.5) * mutationDelta));
    }
  }
}

class Food {
  constructor() {
    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    this.timer = Math.floor(Math.random() * 2500);
  }
}

class Predator {
  constructor(cooldown) {
    this.x = Math.random() * world.width;
    this.y = Math.random() * world.height;
    this.cooldown = cooldown ?? 0;

    this.nearestAgent = { agent: null, distSq: Infinity };
  }

  update() {
    if (this.cooldown > 0) this.cooldown--;

    // prevent overlap
    for (let other of predators) {
      if (other === this) continue;

      let dx = wrappedDist(this.x, other.x, world.width);
      let dy = wrappedDist(this.y, other.y, world.height);
      let distSq = dx * dx + dy * dy;

      if (distSq < 15 ** 2) {
        this.x = Math.random() * world.width;
        this.y = Math.random() * world.height;
        this.cooldown = predatorCooldown;

        return;
      }
    }

    if (!this.cooldown) {
      let ind = this.nearestAgent.agent;
      let distSq = this.nearestAgent.distSq;

      if (distSq < 20 ** 2) {
        population.splice(population.indexOf(ind), 1);
        ind.energy -= 5;
        this.x = Math.random() * world.width;
        this.y = Math.random() * world.height;
      } else if (distSq < (seeRange - 20) ** 2) {
        let dx = wrappedDist(this.x, ind.x, world.width);
        let dy = wrappedDist(this.y, ind.y, world.height);
        let dist = Math.sqrt(distSq);

        this.x += dx / dist * predSpeed;
        this.y += dy / dist * predSpeed;
      }
    }

    this.nearestAgent = { agent: null, distSq: Infinity };

    if (this.x < 0) this.x += world.width;
    if (this.y < 0) this.y += world.height;
    if (this.x > world.width) this.x -= world.width;
    if (this.y > world.height) this.y -= world.height;
  }
}