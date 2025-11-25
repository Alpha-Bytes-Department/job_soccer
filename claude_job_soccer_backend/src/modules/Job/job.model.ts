import { model, Schema } from "mongoose";
import { IJob, JobStatus } from "./job.interface";

const jobSchema = new Schema<IJob>(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      index: true, // For text search
    },
    creator: {
      creatorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, // Fast lookup of jobs by creator
      },
      creatorRole: {
        type: String,
        required: true,
        index: true, // Filter jobs by employer type
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true, // Location-based filtering
    },
    deadline: {
      type: Date,
      required: true,
      index: true, // Sort by deadline, filter expired
    },
    jobOverview: {
      type: String,
      required: true,
      trim: true,
    },
    jobCategory: {
      type: String,
      required: true,
      index: true, // Most common filter - candidate role matching
    },
    position: {
      type: String,
      required: true,
      trim: true,
      index: true, // Filter by position
    },
    contractType: {
      type: String,
      enum: ["FullTime", "PartTime","Contract"],
      required: true,
      index: true, // Filter by contract type
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft", "expired"],
      default: "active",
      index: true, // Critical for filtering active jobs
    },
    salary: {
      min: {
        type: Number,
        required: true,
        index: true, // Range queries on salary
      },
      max: {
        type: Number,
        required: true,
        index: true, // Range queries on salary
      },
    },
    experience: {
      type: String,
      enum: ["Entry Level", "Intermediate", "Mid-Level", "Mid-Senior", "Senior"],
      required: true,
      index: true, // Filter by experience level
    },
    requirements: {
      type: String,
      required: true,
      trim: true,
    },
    responsibilities: {
      type: String,
      required: true,
      trim: true,
    },
    requiredSkills: {
      type: String,
      required: true,
      trim: true,
    },
    additionalRequirements: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      index: true, // Country-based filtering
    },
    searchKeywords: [
      {
        type: String,
        lowercase: true, // Normalized for searching
      },
    ],
    requiredAiScore: {
      type: Number,
      min: 0,
      max: 100,
      index: true, // For filtering by AI score
    },
    applicationCount: {
      type: Number,
      default: 0,
      index: true, // Sort by popularity
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// ============================================
// COMPOUND INDEXES for Common Query Patterns
// ============================================

// 1. Most common: Active jobs by category and location
jobSchema.index({ status: 1, jobCategory: 1, location: 1 });

// 2. Active jobs by category with salary range
jobSchema.index({
  status: 1,
  jobCategory: 1,
  "salary.min": 1,
  "salary.max": 1,
});

// 3. Jobs by creator (employer's posted jobs)
jobSchema.index({ "creator.creatorId": 1, status: 1, createdAt: -1 });

// 4. Active jobs sorted by deadline
jobSchema.index({ status: 1, deadline: 1 });

// 5. Jobs by employer role and category
jobSchema.index({ "creator.creatorRole": 1, jobCategory: 1, status: 1 });

// 6. Location + contract type filtering
jobSchema.index({ location: 1, contractType: 1, status: 1 });

// 7. Country-based filtering with category
jobSchema.index({ country: 1, jobCategory: 1, status: 1 });

// 8. Trending jobs (high application count)
jobSchema.index({ status: 1, applicationCount: -1, createdAt: -1 });

// ============================================
// TEXT INDEX for Full-Text Search
// ============================================
jobSchema.index({
  jobTitle: "text",
  position: "text",
  jobOverview: "text",
  location: "text",
});

// ============================================
// TTL INDEX for Auto-Expiry
// ============================================
// Automatically delete expired jobs after 30 days
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ============================================
// MIDDLEWARE - Auto-populate fields
// ============================================

// Pre-save: Auto-set expiresAt from deadline
jobSchema.pre("save", function (next) {
  if (this.deadline && !this.expiresAt) {
    this.expiresAt = this.deadline;
  }

  // Auto-generate search keywords
  if (
    this.isModified("jobTitle") ||
    this.isModified("position") ||
    this.isModified("requiredSkills")
  ) {
    const keywords = new Set<string>();

    // Add words from job title
    this.jobTitle
      ?.toLowerCase()
      .split(/\s+/)
      .forEach((word) => keywords.add(word));

    // Add position
    this.position
      ?.toLowerCase()
      .split(/\s+/)
      .forEach((word) => keywords.add(word));

    // Add skills
    this.requiredSkills
      ?.toLowerCase()
      .split(/\s+/)
      .forEach((word) => keywords.add(word));

    this.searchKeywords = Array.from(keywords);
  }

  // Auto-update status based on deadline
  if (this.deadline && new Date() > new Date(this.deadline)) {
    this.status = "expired";
  }

  next();
});

// ============================================
// STATIC METHODS for Optimized Queries
// ============================================

jobSchema.statics = {
  // Find active jobs with filters
  async findActiveJobs(filters: {
    jobCategory?: string;
    location?: string;
    country?: string;
    contractType?: string;
    minSalary?: number;
    maxSalary?: number;
    employerRole?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const {
      jobCategory,
      location,
      country,
      contractType,
      minSalary,
      maxSalary,
      employerRole,
      page = 1,
      limit = 20,
      sortBy = "-createdAt",
    } = filters;

    const query: any = { status: "active" };

    if (jobCategory) query.jobCategory = jobCategory;
    if (location) query.location = new RegExp(location, "i");
    if (country) query.country = country;
    if (contractType) query.contractType = contractType;
    if (employerRole) query["creator.creatorRole"] = employerRole;

    // Salary range filtering
    if (minSalary !== undefined) {
      query["salary.max"] = { $gte: minSalary };
    }
    if (maxSalary !== undefined) {
      query["salary.min"] = { $lte: maxSalary };
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .populate("creator.creatorId", "firstName lastName email profileImage")
        .lean(),
      this.countDocuments(query),
    ]);

    return {
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        limit,
      },
    };
  },

  // Full-text search
  async searchJobs(searchTerm: string, filters: any = {}) {
    const query: any = {
      status: "active",
      $text: { $search: searchTerm },
      ...filters,
    };

    return this.find(query)
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(50)
      .populate("creator.creatorId", "firstName lastName email")
      .lean();
  },

  // Get jobs by employer
  async getJobsByEmployer(creatorId: string, status?: JobStatus) {
    const query: any = { "creator.creatorId": creatorId };
    if (status) query.status = status;

    return this.find(query).sort("-createdAt").lean();
  },


  // Increment application count
  async incrementApplicationCount(jobId: string) {
    return this.updateOne({ _id: jobId }, { $inc: { applicationCount: 1 } });
  },
};

export const Job = model<IJob>("Job", jobSchema);
