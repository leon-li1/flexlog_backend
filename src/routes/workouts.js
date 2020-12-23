const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");
const { Workout } = require("../models/workout");
const { User } = require("../models/user");
const { Exercise } = require("../models/exercise");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const Joi = require("joi");

router.get("/all", [auth, validateUser], async (req, res) => {
  const workouts = await User.findById(req.user._id)
    .populate({
      path: "workouts",
      populate: { path: "exercises" },
      select: "-_id",
    })
    .select("workouts -_id");
  res.send(workouts);
});

router.get("/:id", [auth, validateUser, validateObjectId], async (req, res) => {
  const workout = await Workout.findById(req.params.id);

  if (!workout)
    return res.status(404).send("The workout with the given ID was not found");

  if (workout.creator != req.user._id)
    return res
      .status(404)
      .send("The workout found does not belong to the current user");

  res.send(workout);
});

// {
//   "name": "PPL",
//   "numExercises": 2,
//   "eNames": ["Curls", "bench"],
//   "eSets": [2,2],
//   "eWeights": [[30, 40],[40, 45]],
//   "eReps": [[12, 10],[8, 6]]
// }

const validate = (req) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    numExercises: Joi.number().min(1).required(),
    eNames: Joi.array().items(Joi.string().min(3).max(20).required()),
    eSets: Joi.array().items(Joi.number().min(1).required()),
    eWeights: Joi.array().items(
      Joi.array().items(Joi.number().min(1).required())
    ),
    eReps: Joi.array().items(Joi.array().items(Joi.number().min(1).required())),
  });
  return schema.validate(req);
};

router.post("/add", [auth, validateUser], async (req, res) => {
  const { body } = req;
  const { error } = validate(body);
  if (error) return res.status(400).send(error.details[0].message);

  let exercises = new Array();
  let tmpExercise;

  for (let i = 0; i < body.numExercises; i++) {
    // create exercise
    tmpExercise = {
      name: body.eNames[i],
      sets: body.eSets[i],
      weights: body.eWeights[i],
      reps: body.eReps[i],
      scores: new Array(),
    };
    for (let set = 0; set < tmpExercise.sets; set++)
      tmpExercise.scores.push(tmpExercise.weights[set] * tmpExercise.reps[set]);
    tmpExercise.pr = Math.max.apply(null, tmpExercise.scores); //TODO: find max in the loop
    tmpExercise = await new Exercise(tmpExercise).save();
    exercises.push(tmpExercise);
  } //extract this to helper func

  // create workout
  let workout = await new Workout({
    name: body.name,
    numExercises: body.numExercises,
    exercises: exercises,
  }).save();

  // update the user
  const user = await User.findByIdAndUpdate(req.user._id, {
    $push: { workouts: workout._id },
    $inc: { numWorkouts: 1 },
  });

  workout = await Workout.findByIdAndUpdate(
    workout._id,
    { creator: user._id },
    { new: true }
  );
  res.send(workout);
});

const validateUpdate = (req) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(20),
    numExercises: Joi.number().min(0),
    eNames: Joi.array().items(Joi.string().min(3).max(20)),
    numExistingExercises: Joi.number().min(0),
    existingExercises: Joi.array().items(Joi.objectId()),
    eSets: Joi.array().items(Joi.number().min(1)),
    eWeights: Joi.array().items(Joi.array().items(Joi.number().min(1))),
    eReps: Joi.array().items(Joi.array().items(Joi.number().min(1))),
  });
  return schema.validate(req);
};

const removeWorkout = async (req, res) => {
  const workout = await Workout.findById(req.params.id);

  if (!workout)
    return res.status(404).send("The workout with the given ID was not found.");

  if (workout.creator != req.user._id)
    return res
      .status(404)
      .send("The workout found does not belong to the current user");

  workout.exercises.forEach(async (exerciseId) => {
    await Exercise.findByIdAndRemove(exerciseId);
  });

  const deletedworkout = await Workout.findByIdAndRemove(req.params.id);

  await User.findByIdAndUpdate(deletedworkout.creator, {
    $pull: { workouts: deletedworkout._id },
    $inc: { numWorkouts: -1 },
  });

  res.send(deletedworkout);
};

// {
//   "eNames": ["Curls", "bench", "Pec deck"],
//   "numExercises": 3,
//   "numExistingExercises": 2,
//   "existingExercises": ["5fe2dbcf550aec4b2c5ab438", "5fe2dbcf550aec4b2c5ab439"],
//   "eSets": [3,2],
//   "eWeights": [[20, 30, 40],[50, 55]],
//   "eReps": [[15, 12, 10],[8, 6]]
// }
router.patch(
  "/update/:id",
  [auth, validateUser, validateObjectId],
  async (req, res) => {
    const { body } = req;
    const { error } = validateUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let workout = await Workout.findById(req.params.id);

    if (!workout)
      return res
        .status(404)
        .send("The workout with the given ID was not found");

    if (workout.creator != req.user._id)
      return res
        .status(404)
        .send("The workout found does not belong to the current user");

    if (req.body.numExercises === 0) return removeWorkout(req, res);

    // remove unused exercises
    const unusedExercises = workout.exercises.filter(
      (id) => !body.existingExercises.includes(id)
    );
    unusedExercises.forEach(async (id) => {
      await Exercise.findByIdAndRemove(id);
    });

    let exercises = new Array();
    let tmpExercise;

    for (let i = 0; i < body.numExercises; i++) {
      tmpExercise = {
        sets: body.eSets[i],
        weights: body.eWeights[i],
        reps: body.eReps[i],
        scores: new Array(),
      };
      for (let set = 0; set < tmpExercise.sets; set++)
        tmpExercise.scores.push(
          tmpExercise.weights[set] * tmpExercise.reps[set]
        );
      tmpExercise.pr = Math.max.apply(null, tmpExercise.scores); //TODO: find max in the loop
      // check if exercise exists
      if (i < body.numExistingExercises) {
        tmpExercise = await Exercise.findByIdAndUpdate(
          body.existingExercises[i],
          tmpExercise
        );
      } else {
        tmpExercise.name = body.eNames[i];
        tmpExercise = await new Exercise(tmpExercise).save();
      }
      exercises.push(tmpExercise);
    } //extract this to helper func

    // create workout
    workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        name: body.name,
        numExercises: body.numExercises,
        exercises: exercises,
      },
      { new: true }
    );

    res.send(workout);
  }
);

router.delete(
  "/delete/:id",
  [auth, validateUser, validateObjectId],
  removeWorkout
);

module.exports = router;
