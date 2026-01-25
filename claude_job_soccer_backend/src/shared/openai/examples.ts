/**
 * Example: Using the AI Profile Scoring Service
 * 
 * This file demonstrates how to use the AI profile scoring feature.
 * It's not meant to be run directly, but serves as a reference.
 */

import { generateProfileScore, batchGenerateProfileScores } from './profileScoring.service';
import { CandidateRole } from '../../modules/user/user.interface';

// ============================================================================
// Example 1: Score a Professional Player Profile
// ============================================================================

async function scoreProfessionalPlayer() {
  const professionalPlayerData = {
    dateOfBirth: new Date('1995-05-15'),
    placeOfBirth: 'Barcelona, Spain',
    nationality: 'Spanish',
    phoneNumber: '+34-123-456-789',
    gender: 'Male',
    height: { size: 183, unit: 'cm' },
    weight: { size: 78, unit: 'kg' },
    position: 'Forward',
    currentClub: 'FC Barcelona',
    division: 'La Liga',
    nationalTeamCategory: 'U21',
    agent: 'CAA Sports',
    country: 'Spain',
    availability: 'Soon',
    foot: 'Right',
    teamsJoined: 'FC Barcelona B, Valencia CF Youth',
    contractExpires: '2026-06-30',
    socialMedia: '@player_instagram',
    nationalTeamGames: '15 U21 caps',
    videos: [
      {
        url: '/uploads/videos/highlights1.mp4',
        duration: 180,
        title: 'Season Highlights 2024',
        uploadedAt: new Date(),
      },
      {
        url: '/uploads/videos/skills.mp4',
        duration: 120,
        title: 'Skills & Goals',
        uploadedAt: new Date(),
      },
    ],
  };

  const score = await generateProfileScore(
    professionalPlayerData,
    CandidateRole.PROFESSIONAL_PLAYER
  );

  console.log(`Professional Player Profile Score: ${score}/100`);
  return score;
}

// ============================================================================
// Example 2: Score an Amateur Player Profile (Less Complete)
// ============================================================================

async function scoreAmateurPlayer() {
  const amateurPlayerData = {
    dateOfBirth: new Date('2003-08-20'),
    placeOfBirth: 'Manchester, UK',
    nationality: 'British',
    phoneNumber: '+44-987-654-321',
    gender: 'Male',
    height: { size: 175, unit: 'cm' },
    // Notice: weight is missing
    position: 'Midfielder',
    currentClub: 'Manchester United Youth',
    division: 'Premier League 2',
    nationalTeamCategory: 'U18',
    agent: 'Self-represented',
    country: 'United Kingdom',
    availability: 'Now',
    foot: 'Both',
    // Notice: some fields missing, no videos
  };

  const score = await generateProfileScore(
    amateurPlayerData,
    CandidateRole.AMATEUR_PLAYER
  );

  console.log(`Amateur Player Profile Score: ${score}/100`);
  console.log('Note: Score may be lower due to missing fields and no videos');
  return score;
}

// ============================================================================
// Example 3: Score a High School Player Profile
// ============================================================================

async function scoreHighSchoolPlayer() {
  const highSchoolPlayerData = {
    dateOfBirth: new Date('2007-03-12'),
    placeOfBirth: 'Los Angeles, CA',
    nationality: 'American',
    phoneNumber: '+1-555-123-4567',
    gender: 'Female',
    height: { size: 165, unit: 'cm' },
    weight: { size: 60, unit: 'kg' },
    position: 'Striker',
    schoolName: 'Lincoln High School',
    gpa: 3.8,
    graduationYear: 2025,
    country: 'United States',
    availability: 'Later',
    foot: 'Left',
    honors: 'All-State Team 2024',
    videos: [
      {
        url: '/uploads/videos/hs_highlights.mp4',
        duration: 150,
        title: 'Highlights - Junior Year',
        uploadedAt: new Date(),
      },
      {
        url: '/uploads/videos/hs_goals.mp4',
        duration: 90,
        title: 'Best Goals 2024',
        uploadedAt: new Date(),
      },
    ],
  };

  const score = await generateProfileScore(
    highSchoolPlayerData,
    CandidateRole.HIGH_SCHOOL
  );

  console.log(`High School Player Profile Score: ${score}/100`);
  return score;
}

// ============================================================================
// Example 4: Score an On Field Staff Profile
// ============================================================================

async function scoreOnFieldStaff() {
  const onFieldStaffData = {
    dateOfBirth: new Date('1985-11-08'),
    placeOfBirth: 'Milan, Italy',
    nationality: 'Italian',
    phoneNumber: '+39-321-654-987',
    gender: 'Male',
    position: 'Head Coach',
    yearsOfExperience: 12,
    educationLevel: 'Master\'s Degree in Sports Science',
    certifications: 'UEFA Pro License, Sports Psychology Certificate',
    currentEmployer: 'AC Milan Youth Academy',
    country: 'Italy',
    availability: 'Soon',
    specializations: 'Youth Development, Tactical Analysis',
    languages: 'Italian, English, Spanish',
    videos: [
      {
        url: '/uploads/videos/coaching_session.mp4',
        duration: 240,
        title: 'Tactical Training Session',
        uploadedAt: new Date(),
      },
    ],
  };

  const score = await generateProfileScore(
    onFieldStaffData,
    CandidateRole.ON_FIELD_STAFF
  );

  console.log(`On Field Staff Profile Score: ${score}/100`);
  return score;
}

// ============================================================================
// Example 5: Batch Score Multiple Profiles
// ============================================================================

async function batchScoreProfiles() {
  const profiles = [
    {
      data: {
        dateOfBirth: new Date('1998-01-01'),
        position: 'Goalkeeper',
        currentClub: 'Real Madrid',
        // ... minimal data
      },
      role: CandidateRole.PROFESSIONAL_PLAYER,
    },
    {
      data: {
        dateOfBirth: new Date('2005-06-15'),
        position: 'Forward',
        schoolName: 'Oak Hill Academy',
        gpa: 3.5,
        // ... minimal data
      },
      role: CandidateRole.HIGH_SCHOOL,
    },
    {
      data: {
        position: 'Assistant Coach',
        yearsOfExperience: 8,
        certifications: 'UEFA A License',
        // ... minimal data
      },
      role: CandidateRole.ON_FIELD_STAFF,
    },
  ];

  const scores = await batchGenerateProfileScores(profiles);

  console.log('Batch Scoring Results:');
  scores.forEach((score: number, index: number) => {
    console.log(`Profile ${index + 1}: ${score}/100`);
  });

  return scores;
}

// ============================================================================
// Example 6: Error Handling
// ============================================================================

async function handleScoringErrors() {
  try {
    // Example with potentially problematic data
    const invalidData = {
      // Very minimal data
      position: 'Unknown',
    };

    const score = await generateProfileScore(
      invalidData,
      CandidateRole.PROFESSIONAL_PLAYER
    );

    console.log(`Score (with minimal data): ${score}/100`);
    console.log('Note: Should return a low score, not throw an error');
  } catch (error) {
    console.error('Error occurred:', error);
    console.log('The service should not throw errors, but return 0 on failure');
  }
}


// ============================================================================
// Run Examples (Uncomment to test)
// ============================================================================

async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('AI Profile Scoring Examples');
  console.log('='.repeat(80));
  
  // await scoreProfessionalPlayer();
  // await scoreAmateurPlayer();
  // await scoreHighSchoolPlayer();
  // await scoreOnFieldStaff();
  // await batchScoreProfiles();
  // await handleScoringErrors();
  
  console.log('='.repeat(80));
  console.log('Examples completed!');
  console.log('='.repeat(80));
}

// Export examples for potential testing
export {
  scoreProfessionalPlayer,
  scoreAmateurPlayer,
  scoreHighSchoolPlayer,
  scoreOnFieldStaff,
  batchScoreProfiles,
  handleScoringErrors,
  runAllExamples,
};
