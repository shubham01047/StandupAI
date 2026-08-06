import { Team } from '../models/Team';

/**
 * Generates a unique 6-character uppercase invite code formatted as SAI-XXXX
 */
export const generateUniqueInviteCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude visually ambiguous characters (0, O, 1, I)
  let code = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomPart += characters[randomIndex];
    }
    code = `SAI-${randomPart}`;

    const existingTeam = await Team.findOne({ inviteCode: code });
    if (!existingTeam) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback timestamp hex suffix if collision occurs multiple times
    code = `SAI-${Date.now().toString(36).substring(4, 8).toUpperCase()}`;
  }

  return code;
};
