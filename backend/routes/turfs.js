const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET all turfs
router.get('/', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database misconfigured" });

  const { data, error } = await supabase
    .from('turfs')
    .select('*')
    .order('name', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST (Create or Update) a turf
router.post('/', async (req, res) => {
  const turfData = req.body;
  
  if (!supabase) return res.status(500).json({ error: "Database misconfigured" });

  const { data, error } = await supabase
    .from('turfs')
    .upsert([turfData])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
});

// DELETE (Deactivate) a turf
router.delete('/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database misconfigured" });

  const { data, error } = await supabase
    .from('turfs')
    .update({ isActive: false })
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Turf deactivated", turf: data[0] });
});

module.exports = router;
