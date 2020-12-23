const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");
const { validateWokout, validateUpdate } = require("../middleware/validate");
const { Workout } = require("../models/workout");
const { User } = require("../models/user");
const { Exercise } = require("../models/exercise");
const { addStar } = require("./points");
const express = require("express");
const router = express.Router();

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

  if (!workout || workout.creator != req.user._id)
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

router.post("/add", [auth, validateUser], async (req, res) => {
  const { body } = req;
  const { error } = validateWokout(body);
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
  let user = await User.findById(req.user._id);
  const newNumWorkouts = user.numWorkouts + 1;
  user.workouts.push(workout._id);
  user.numWorkouts = newNumWorkouts;
  await user.save();

  workout = await Workout.findByIdAndUpdate(
    workout._id,
    { creator: user._id },
    { new: true }
  );

  if (newNumWorkouts === user.nextStar) user = await addStar(user._id);

  res.send(user);
});

const removeWorkout = async (req, res) => {
  const workout = await Workout.findById(req.params.id);

  if (!workout || workout.creator != req.user._id)
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
//   "name":"PPL",
//   "eNames": ["Curls", "bench", "Pec deck"],
//   "numExercises": 3,
//   "numExistingExercises": 2,
//   "existingExercises": ["5fe2dbcf550aec4b2c5ab438", "5fe2dbcf550aec4b2c5ab439"],
//   "eSets": [3,2,1],
//   "eWeights": [[20, 30, 40],[50, 55],[25]],
//   "eReps": [[15, 12, 10],[8, 6],[5]]
// }

router.patch(
  "/update/:id",
  [auth, validateUser, validateObjectId],
  async (req, res) => {
    const { body } = req;
    const { error } = validateUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let workout = await Workout.findById(req.params.id);

    if (!workout || workout.creator != req.user._id)
      return res
        .status(404)
        .send("The workout found does not belong to the current user");

    if (req.body.numExercises === 0) return removeWorkout(req, res);

    // remove unused exercises
    const unusedExercises = workout.exercises.filter((id) =>
      body.existingExercises.includes(id)
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
