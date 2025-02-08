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

