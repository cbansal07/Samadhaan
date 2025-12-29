const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
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
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  try {
    const newGrievance = new Grievance({
      title,
      description,
      user: req.user.id
    });

    const grievance = await newGrievance.save();
    res.json(grievance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/grievances/:id
// @desc    Delete a grievance
router.delete('/:id', auth, async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            return res.status(404).json({ msg: 'Grievance not found' });
        }

        // Check user
        if (grievance.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await grievance.remove();

        res.json({ msg: 'Grievance removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Grievance not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/grievances/:id
// @desc    Update a grievance
router.put('/:id', auth, async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            return res.status(404).json({ msg: 'Grievance not found' });
        }

        // Check user
        if (grievance.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { title, description, status } = req.body;

        if (title) grievance.title = title;
        if (description) grievance.description = description;
        if (status) grievance.status = status;

        await grievance.save();

        res.json(grievance);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Grievance not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
