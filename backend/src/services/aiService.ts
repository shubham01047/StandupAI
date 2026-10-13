import OpenAI from 'openai';
import { TaskCategory, TaskStatus } from '../models/Task';

export interface ExtractedTaskData {
  title: string;
  category: TaskCategory;
  status: TaskStatus;
}

const getAIClient = () => {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const apiKey = groqKey || openaiKey;
  const isGroq = Boolean(groqKey || (apiKey && apiKey.startsWith('gsk_')));

  if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'your_groq_api_key_here') {
    return null;
  }

  return {
    client: new OpenAI({
      apiKey,
      baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined,
    }),
    isGroq,
  };
};

/**
 * Parses raw standup text (did, doing, blockers) into an array of structured task items
 */
export const extractTasksFromStandup = async (
  did: string,
  doing: string,
  blockers: string
): Promise<ExtractedTaskData[]> => {
  const ai = getAIClient();

  // If Groq or OpenAI API client is configured, call Chat Completions API
  if (ai) {
    try {
      const { client, isGroq } = ai;
      const modelName = isGroq ? 'llama3-8b-8192' : 'gpt-4o-mini';
      console.log(`[AIService] Processing task extraction with provider: ${isGroq ? 'Groq (Llama 3.1 8B)' : 'OpenAI (GPT-4o-mini)'}`);

      const prompt = `You are an AI task extraction assistant for engineering teams.
Parse the following daily standup input and extract clear, concise, actionable task items.

Input:
- Accomplished (Did): "${did}"
- Planned Today (Doing): "${doing}"
- Impediments (Blockers): "${blockers}"

Return ONLY a valid JSON object containing a "tasks" array. Each task object MUST have:
- "title": concise task summary (max 80 chars)
- "category": one of ["did", "doing", "blocker"]
- "status": mapped as follows:
    - category "did" -> "done"
    - category "doing" -> "in-progress"
    - category "blocker" -> "blocked"

Example JSON output format:
{
  "tasks": [
    { "title": "Implement JWT refresh token endpoint", "category": "did", "status": "done" },
    { "title": "Build AI task extraction pipeline", "category": "doing", "status": "in-progress" }
  ]
}`;

      const response = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const tasksArray = Array.isArray(parsed) ? parsed : parsed.tasks || Object.values(parsed)[0];
        if (Array.isArray(tasksArray) && tasksArray.length > 0) {
          return tasksArray
            .map((t: any) => ({
              title: String(t.title || '').trim(),
              category: (['did', 'doing', 'blocker'].includes(t.category) ? t.category : 'doing') as TaskCategory,
              status: (['todo', 'in-progress', 'blocked', 'done'].includes(t.status)
                ? t.status
                : t.category === 'did'
                ? 'done'
                : t.category === 'blocker'
                ? 'blocked'
                : 'in-progress') as TaskStatus,
            }))
            .filter((t) => t.title.length > 0);
        }
      }
    } catch (err) {
      console.warn('[AIService] Cloud LLM API call failed, falling back to rule-based parser:', err);
    }
  }

  // Fallback Rule-Based Parser (Bullet Point / Line Extraction)
  return fallbackRuleBasedExtractor(did, doing, blockers);
};

/**
 * Heuristic rule-based fallback parser for extracting tasks when API key is unconfigured
 */
const fallbackRuleBasedExtractor = (
  did: string,
  doing: string,
  blockers: string
): ExtractedTaskData[] => {
  const tasks: ExtractedTaskData[] = [];

  const parseSection = (text: string, category: TaskCategory, defaultStatus: TaskStatus) => {
    if (!text || text.trim() === '' || text.toLowerCase() === 'none') return;

    // Split text by newlines first
    const rawLines = text.split(/\r?\n/);
    const cleanedLines: string[] = [];

    rawLines.forEach((rawLine) => {
      // Split on bullet symbols (• or *) or space-surrounded dashes (" - ") so hyphenated words like "real-time" remain intact
      const subItems = rawLine
        .split(/(?:[•*]|\s+-\s+)/)
        .map((item) => item.trim().replace(/^[-•*]\s*/, ''))
        .filter((item) => item.length > 2);

      cleanedLines.push(...subItems);
    });

    cleanedLines.forEach((line) => {
      const cleanTitle = line.length > 90 ? `${line.substring(0, 87)}...` : line;
      tasks.push({
        title: cleanTitle,
        category,
        status: defaultStatus,
      });
    });
  };

  parseSection(did, 'did', 'done');
  parseSection(doing, 'doing', 'in-progress');
  parseSection(blockers, 'blocker', 'blocked');

  return tasks;
};
