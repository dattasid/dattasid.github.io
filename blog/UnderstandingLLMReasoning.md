# Understanding LLM Reasoning

Just some thoughts about how AI reasons.

### Neural Networks are _intuition_ engines

#### What is intuition?

Intuition is when we humans reach a prediction or come to a conclusion, given some data, without being able to explain it.

#### How do Neural Networks work?

Neural networks are given a lot of data which are (input, output) pairs. With this, neural networks can do a few things:

1. Return approximately correct outputs given the inputs of the training data. Yes this is same as a database, a NN usually consumes much less space than the training database.
2. Return sensible outputs given inputs not in the training data. Yes, many other statistical models can do this. However, NNs can do this with much less data which have very complex patterns.

NN achieve both by learning patterns. Without going into details, here is a intuitive way to think about it. A NN is built by folding the same structure on top of itself. So a NN learns by folding the same patterns on top of each other, thus learning deep patterns. This is similar to how any function can be represented by a Fourier Series. Yes a NN is a universal function approximator.

As an example, lets say you have a function `f(x) = sin(x/pi)`. This function has a wavelength of 1. If you train a NN on this function in range `[0, 5]`, then ask for a value at 6.1, it wil probably correctly answer based on periodicity. This reult will be harder to get from a different method, unless the method is told to expected periodicity or trigonometric function. (Note that small scale NN experiments often produce unpredictable results.)

#### Parallel of NN pattern learing and intuition

How NN predict patterns can be thought very similar to how intuition works for us. (IMHO its is exactly the same).

I do not think we should call this reasoning.

### Step by Step reasoning

#### What is it?

When a LLM is asked to think step by step, they usually produce correct result much more easily, specially for complex problems. One example is working out a math problem step by step, instead of trying to guess the answer directly. Since it is very unlikely the LLM has seen the same or similar problem before.

This is called chain of thought.

#### Why does it work?

It is kind of obvious really. In a complex process, trying to learn the final answer from input variables leads to a state explosion, and will require a tremendoes amount of data and a huge model to train. Whereas, learning individual rules is much much easier. Predicting one step, then operating again on the output of the last step, is really a simple procedure that can lead to the correct answer..

Here is a example. Let us say our task is to predict the state of a chess board after 50 moves.

The average number of moves on a chess board is 35. Which means, starting from a certain state, we can end up with 35^50 possible states, which is approximately 10^78.

To learn this function, we will need a huge number of (starting state, ending state) pairs to train on. Probably a significant fraction of this 10^78 number. We will also need a very large model.

Now let us say, let us not directly predict 50 moves ahead. Let us predict only 10 moves ahead. While still a daunting task, the number of possible states is only 35^10, which is approximately only 10^18. So we can do this with a much smaller model, and much smaller amount of data.

Then, let us apply this model 5 times, each time predicting 10 moves ahead. Now we have predicted 50 moves, but using a much smaller model that was much easier to train!

#### Some curious side thoughts

##### If we stack the 10 move model 5 times, can we call it a 50 move model?

Yes we can!

Remember that you can only train the model as a 10 move model, _then_ stack it. You cannot train the 5-stack model directly, because you will be back at the original problem of training the 50 move model.

##### Will a 50 move model secretly divide itself into 5 layers and train like 5 10-move models?

It might! It might not. We will not be enforcing it to produce valid board states every 20% of the way. This is why the 10-move model remain a better idea.

### All (useful) reasoning is intuitive reasoning

I remember the day when, our professor tried to prove `1+1=2` in class. From first principles, using first order logic.

It turned out to be a much bigger endeveur than I thought. The proof did not fit on one blackboard.

Proving anything using first order logic was so cumbersome, and involved so many steps, we were glad that we were using a different paradigm in real life: "human order logic."

Most real life reasoning involves a large amount of "step jumps", 

AIs main job is to provide good step jumps to reason with.

Currently AI is also used to reason in places where we dont want to input all the correct steps to a automatic prover. (ir Wold model)

It is currently difficult to deduce what intuitive rules has a LLM learned.


