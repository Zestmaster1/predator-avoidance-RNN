# Predator Avoidance RNN - evolutionary algorithm

Simple recurrent neural network evolutionary algorithm, evolves agents to balance their need for energy acquisition and fleeing from predators (drawn as red circles), which deduct their energy upon contact.
Neural networks consist of an input layer, a fully recurrent hidden layer, and an output layer.

Each generation, the top agents of the generation (surviving individuals with the most accumulated energy) are selected for breeding, with a chance of mutation that affects the childs weights/biases.
Agents can sense the distance-normalized dot/cross products of the nearest food item, as well as the nearest predator.
