export interface EncryptedProfile {
  id: string;
  hash: string;
  type: "candidate" | "employer";
  label: string;
  // Hidden values - never displayed directly
  _minSalary?: number;
  _maxSalary?: number;
  _experience?: number;
  _skillLevel?: number;
  _budget?: number;
  _requiredExp?: number;
}

export interface MatchResult {
  compatible: boolean;
  score: number;
  suggestedSalary?: number;
  candidateHash: string;
  employerHash: string;
}

export const PRESET_MATCHES = [
  {
    label: "Senior Dev vs Startup",
    candidate: {
      id: "c1",
      hash: "0x7f3a9b2c4e1d8f5a",
      type: "candidate" as const,
      label: "Senior Engineer",
      _minSalary: 120000,
      _maxSalary: 150000,
      _experience: 8,
      _skillLevel: 9,
    },
    employer: {
      id: "e1",
      hash: "0x9b2c4e1d8f5a7f3a",
      type: "employer" as const,
      label: "Series A Startup",
      _budget: 130000,
      _requiredExp: 6,
    },
    result: {
      compatible: true,
      score: 94,
      suggestedSalary: 125000,
      candidateHash: "0x7f3a9b2c4e1d8f5a",
      employerHash: "0x9b2c4e1d8f5a7f3a",
    },
  },
  {
    label: "Junior Designer vs Agency",
    candidate: {
      id: "c2",
      hash: "0x3d8e2f1a9c7b4e6d",
      type: "candidate" as const,
      label: "Junior Designer",
      _minSalary: 60000,
      _maxSalary: 80000,
      _experience: 2,
      _skillLevel: 6,
    },
    employer: {
      id: "e2",
      hash: "0x1a9c7b4e6d3d8e2f",
      type: "employer" as const,
      label: "Creative Agency",
      _budget: 70000,
      _requiredExp: 1,
    },
    result: {
      compatible: true,
      score: 78,
      suggestedSalary: 65000,
      candidateHash: "0x3d8e2f1a9c7b4e6d",
      employerHash: "0x1a9c7b4e6d3d8e2f",
    },
  },
  {
    label: "No Match — Ranges Diverge",
    candidate: {
      id: "c3",
      hash: "0x5c9f2e8a1b4d7e3c",
      type: "candidate" as const,
      label: "Principal Architect",
      _minSalary: 200000,
      _maxSalary: 250000,
      _experience: 15,
      _skillLevel: 10,
    },
    employer: {
      id: "e3",
      hash: "0x8a1b4d7e3c5c9f2e",
      type: "employer" as const,
      label: "Early Stage Startup",
      _budget: 90000,
      _requiredExp: 5,
    },
    result: {
      compatible: false,
      score: 0,
      candidateHash: "0x5c9f2e8a1b4d7e3c",
      employerHash: "0x8a1b4d7e3c5c9f2e",
    },
  },
];

export function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 16; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function computeMatch(
  candidateMin: number,
  candidateMax: number,
  employerBudget: number,
  candidateExp: number,
  requiredExp: number
): MatchResult {
  const overlap = Math.min(candidateMax, employerBudget) - Math.max(candidateMin, employerBudget * 0.85);
  const expMatch = candidateExp >= requiredExp;
  
  if (overlap <= 0 || !expMatch) {
    return {
      compatible: false,
      score: 0,
      candidateHash: generateHash(),
      employerHash: generateHash(),
    };
  }

  const salaryScore = Math.min(100, (overlap / (candidateMax - candidateMin)) * 100);
  const expScore = Math.min(100, (candidateExp / requiredExp) * 50 + 50);
  const score = Math.round((salaryScore * 0.6 + expScore * 0.4));
  const suggestedSalary = Math.round((Math.max(candidateMin, employerBudget * 0.9) + Math.min(candidateMax, employerBudget)) / 2);

  return {
    compatible: true,
    score: Math.min(99, Math.max(60, score)),
    suggestedSalary,
    candidateHash: generateHash(),
    employerHash: generateHash(),
  };
}
