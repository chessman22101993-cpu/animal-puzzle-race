// The 10 canonical racing animals specified by user requirements:
// cheetah, tiger, lion, horse, falcon, zebra, wolf, elephant, bear, ostrich
const ANIMALS = [
  { id: 'cheetah', name: 'Cheetah', speed: 'Lightning', color: '#F59E0B' },
  { id: 'tiger', name: 'Tiger', speed: 'Fierce', color: '#F97316' },
  { id: 'lion', name: 'Lion', speed: 'Majestic', color: '#EAB308' },
  { id: 'horse', name: 'Horse', speed: 'Gallop', color: '#B45309' },
  { id: 'falcon', name: 'Falcon', speed: 'Supersonic', color: '#3B82F6' },
  { id: 'zebra', name: 'Zebra', speed: 'Turbo', color: '#06B6D4' },
  { id: 'wolf', name: 'Wolf', speed: 'Agile', color: '#64748B' },
  { id: 'elephant', name: 'Elephant', speed: 'Unstoppable', color: '#8B5CF6' },
  { id: 'bear', name: 'Bear', speed: 'Mighty', color: '#78350F' },
  { id: 'ostrich', name: 'Ostrich', speed: 'Sprint', color: '#EC4899' }
];

const BADGE_TIERS = [
  { level: 1, label: 'Racer', ringColor: '#10B981' },
  { level: 2, label: 'Turbo', ringColor: '#8B5CF6' },
  { level: 3, label: 'Nitro', ringColor: '#F43F5E' },
  { level: 4, label: 'Hyper', ringColor: '#06B6D4' }
];

/**
 * Assigns an animal to a joining student according to the rules:
 * - Pick an unused animal at random from the 10 available.
 * - If all 10 are in use, reuse animals with incremented badge level and distinct ring color.
 */
function assignAnimal(existingStudents = {}) {
  const assignedCounts = {};
  for (const a of ANIMALS) {
    assignedCounts[a.id] = 0;
  }

  // Count occurrences of each animal among existing students
  for (const s of Object.values(existingStudents)) {
    if (s.animal && s.animal.id && assignedCounts[s.animal.id] !== undefined) {
      assignedCounts[s.animal.id]++;
    }
  }

  // Find minimum assignment count
  const minCount = Math.min(...Object.values(assignedCounts));

  // Eligible pool is all animals assigned minCount times
  const eligible = ANIMALS.filter(a => assignedCounts[a.id] === minCount);

  // Pick random animal from eligible pool
  const chosen = eligible[Math.floor(Math.random() * eligible.length)];

  // Determine badge tier
  const tierIndex = Math.min(minCount, BADGE_TIERS.length - 1);
  const badgeInfo = BADGE_TIERS[tierIndex];

  return {
    id: chosen.id,
    name: chosen.name,
    baseColor: chosen.color,
    badgeLevel: minCount + 1,
    badgeLabel: badgeInfo.label,
    ringColor: badgeInfo.ringColor
  };
}

/**
 * Ensure student name is unique in the room.
 * If blank: assigns a unique guest name (e.g. "Guest Cheetah 7").
 * If repeats: appends a number (e.g. "Alex 2").
 */
function resolveStudentName(desiredName, assignedAnimal, existingStudents = {}) {
  const existingNames = new Set(
    Object.values(existingStudents).map(s => (s.name || '').trim().toLowerCase())
  );

  let name = (desiredName || '').trim();

  // If blank, assign unique guest name
  if (!name) {
    const num = Math.floor(10 + Math.random() * 90);
    name = `Guest ${assignedAnimal.name} ${num}`;
  }

  // If name collision, append numbers: "Name 2", "Name 3", etc.
  if (existingNames.has(name.toLowerCase())) {
    let counter = 2;
    let candidate = `${name} ${counter}`;
    while (existingNames.has(candidate.toLowerCase())) {
      counter++;
      candidate = `${name} ${counter}`;
    }
    name = candidate;
  }

  return name;
}

module.exports = {
  ANIMALS,
  BADGE_TIERS,
  assignAnimal,
  resolveStudentName
};
