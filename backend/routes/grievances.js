
const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');

// @route   GET api/grievances
// @desc    Get all grievances
router.get('/', async (req, res) => {
  try {
    const grievances = await Grievance.find();
    res.json(grievances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/grievances
// @desc    Create a grievance
router.post('/', async (req, res) => {
  const { title, description } = req.body;

  try {
    const newGrievance = new Grievance({
      title,
      description
    });

    const grievance = await newGrievance.save();
    res.json(grievance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
