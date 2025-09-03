const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Department = require('../models/Department');

// GET /employees - List employees with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const department = req.query.department || '';
    const jobTitle = req.query.jobTitle || '';

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query.department = department;
    }
    
    if (jobTitle) {
      query.jobTitle = { $regex: jobTitle, $options: 'i' };
    }

    const employees = await Employee.find(query)
                                   .populate('department', 'name')
                                   .populate('supervisor', 'firstName lastName')
                                   .sort({ lastName: 1, firstName: 1 })
                                   .limit(limit)
                                   .skip((page - 1) * limit);

    const total = await Employee.countDocuments(query);
    const departments = await Department.find().sort({ name: 1 });
    
    // Get unique job titles for filter
    const jobTitles = await Employee.distinct('jobTitle');

    res.render('employees/index', {
      employees,
      departments,
      jobTitles,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      search,
      selectedDepartment: department,
      selectedJobTitle: jobTitle
    });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// GET /employees/new - Show create form
router.get('/new', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const supervisors = await Employee.find().sort({ lastName: 1, firstName: 1 });
    res.render('employees/new', { departments, supervisors });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// POST /employees - Create new employee
router.post('/', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.redirect('/employees');
  } catch (error) {
    const departments = await Department.find().sort({ name: 1 });
    const supervisors = await Employee.find().sort({ lastName: 1, firstName: 1 });
    res.status(400).render('employees/new', { 
      departments, 
      supervisors, 
      error: error.message,
      formData: req.body
    });
  }
});

// GET /employees/:id - Show employee details
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
                                  .populate('department')
                                  .populate('supervisor', 'firstName lastName');
    
    if (!employee) {
      return res.status(404).render('error', { error: { message: 'Employee not found' } });
    }
    
    // Find subordinates
    const subordinates = await Employee.find({ supervisor: req.params.id })
                                      .sort({ lastName: 1, firstName: 1 });
    
    res.render('employees/show', { employee, subordinates });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// GET /employees/:id/edit - Show edit form
router.get('/:id/edit', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).render('error', { error: { message: 'Employee not found' } });
    }
    
    const departments = await Department.find().sort({ name: 1 });
    const supervisors = await Employee.find({ _id: { $ne: req.params.id } })
                                     .sort({ lastName: 1, firstName: 1 });
    
    res.render('employees/edit', { employee, departments, supervisors });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// PUT /employees/:id - Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) {
      return res.status(404).render('error', { error: { message: 'Employee not found' } });
    }
    res.redirect('/employees');
  } catch (error) {
    const departments = await Department.find().sort({ name: 1 });
    const supervisors = await Employee.find({ _id: { $ne: req.params.id } })
                                     .sort({ lastName: 1, firstName: 1 });
    res.status(400).render('employees/edit', { 
      employee: req.body, 
      departments, 
      supervisors, 
      error: error.message 
    });
  }
});

// DELETE /employees/:id - Delete employee
router.delete('/:id', async (req, res) => {
  try {
    // Check if employee is a supervisor
    const subordinateCount = await Employee.countDocuments({ supervisor: req.params.id });
    if (subordinateCount > 0) {
      return res.status(400).json({ error: 'Cannot delete employee who is a supervisor' });
    }
    
    await Employee.findByIdAndDelete(req.params.id);
    res.redirect('/employees');
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

module.exports = router;