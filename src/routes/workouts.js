const express = require("express");
const router = express.Router();
const { Workout } = require("../models/workout");
const { User } = require("../models/user");
const { Exercise } = require("../models/exercise");
const { addStar } = require("./points");
const cookieParser = require("cookie-parser")();
const auth = require("../middleware/auth");
const validateUser = require("../middleware/validateUser");
const validateObjectId = require("../middleware/validateObjectId");
const validateWorkout = require("../middleware/validateWorkout");
const {
  validateWorkoutAdd,
  validateUpdate,
} = require("../middleware/validate");

const getWorkouts = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "workouts",
      populate: { path: "exercises" },
      select: "-pr -sets -__v",
    })
    .select("-creator -numExercises");
  res.send(user.workouts);
};

const updateUser = async (userId, workoutId) => {
  const user = await User.findById(userId);
  const newNumWorkouts = user.numWorkouts + 1;
  user.workouts.push(workoutId);
  user.numWorkouts = newNumWorkouts;
  user.points += 5;
  await user.save();
  if (newNumWorkouts === user.nextStar) await addStar(userId);
};

const removeWorkout = async (req, res) => {
  const workout = await Workout.findById(req.params.id);

  workout.exercises.forEach(async (exerciseId) => {
    await Exercise.findByIdAndRemove(exerciseId);
  });
  await Workout.findByIdAndRemove(req.params.id);
  await User.findByIdAndUpdate(workout.creator, {
    $pull: { workouts: workout._id },
    $inc: { numWorkouts: -1 },
  });

  return getWorkouts(req, res);
};

const createExercises = async (body, isUpdate) => {
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

    if (isUpdate && i < body.numExistingExercises) {
      tmpExercise = await Exercise.findByIdAndUpdate(
        body.existingExercises[i],
        tmpExercise
      );
    } else {
      tmpExercise = await new Exercise(tmpExercise).save();
    }
    exercises.push(tmpExercise._id);
  }
  return exercises;
};

// Routes:
router.get("/all", [cookieParser, auth, validateUser], getWorkouts);

router.get(
  "/:id",
  [cookieParser, auth, validateUser, validateObjectId, validateWorkout],
  async (req, res) => {
    const workout = await Workout.findById(req.params.id).populate({
      path: "exercises",
    });
    res.send(workout);
  }
);

router.post("/add", [cookieParser, auth, validateUser], async (req, res) => {
  const { body } = req;
  const { error } = validateWorkoutAdd(body);
  if (error) return res.status(400).send(error.details[0].message);

  // create workout
  const exerciseIds = await createExercises(body, false);
  let workout = await new Workout({
    name: body.name,
    numExercises: body.numExercises,
    exercises: exerciseIds,
  }).save();

  // update the user
  await updateUser(req.user._id, workout._id);

  workout = await Workout.findByIdAndUpdate(
    workout._id,
    { creator: req.user._id },
    { new: true }
  );

  // res.send(workout);
  return getWorkouts(req, res);
});

router.post(
  "/duplicate/:id",
  [cookieParser, auth, validateUser, validateObjectId, validateWorkout],
  async (req, res) => {
    let workout = await Workout.findById(req.params.id).select("-_id -__v");

    let exerciseIds = new Array();
    let exercise;

    // duplicate the exercises (I use for of because I depend on the val of exerciseIds after the loop)
    for (const id_ of workout.exercises) {
      exercise = await Exercise.findById(id_).select("-_id -__v");
      exercise = JSON.parse(JSON.stringify(exercise));
      exercise = await new Exercise(exercise).save();
      exerciseIds.push(exercise._id);
    }

    // Create the workout
    workout.exercises = exerciseIds;
    workout = JSON.parse(JSON.stringify(workout));
    const newWorkout = await new Workout(workout).save();

    // update the user
    await updateUser(req.user._id, newWorkout._id);

    // res.send(newWorkout);
    return getWorkouts(req, res);
  }
);

router.patch(
  "/update/:id",
  [cookieParser, auth, validateUser, validateObjectId, validateWorkout],
  async (req, res) => {
    const { body } = req;
    const { error } = validateUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    if (req.body.numExercises === 0) return removeWorkout(req, res);

    // remove unused exercises
    const unusedExercises = workout.exercises.filter((id) =>
      body.existingExercises.includes(id)
    );
    unusedExercises.forEach(async (id) => {
      await Exercise.findByIdAndRemove(id);
    });
    await Workout.findByIdAndUpdate(req.params.id, {
      $pull: { exercises: { $in: unusedExercises } },
    });

    // create workout
    const exerciseIds = await createExercises(body, true);
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        name: body.name,
        numExercises: body.numExercises,
        exercises: exerciseIds,
      },
      { new: true }
    );

    res.send(workout);
  }
);

router.delete(
  "/delete/:id",
  [cookieParser, auth, validateUser, validateObjectId, validateWorkout],
  removeWorkout
);

module.exports = router;
