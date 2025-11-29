import { User } from "../user/user.model";
import { PaymentHistory } from "../paymentHistory/paymentHistory.model";
import mongoose from "mongoose";
import { CandidateRole, EmployerRole } from "../user/user.interface";
import { AmateurPlayerCan } from "../candidate/amateurPlayerCan/amateurPlayerCan.model";
import { ProfessionalPlayerCan } from "../candidate/professionalPlayerCan/professionalPlayerCan.model";
import { OnFieldStaffCan } from "../candidate/onFieldStaffCan/onFieldStaffCan.model";
import { OfficeStaffCan } from "../candidate/officeStaffCan/officeStaffCan.model";
import { HighSchoolCan } from "../candidate/highSchoolCan/highSchoolCan.model";
import { CollegeOrUniversity } from "../candidate/collegeOrUniversityCan/collegeOrUniversityCan.model";
import { AcademyEmp } from "../employer/academyEmp/academyEmp.model";
import { AgentEmp } from "../employer/agentEmp/agentEmp.model";
import { AmateurClubEmp } from "../employer/amateurClubEmp/amateurClubEmp.model";
import { CollegeOrUniversityEmp } from "../employer/collegeOrUniversityEmp/collegeOrUniversityEmp.model";
import { ConsultingCompanyEmp } from "../employer/consultingCompanyEmp/consultingCompanyEmp.model";
import { HighSchoolEmp } from "../employer/highSchoolEmp/highSchoolEmp.model";
import { ProfessionalClubEmp } from "../employer/professionalClubEmp/professionalClubEmp.model";
import { CandidateEducationService } from "../candidateEducation/candidateEducation.service";
import { CandidateExperienceService } from "../candidateExperience/candidateExperience.service";
import { CandidateLicensesAndCertificationService } from "../candidateLicensesAndCertification/candidateLicensesAndCertification.service";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { monthNames } from "../../shared/constant/month.constant";
import { AdminVerification } from "../adminVerification/adminVerification.model";

// Get total users, paid users, and free users count
const getUserCounts = async () => {
  try {
    const totalUsers = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
    });

    // Count users with active subscriptions
    const paidUsers = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
      activeSubscriptionId: { $exists: true, $ne: null },
    });

    const unpaidUsers = totalUsers - paidUsers;

    return {
      totalUsers,
      paidUsers,
      unpaidUsers,
    };
  } catch (error) {
    console.error("Error in getUserCounts:", error);
    throw error;
  }
};

// Get monthly income for current year (Jan-Dec)
const getMonthlyIncome = async (year?: number) => {
  try {
    const targetYear = year || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11

    // Get all successful payments for the target year
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const payments = await PaymentHistory.aggregate([
      {
        $match: {
          status: "succeeded",
          paidAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$paidAt" },
          totalIncome: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create array with all 12 months, fill with 0 for future months
    const monthlyIncome = Array(12).fill(0);

    payments.forEach((payment) => {
      const monthIndex = payment._id - 1; // Convert to 0-based index
      monthlyIncome[monthIndex] = payment.totalIncome;
    });

    // Set future months to 0 only if it's the current year
    if (targetYear === currentYear) {
      for (let i = currentMonth + 1; i < 12; i++) {
        monthlyIncome[i] = 0;
      }
    }


    const result = monthNames.map((month, index) => ({
      month,
      income: monthlyIncome[index],
    }));

    return result;
  } catch (error) {
    console.error("Error in getMonthlyIncome:", error);
    throw error;
  }
};

// Get user list with filtering and pagination
const getUserList = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  userType?: "candidate" | "employer";
  subscriptionType?: "paid" | "free";
  role?: string;
  email?: string;
}) => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build match query
    const matchQuery: any = {
      isDeleted: false,
      userType: { $ne: "admin" },
    };

    // Filter by user type (candidate/employer)
    if (query.userType) {
      matchQuery.userType = query.userType;
    }

    // Filter by role
    if (query.role) {
      matchQuery.role = query.role;
    }
    if (query.email) {
      matchQuery.email = query.email;
    }
    // Search by name or email
    if (query.search) {
      matchQuery.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    // Get users with subscription info
    const users = await User.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "subscriptions",
          localField: "activeSubscriptionId",
          foreignField: "_id",
          as: "subscription",
        },
      },
      {
        $unwind: {
          path: "$subscription",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          subscriptionStatus: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$activeSubscriptionId", null] },
                  { $eq: ["$subscription.status", "active"] },
                ],
              },
              then: "paid",
              else: "free",
            },
          },
        },
      },
      // Filter by subscription type if specified
      ...(query.subscriptionType
        ? [{ $match: { subscriptionStatus: query.subscriptionType } }]
        : []),
      {
        $project: {
          name: { $concat: ["$firstName", " ", "$lastName"] },
          firstName: 1,
          lastName: 1,
          email: 1,
          userType: 1,
          role: 1,
          subscriptionStatus: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Get total count for pagination
    const totalQuery = [
      ...Object.entries(matchQuery)
        .filter(([key]) => key !== "$or")
        .map(([key, value]) => ({ [key]: value })),
    ];

    if (matchQuery.$or) {
      totalQuery.push({ $or: matchQuery.$or });
    }

    const totalUsers = await User.countDocuments(
      query.subscriptionType
        ? {
            $and: [
              matchQuery,
              query.subscriptionType === "paid"
                ? { activeSubscriptionId: { $exists: true, $ne: null } }
                : {
                    $or: [
                      { activeSubscriptionId: { $exists: false } },
                      { activeSubscriptionId: null },
                    ],
                  },
            ],
          }
        : matchQuery
    );

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
      },
    };
  } catch (error) {
    console.error("Error in getUserList:", error);
    throw error;
  }
};

// Get user details by ID
const getUserDetails = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Fetch profile based on userType and role
  let profile: any = null;

  if (user.profileId) {
    if (user.userType === "candidate") {
      switch (user.role) {
        case CandidateRole.AMATEUR_PLAYER:
          profile = await AmateurPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.PROFESSIONAL_PLAYER:
          profile = await ProfessionalPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.ON_FIELD_STAFF:
          profile = await OnFieldStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.OFFICE_STAFF:
          profile = await OfficeStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.HIGH_SCHOOL:
          profile = await HighSchoolCan.findById(user.profileId).lean();
          break;
        case CandidateRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversity.findById(user.profileId).lean();
          break;
      }
    } else if (user.userType === "employer") {
      switch (user.role) {
        case EmployerRole.ACADEMY:
          profile = await AcademyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AGENT:
          profile = await AgentEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AMATEUR_CLUB:
          profile = await AmateurClubEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversityEmp.findById(
            user.profileId
          ).lean();
          break;
        case EmployerRole.CONSULTING_COMPANY:
          profile = await ConsultingCompanyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.HIGH_SCHOOL:
          profile = await HighSchoolEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.PROFESSIONAL_CLUB:
          profile = await ProfessionalClubEmp.findById(user.profileId).lean();
          break;
      }
    }
  }
  const educations = await CandidateEducationService.getAllEducationsByUser(
    userId
  );
  const experiences = await CandidateExperienceService.getAllExperiencesByUser(
    userId
  );
  const certifications =
    await CandidateLicensesAndCertificationService.getAllLicensesAndCertificationsByUser(
      userId
    );
  const userLastPayments = await PaymentHistory.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .limit(10)
    .sort({ paidAt: -1 })
    .lean();
  const adminVerificationStatus = await AdminVerification.findOne({ userId }).select("status").lean();
  if (adminVerificationStatus) {

  }
  return {
    ...user,
    profile,
    educations,
    experiences,
    certifications,
    userLastPayments: userLastPayments || [],
    adminVerificationStatus: adminVerificationStatus ? adminVerificationStatus.status : null,
  };
};

// Get user statistics with growth
const getUserStatistics = async () => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    // Current month counts
    const totalUsers = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
    });

    const paidUsers = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
      activeSubscriptionId: { $exists: true, $ne: null },
    });

    const freeUsers = totalUsers - paidUsers;

    // Last month counts
    const lastMonthTotal = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
      createdAt: { $lt: currentMonthStart },
    });

    const lastMonthPaid = await User.countDocuments({
      isDeleted: false,
      userType: { $ne: "admin" },
      activeSubscriptionId: { $exists: true, $ne: null },
      createdAt: { $lt: currentMonthStart },
    });

    const lastMonthFree = lastMonthTotal - lastMonthPaid;

    // Calculate growth
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    return {
      total: {
        count: totalUsers,
        growth: calculateGrowth(totalUsers, lastMonthTotal),
      },
      paid: {
        count: paidUsers,
        growth: calculateGrowth(paidUsers, lastMonthPaid),
      },
      free: {
        count: freeUsers,
        growth: calculateGrowth(freeUsers, lastMonthFree),
      },
    };
  } catch (error) {
    console.error("Error in getUserStatistics:", error);
    throw error;
  }
};

// Get payment statistics
const getPaymentStatistics = async () => {
  try {
    // Total payments (all time)
    const totalPayments = await PaymentHistory.countDocuments({});

    // Paid (succeeded) payments
    const paidPayments = await PaymentHistory.countDocuments({
      status: "succeeded",
    });

    // Cancelled/failed payments
    const cancelledPayments = await PaymentHistory.countDocuments({
      status: { $in: ["canceled", "failed"] },
    });

    // Total revenue from successful payments
    const revenueResult = await PaymentHistory.aggregate([
      {
        $match: {
          status: "succeeded",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return {
      total: {
        count: totalPayments,
        revenue: totalRevenue,
      },
      paid: {
        count: paidPayments,
        revenue: totalRevenue,
      },
      cancelled: {
        count: cancelledPayments,
        revenue: 0,
      },
    };
  } catch (error) {
    console.error("Error in getPaymentStatistics:", error);
    throw error;
  }
};

export const DashboardService = {
  getUserCounts,
  getMonthlyIncome,
  getUserList,
  getUserDetails,
  getUserStatistics,
  getPaymentStatistics,
};
