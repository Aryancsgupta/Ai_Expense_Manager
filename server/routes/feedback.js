const express = require('express');
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Submit feedback
router.post('/', auth, async (req, res) => {
  try {
    const { feedback } = req.body;
    const newFeedback = new Feedback({
      user: req.user.id,
      feedback
    });
    await newFeedback.save();
    res.status(201).json({ msg: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
