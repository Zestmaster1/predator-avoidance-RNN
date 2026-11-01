# Predator Avoidance RNN - evolutionary algorithm

Simple recurrent neural network evolutionary algorithm, agents evolve to balance their need for energy acquisition and fleeing from predators (drawn as red circles), which kill them upon contact.
Neural networks consist of an input layer, a fully recurrent hidden layer, and an output layer.

Each generation, the top agents of the generation (surviving individuals with the most accumulated energy) are selected for breeding via tournament selection, with a chance of mutation that affects the childs weights/biases.
Agents can sense the distance-normalized dot/cross products of the nearest food item, as well as the nearest predator, along side their own starvation level.

The graph on the right depicts trends across generations by plotting normalized values of the final surviving population of each generation, such as population size, average starvation, average energy, genetic diversity, & predator count.

Once a predator has captured an agent or is no longer pursuing an agent, it is moved to a random location to prevent clumping, and has a short cooldown to ensure fairness for agents and to reduce evolutionary noise.
