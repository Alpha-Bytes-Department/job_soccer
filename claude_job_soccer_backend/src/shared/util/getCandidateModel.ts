import { StatusCodes } from "http-status-codes";
import { AmateurPlayerCan } from "../../modules/candidate/amateurPlayerCan/amateurPlayerCan.model";
import { CollegeOrUniversity } from "../../modules/candidate/collegeOrUniversityCan/collegeOrUniversityCan.model";
import { HighSchoolCan } from "../../modules/candidate/highSchoolCan/highSchoolCan.model";
import { OfficeStaffCan } from "../../modules/candidate/officeStaffCan/officeStaffCan.model";
import { OnFieldStaffCan } from "../../modules/candidate/onFieldStaffCan/onFieldStaffCan.model";
import { ProfessionalPlayerCan } from "../../modules/candidate/professionalPlayerCan/professionalPlayerCan.model";
import { CandidateRole } from "../../modules/user/user.interface";
import AppError from "../../errors/AppError";

/**
 * Get candidate model based on role
 */
export const getCandidateModel = (role: any): any => {
  console.log("candidate role --------------->", role);
  switch (role) {
    case CandidateRole.PROFESSIONAL_PLAYER:
      return ProfessionalPlayerCan;
    case CandidateRole.AMATEUR_PLAYER:
      return AmateurPlayerCan;
    case CandidateRole.HIGH_SCHOOL:
      return HighSchoolCan;
    case "High School":
      return HighSchoolCan;
    case CandidateRole.COLLEGE_UNIVERSITY:
      return CollegeOrUniversity;
    case "College/University":
      return CollegeOrUniversity;
    case CandidateRole.ON_FIELD_STAFF:
      return OnFieldStaffCan;
    case CandidateRole.OFFICE_STAFF:
      return OfficeStaffCan;
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid candidate role");
  }
};
