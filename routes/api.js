const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/countries - Get all countries
router.get('/countries', async (req, res) => {
  try {
    const response = await axios.get('https://countriesnow.space/api/v0.1/countries/states');
    const countries = response.data.data.map(country => ({
      name: country.name,
      iso3: country.iso3
    }));
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/states/:country - Get states for a country
router.get('/states/:country', async (req, res) => {
  try {
    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/states', {
      country: req.params.country
    });
    res.json(response.data.data.states);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// GET /api/cities/:country/:state - Get cities for a state
router.get('/cities/:country/:state', async (req, res) => {
  try {
    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', {
      country: req.params.country,
      state: req.params.state
    });
    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

module.exports = router;
