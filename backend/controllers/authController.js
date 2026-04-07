// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Auto-import new model

const login = async (req, res) => {
    try {
        const { email, password, department } = req.body;

        if (password !== '1234') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let role = 'Faculty';
        let assignedDepartment = department;
        let namePrefix = email.split('@')[0];

        if (email.startsWith('hod.')) {
            role = 'HOD';
            // extract the department from the email (e.g., hod.cse@bitsathy.ac.in -> CSE)
            assignedDepartment = email.split('.')[1].split('@')[0].toUpperCase();
        }

        const facultyName = role === 'HOD' ? `HOD ${assignedDepartment}` : namePrefix.split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');

        // Auto-register user in DB
        const user = await User.findOneAndUpdate(
            { email },
            { name: facultyName, role, department: assignedDepartment },
            { upsert: true, new: true }
        );

        const token = jwt.sign(
            { id: user._id, email, role, department: assignedDepartment },
            process.env.JWT_SECRET || 'super_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            role,
            department: assignedDepartment,
            name: facultyName,
            totalPoints: user.totalPoints || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error during login' });
    }
};

// @desc    Get all faculty members for a specific department
// @route   GET /api/auth/faculty
const getDepartmentFaculties = async (req, res) => {
    try {
        const department = req.user.department;

        if (!department) {
            return res.status(400).json({ message: 'Department is required' });
        }

        const faculties = await User.find({ department: department, role: 'Faculty' }).select('-password');
        res.status(200).json(faculties);
    } catch (error) {
        console.error("Error fetching faculties:", error);
        res.status(500).json({ message: 'Server Error fetching faculties' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let tp = user.totalPoints;
        if (tp === undefined || tp === null) {
            return res.status(200).json({ ...user.toObject(), totalPoints: 0 });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { login, getDepartmentFaculties, getMe };
