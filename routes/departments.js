// routes/departments.js
const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');

// GET /departments - List all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.render('departments/index', { departments });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// GET /departments/new - Show create form
router.get('/new', (req, res) => {
  res.render('departments/new');
});

// POST /departments - Create new department
router.post('/', async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.redirect('/departments');
  } catch (error) {
    res.status(400).render('departments/new', { error: error.message });
  }
});

// GET /departments/:id - Show department details
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    const employees = await Employee.find({ department: req.params.id })
                                  .populate('supervisor', 'firstName lastName');
    if (!department) {
      return res.status(404).render('error', { error: { message: 'Department not found' } });
    }
    res.render('departments/show', { department, employees });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// GET /departments/:id/edit - Show edit form
router.get('/:id/edit', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).render('error', { error: { message: 'Department not found' } });
    }
    res.render('departments/edit', { department });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// PUT /departments/:id - Update department
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) {
      return res.status(404).render('error', { error: { message: 'Department not found' } });
    }
    res.redirect('/departments');
  } catch (error) {
    res.status(400).render('departments/edit', { department: req.body, error: error.message });
  }
});

// DELETE /departments/:id - Delete department
router.delete('/:id', async (req, res) => {
  try {
    const employeeCount = await Employee.countDocuments({ department: req.params.id });
    if (employeeCount > 0) {
      return res.status(400).json({ error: 'Cannot delete department with employees' });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    res.redirect('/departments');
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

module.exports = router;
