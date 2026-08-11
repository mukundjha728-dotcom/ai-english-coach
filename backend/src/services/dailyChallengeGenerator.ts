const CHALLENGES = [
  {
    topic: "Describe your favorite memory from childhood.",
    type: "Storytelling",
    duration: "2-minute speaking",
  },
  {
    topic: "Is remote work better than working in an office? Argue your case.",
    type: "Debate",
    duration: "3-minute speaking",
  },
  {
    topic: "If you could instantly become an expert in any one subject, what would it be and why?",
    type: "Opinion",
    duration: "2-minute speaking",
  },
  {
    topic: "Describe a recent news event that caught your attention.",
    type: "News Discussion",
    duration: "3-minute speaking",
  },
  {
    topic: "What is a book, movie, or song that changed your perspective on life?",
    type: "Personal Experience",
    duration: "2-minute speaking",
  },
  {
    topic: "Explain a complex topic or hobby you enjoy to someone who knows nothing about it.",
    type: "Explanation",
    duration: "3-minute speaking",
  }
];

/**
 * Returns a daily challenge seeded by the current date.
 * This ensures all users see the same challenge on a given day.
 */
export function getDailyChallenge() {
  const date = new Date();
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const index = seed % CHALLENGES.length;
  
  return CHALLENGES[index];
}
