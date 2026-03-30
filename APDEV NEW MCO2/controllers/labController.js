const Lab = require('../models/Lab');

exports.getLabs = async (req, res) => {
  try {
    const labs = await Lab.find({ isActive: true }).select('_id name description');
    res.json({ labs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch labs.' });
  }
};

exports.getLabById = async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });
    res.json({ lab });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab.' });
  }
};
