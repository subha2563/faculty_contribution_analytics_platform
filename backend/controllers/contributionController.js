// backend/controllers/contributionController.js
const Contribution = require('../models/Contribution');
const User = require('../models/User');

const TIER_CONFIG = {
  "Tier 1": { basePoints: 50, maxCoAuthors: 3 },
  "Tier 2": { basePoints: 30, maxCoAuthors: 2 },
  "Tier 3": { basePoints: 15, maxCoAuthors: 1 }
};

// @desc    Get contributions (Filtered for Faculty, All for HOD)
const getContributions = async (req, res) => {
  try {
    const { email, role, department } = req.query; // Check if email or role was sent

    let contributions;
    if (role === 'HOD') {
      // Must enforce strict department checking
      if (!department) {
        return res.status(400).json({ message: 'Department is required for HOD view' });
      }
      // Guarantee records without a valid department are filtered out
      contributions = await Contribution.find({
        department: { $eq: department }
      });
    } else if (email) {
      // If email exists, only find papers uploaded by this specific faculty or they are coAuthor
      contributions = await Contribution.find({ $or: [{ facultyEmail: email }, { 'coAuthors.email': email }] });
    } else {
      // Fallback
      contributions = await Contribution.find();
    }

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new contribution
const createContribution = async (req, res) => {
  try {
    // Extract name and email from the frontend request
    const { title, type, date, facultyName, facultyEmail, department, credentialId, coAuthors, primaryAuthorPercentage, tier } = req.body;
    const documentPath = req.file ? req.file.filename : null;

    let parsedCoAuthors = [];
    if (coAuthors) {
      try {
        parsedCoAuthors = JSON.parse(coAuthors);
      } catch (e) {
        parsedCoAuthors = Array.isArray(coAuthors) ? coAuthors : [];
      }
    }

    const selectedTier = tier || 'Tier 2';
    const tierConfig = TIER_CONFIG[selectedTier];
    if (parsedCoAuthors.length > tierConfig.maxCoAuthors) {
      return res.status(400).json({ message: `Maximum co-authors allowed for ${selectedTier} is ${tierConfig.maxCoAuthors}.` });
    }

    const newContribution = new Contribution({
      title,
      type,
      date,
      documentPath,
      facultyName,   // Save the name
      facultyEmail,  // Save the email
      department,    // Save the department
      tier: selectedTier,
      credentialId,
      primaryAuthorPercentage: primaryAuthorPercentage || 100,
      coAuthors: parsedCoAuthors
    });

    const savedContribution = await newContribution.save();
    res.status(201).json(savedContribution);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: 'Server Error during upload' });
  }
};

// @desc    Update contribution status (Approve/Reject)
// @route   PUT /api/contributions/:id
const updateStatus = async (req, res) => {
  try {
    const { status, multiplier = 1, rejectionReason = "" } = req.body;

    // Fetch the Submission by ID.
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }

    let calculatedPoints = 0;
    if (status === 'Approved' && contribution.status !== 'Approved') {
      const parsedMultiplier = parseFloat(multiplier) || 1.0;
      // Calculate the total base points for the paper utilizing Tier configuration
      const tierSettings = TIER_CONFIG[contribution.tier || 'Tier 2'];
      const basePoints = tierSettings ? tierSettings.basePoints : 30;

      calculatedPoints = basePoints * parsedMultiplier;
      const totalPointsNumber = Number(calculatedPoints);

      // Fetch the User who is the primary author.
      const primaryAuthor = await User.findOne({ email: contribution.facultyEmail });
      
      if (primaryAuthor) {
          // Primary Author Distribution
          const primaryCut = totalPointsNumber * (Number(contribution.primaryAuthorPercentage || 100) / 100);
          // Add this exact number to the primary author's User.totalPoints
          primaryAuthor.totalPoints = Number(primaryAuthor.totalPoints || 0) + Number(primaryCut);
          // Save the primary author document.
          await primaryAuthor.save();
          console.log("Updated user:", primaryAuthor.name, "New Points:", primaryAuthor.totalPoints);
      }

      // Co-Author Distribution
      if (contribution.coAuthors && contribution.coAuthors.length > 0) {
          // Loop through the submission.coAuthors array.
          for (let ca of contribution.coAuthors) {
              const caEmail = ca.email;
              if (caEmail) {
                  // Perform a database query to find the matching user
                  const coAuthorUser = await User.findOne({ email: caEmail });
                  if (coAuthorUser) {
                      // If the matching user is found, calculate their cut
                      const coAuthorCut = totalPointsNumber * (Number(ca.percentage || 0) / 100);
                      // Add this amount to that co-author's User.totalPoints
                      coAuthorUser.totalPoints = Number(coAuthorUser.totalPoints || 0) + Number(coAuthorCut);
                      // Save the co-author document.
                      await coAuthorUser.save();
                      console.log("Updated user:", coAuthorUser.name, "New Points:", coAuthorUser.totalPoints);
                  }
              }
          }
      }
    }

    // Save the submission document with status: 'Approved' (or Rejected)
    contribution.status = status;
    if (status === 'Approved') {
      contribution.pointsAwarded = calculatedPoints;
    }
    contribution.rejectionReason = rejectionReason || "";
    await contribution.save();

    res.json(contribution);
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Gamification and Points stats
// @route   GET /api/contributions/analytics/points
const getGamificationStats = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userDepartment = req.user.department;

    // Fetch all approved contributions for the user's department
    const departmentContributions = await Contribution.find({
      department: userDepartment,
      status: 'Approved'
    });

    let departmentTotal = 0;
    let userTotal = 0;
    const uniqueFacultyEmails = new Set();

    departmentContributions.forEach(cont => {
      departmentTotal += cont.pointsAwarded || 0;
      uniqueFacultyEmails.add(cont.facultyEmail);
      if (cont.coAuthors) {
        cont.coAuthors.forEach(ca => uniqueFacultyEmails.add(ca.email));
      }

      if (cont.facultyEmail === userEmail) {
        userTotal += (cont.pointsAwarded * ((cont.primaryAuthorPercentage || 100) / 100)) || 0;
      }
      
      const coMatch = cont.coAuthors?.find(c => c.email === userEmail);
      if (coMatch) {
         userTotal += (cont.pointsAwarded * ((coMatch.percentage || 0) / 100)) || 0;
      }
    });

    const numFaculty = uniqueFacultyEmails.size || 1; // avoid division by zero
    const departmentAverage = departmentTotal / numFaculty;

    // Fetch personal transaction history
    const userHistoryRaw = await Contribution.find({
      $or: [{ facultyEmail: userEmail }, { 'coAuthors.email': userEmail }],
      status: 'Approved'
    }).select('title type pointsAwarded updatedAt date primaryAuthorPercentage coAuthors facultyEmail').sort({ date: -1 });

    const userHistory = userHistoryRaw.map(cont => {
      let scaledPoints = 0;
      if (cont.facultyEmail === userEmail) {
        scaledPoints = (cont.pointsAwarded * ((cont.primaryAuthorPercentage || 100) / 100)) || 0;
      } else {
        const coMatch = cont.coAuthors?.find(c => c.email === userEmail);
        if (coMatch) scaledPoints = (cont.pointsAwarded * ((coMatch.percentage || 0) / 100)) || 0;
      }
      return { _id: cont._id, title: cont.title, type: cont.type, pointsAwarded: scaledPoints, updatedAt: cont.updatedAt, date: cont.date };
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // We can do user Points aggregation in memory since we already have departmentContributions!
    const monthlyStats = {};
    for(let i=1; i<=12; i++) monthlyStats[i] = { userPoints: 0, deptPoints: 0 };
    
    departmentContributions.forEach(cont => {
      const month = new Date(cont.updatedAt).getMonth() + 1;
      monthlyStats[month].deptPoints += (cont.pointsAwarded || 0);
      
      if (cont.facultyEmail === userEmail) {
        monthlyStats[month].userPoints += (cont.pointsAwarded * ((cont.primaryAuthorPercentage || 100) / 100)) || 0;
      }
      const coMatch = cont.coAuthors?.find(c => c.email === userEmail);
      if (coMatch) {
        monthlyStats[month].userPoints += (cont.pointsAwarded * ((coMatch.percentage || 0) / 100)) || 0;
      }
    });

    let cumUser = 0;
    let cumDept = 0;
    const cumulativeData = [];
    for(let i=1; i<=12; i++) {
        cumUser += monthlyStats[i].userPoints;
        cumDept += monthlyStats[i].deptPoints;
        if (cumDept > 0 || cumUser > 0) {
            cumulativeData.push({
                month: monthNames[i - 1],
                userCumulative: cumUser,
                deptCumulative: Number((cumDept / numFaculty).toFixed(1))
            });
        }
    }
    // ensure we don't return entirely empty arrays if nothing has points yet, maybe just the current month?
    if (cumulativeData.length === 0) {
      cumulativeData.push({ month: monthNames[new Date().getMonth()], userCumulative: 0, deptCumulative: 0 });
    }

    res.status(200).json({
      userTotal,
      departmentAverage,
      departmentTotal,
      history: userHistory,
      cumulativeData
    });
  } catch (error) {
    console.error("Gamification Stats Error:", error);
    res.status(500).json({ message: 'Server Error calculating stats' });
  }
};

// @desc    Delete a contribution
// @route   DELETE /api/contributions/:id
const deleteContribution = async (req, res) => {
  try {
    await Contribution.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Contribution deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during deletion' });
  }
};

// @desc    Get HOD Chart Data for Department Faculty Contributions
// @route   GET /api/contributions/hod/chart-data
const getHodChartData = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) return res.status(400).json({ message: 'Department is required for HOD charts' });

    const chartAggregation = await Contribution.aggregate([
      { $match: { department: { $eq: department }, status: 'Approved' } },
      {
        $project: {
          authors: {
            $concatArrays: [
              [{ name: "$facultyName", points: { $multiply: ["$pointsAwarded", { $divide: [{ $ifNull: ["$primaryAuthorPercentage", 100] }, 100] }] } }],
              {
                $map: {
                  input: { $ifNull: ["$coAuthors", []] },
                  as: "ca",
                  in: { name: "$$ca.name", points: { $multiply: ["$pointsAwarded", { $divide: [{ $ifNull: ["$$ca.percentage", 0] }, 100] }] } }
                }
              }
            ]
          }
        }
      },
      { $unwind: "$authors" },
      {
        $group: {
          _id: "$authors.name",
          papers: { $sum: 1 },
          points: { $sum: "$authors.points" }
        }
      },
      { $sort: { points: 1 } }
    ]);

    res.status(200).json(chartAggregation);
  } catch (error) {
    console.error("HOD Chart Data Error:", error);
    res.status(500).json({ message: 'Server Error fetching HOD chart data' });
  }
};

// @desc    Get Faculty Leaderboard for HOD Dashboard
// @route   GET /api/contributions/hod/leaderboard
const getFacultyLeaderboard = async (req, res) => {
  try {
    const department = req.user.department;

    if (!department) return res.status(400).json({ message: 'Department is required for HOD leaderboard' });

    const leaderboardAggregation = await Contribution.aggregate([
      { $match: { department: { $eq: department }, status: 'Approved' } },
      {
        $project: {
          department: 1,
          authors: {
            $concatArrays: [
              [{ email: "$facultyEmail", name: "$facultyName", points: { $multiply: ["$pointsAwarded", { $divide: [{ $ifNull: ["$primaryAuthorPercentage", 100] }, 100] }] } }],
              {
                $map: {
                  input: { $ifNull: ["$coAuthors", []] },
                  as: "ca",
                  in: { email: "$$ca.email", name: "$$ca.name", points: { $multiply: ["$pointsAwarded", { $divide: [{ $ifNull: ["$$ca.percentage", 0] }, 100] }] } }
                }
              }
            ]
          }
        }
      },
      { $unwind: "$authors" },
      { $match: { "authors.email": { $ne: null } } },
      {
        $group: {
          _id: "$authors.email",
          name: { $first: "$authors.name" },
          dept: { $first: "$department" },
          totalPoints: { $sum: "$authors.points" }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);

    res.status(200).json(leaderboardAggregation);
  } catch (error) {
    console.error("HOD Leaderboard Error:", error);
    res.status(500).json({ message: 'Server Error fetching HOD leaderboard data' });
  }
};

// @desc    Get User Dashboard Stats
// @route   GET /api/contributions/me/stats
const getUserDashboardStats = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const userPapers = await Contribution.find({ 
      $or: [{ facultyEmail: userEmail }, { 'coAuthors.email': userEmail }] 
    });

    const total = userPapers.length;
    const approved = userPapers.filter(p => p.status === 'Approved').length;
    const pending = userPapers.filter(p => p.status === 'Pending').length;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyStats = {};
    for(let i=1; i<=12; i++) monthlyStats[i] = 0;
    
    userPapers.forEach(p => {
        const m = new Date(p.updatedAt).getMonth() + 1;
        monthlyStats[m] += 1;
    });

    const monthlyData = Object.keys(monthlyStats).filter(m => monthlyStats[m] > 0).map(m => ({
      month: monthNames[m - 1],
      count: monthlyStats[m]
    }));
    // Fallback if empty
    if(monthlyData.length === 0) monthlyData.push({ month: monthNames[new Date().getMonth()], count: 0 });

    res.status(200).json({ total, approved, pending, monthlyData });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: 'Server Error fetching user dashboard stats' });
  }
};

// @desc    Get HOD Dashboard Stats
// @route   GET /api/contributions/hod/stats
const getHodDashboardStats = async (req, res) => {
  try {
    const department = req.user.department;

    if (!department) {
      return res.status(400).json({ message: 'Department is required for HOD stats' });
    }

    const deptPapers = await Contribution.find({ department: department });

    const total = deptPapers.length;
    const approved = deptPapers.filter(p => p.status === 'Approved').length;
    const pending = deptPapers.filter(p => p.status === 'Pending').length;

    res.status(200).json({ total, approved, pending });
  } catch (error) {
    console.error("HOD Dashboard Stats Error:", error);
    res.status(500).json({ message: 'Server Error fetching HOD dashboard stats' });
  }
};

// @desc    Get Monthly Progress data
// @route   GET /api/contributions/analytics/monthly
const getMonthlyProgress = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const department = req.user.department;

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const papers = await Contribution.find({
      status: 'Approved',
      department: department,
      createdAt: { $gte: startOfYear, $lt: endOfYear }
    });
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyStats = {};
    for(let i=1; i<=12; i++) monthlyStats[i] = { userPoints: 0, deptTotal: 0 };
    
    papers.forEach(cont => {
      const m = new Date(cont.createdAt).getMonth() + 1;
      monthlyStats[m].deptTotal += (cont.pointsAwarded || 0);
      
      if (cont.facultyEmail === userEmail) {
        monthlyStats[m].userPoints += (cont.pointsAwarded * ((cont.primaryAuthorPercentage || 100) / 100)) || 0;
      }
      const coMatch = cont.coAuthors?.find(c => c.email === userEmail);
      if (coMatch) {
         monthlyStats[m].userPoints += (cont.pointsAwarded * ((coMatch.percentage || 0) / 100)) || 0;
      }
    });

    const monthlyData = Object.keys(monthlyStats).map(m => ({
      month: monthNames[m - 1],
      userPoints: monthlyStats[m].userPoints,
      deptTotal: monthlyStats[m].deptTotal
    })).filter(m => m.deptTotal > 0 || m.userPoints > 0);
    
    if(monthlyData.length === 0) monthlyData.push({ month: monthNames[new Date().getMonth()], userPoints: 0, deptTotal: 0 });

    res.status(200).json(monthlyData);
  } catch (error) {
    console.error("Monthly Progress Error:", error);
    res.status(500).json({ message: 'Server Error fetching monthly progress' });
  }
};

// @desc    Get College-Wide Department Averages
// @route   GET /api/contributions/analytics/college-averages
const getCollegeAverages = async (req, res) => {
  try {
    const leaderboard = await Contribution.aggregate([
      { $match: { status: 'Approved' } }, // Only calculate approved papers
      {
        $group: {
          _id: '$department', // Group by department name
          avgPoints: { $avg: '$pointsAwarded' } // Mathematically average the points
        }
      },
      { $sort: { avgPoints: -1 } }, // Rank from 1st place to last place
      {
        $project: {
          _id: 0,
          department: '$_id',
          avgPoints: { $round: ['$avgPoints', 1] } // Round to 1 decimal place (e.g., 14.5)
        }
      }
    ]);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching college averages', error });
  }
};

module.exports = { getContributions, createContribution, updateStatus, deleteContribution, getGamificationStats, getHodChartData, getFacultyLeaderboard, getUserDashboardStats, getHodDashboardStats, getMonthlyProgress, getCollegeAverages };