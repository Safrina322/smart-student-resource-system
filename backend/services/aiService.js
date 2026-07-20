import ai, { GEMINI_MODEL, SchemaType } from "../utils/geminiClient.js";
import { fetchResourceMedia } from "../utils/resourceContentFetcher.js";
import * as aiRepository from "../repositories/aiRepository.js";
import * as searchService from "./searchService.js";
import { AppError } from "../utils/AppError.js";

const QUIZ_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctIndex: { type: SchemaType.INTEGER, description: "0-based index into options" },
          explanation: { type: SchemaType.STRING },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["questions"],
};

const FLASHCARDS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    flashcards: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          front: { type: SchemaType.STRING },
          back: { type: SchemaType.STRING },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["flashcards"],
};

const STUDY_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    overview: { type: SchemaType.STRING },
    weeks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          weekNumber: { type: SchemaType.INTEGER },
          focus: { type: SchemaType.STRING },
          tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["weekNumber", "focus", "tasks"],
      },
    },
  },
  required: ["overview", "weeks"],
};

const RECOMMENDATIONS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          resourceId: { type: SchemaType.INTEGER },
          reason: { type: SchemaType.STRING },
        },
        required: ["resourceId", "reason"],
      },
    },
  },
  required: ["recommendations"],
};

const callGemini = async (params) => {
  try {
    return await ai.models.generateContent(params);
  } catch (err) {
    // Gemini's free tier throws 503 UNAVAILABLE (overloaded) or 429
    // RESOURCE_EXHAUSTED (rate limited) under load - both are transient and
    // worth a friendlier, actionable message instead of the raw error JSON.
    const message = err.message || "";
    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      throw new AppError("The AI service is busy right now. Please try again in a few seconds.", 503);
    }
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new AppError("AI usage limit reached for now. Please wait a moment and try again.", 429);
    }
    throw new AppError("AI generation failed. Please try again.", 502);
  }
};

const parseJsonResponse = (response) => {
  try {
    return JSON.parse(response.text);
  } catch {
    throw new AppError("AI returned an unreadable response. Please try again.", 502);
  }
};

const buildResourceContextText = (resource) =>
  `Title: ${resource.title}
Subject: ${resource.subject || "N/A"}
Department: ${resource.department || "N/A"}
Description: ${resource.description || "No description provided."}
Tags: ${resource.tags || "None"}`;

const buildResourceParts = async (resource) => {
  const media = await fetchResourceMedia(resource);
  if (media) {
    return [
      { inlineData: media },
      { text: `The above file is the resource "${resource.title}". Base your answer on its actual content.` },
    ];
  }
  return [
    {
      text: `No file content could be loaded for direct analysis. Base your answer only on this metadata:\n${buildResourceContextText(
        resource
      )}`,
    },
  ];
};

const getResourceOrThrow = async (resourceId) => {
  const resource = await aiRepository.findResourceById(resourceId);
  if (!resource) throw new AppError("Resource not found", 404);
  return resource;
};

export const summarizeResource = async (resourceId) => {
  const cached = await aiRepository.findCached(resourceId, "summary");
  if (cached) return cached;

  const resource = await getResourceOrThrow(resourceId);
  const parts = await buildResourceParts(resource);

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          ...parts,
          {
            text: "Summarize this study resource for a university student in 4-6 concise bullet points covering the key concepts, followed by one sentence on who it's most useful for. Plain text with '- ' bullet prefixes, no markdown headers.",
          },
        ],
      },
    ],
  });

  const result = { summary: response.text?.trim() || "" };
  await aiRepository.saveCache(resourceId, "summary", result);
  return result;
};

export const generateQuiz = async (resourceId, count = 5) => {
  const cacheType = `quiz:${count}`;
  const cached = await aiRepository.findCached(resourceId, cacheType);
  if (cached) return cached;

  const resource = await getResourceOrThrow(resourceId);
  const parts = await buildResourceParts(resource);

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          ...parts,
          {
            text: `Create exactly ${count} multiple-choice quiz questions testing understanding of this resource's key concepts. Each question needs exactly 4 options with only one correct answer, plus a 1-sentence explanation of why the correct answer is right.`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: QUIZ_SCHEMA },
  });

  const parsed = parseJsonResponse(response);
  await aiRepository.saveCache(resourceId, cacheType, parsed);
  return parsed;
};

export const generateFlashcards = async (resourceId, count = 8) => {
  const cacheType = `flashcards:${count}`;
  const cached = await aiRepository.findCached(resourceId, cacheType);
  if (cached) return cached;

  const resource = await getResourceOrThrow(resourceId);
  const parts = await buildResourceParts(resource);

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          ...parts,
          {
            text: `Create exactly ${count} flashcards covering this resource's key concepts. Each flashcard has a short term/question on the front and a concise 1-2 sentence explanation on the back.`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: FLASHCARDS_SCHEMA },
  });

  const parsed = parseJsonResponse(response);
  await aiRepository.saveCache(resourceId, cacheType, parsed);
  return parsed;
};

export const chatWithResource = async (resourceId, message, history = []) => {
  const resource = await getResourceOrThrow(resourceId);
  const resourceParts = await buildResourceParts(resource);

  const contents = [
    {
      role: "user",
      parts: [
        ...resourceParts,
        {
          text: `You are a study assistant answering questions about the resource "${resource.title}". Only answer based on the file content or metadata provided above. If the answer isn't in the material, say so honestly instead of guessing. Keep answers concise and student-friendly.`,
        },
      ],
    },
    {
      role: "model",
      parts: [{ text: "Understood - I'll answer questions about this resource based only on what's provided." }],
    },
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await callGemini({ model: GEMINI_MODEL, contents });
  return { reply: response.text?.trim() || "I couldn't generate a response. Please try again." };
};

export const generateStudyPlan = async (userId, { goal, hoursPerWeek, targetWeeks }) => {
  const courses = await aiRepository.findUserCourseTitles(userId);
  const courseList = courses.length
    ? courses.map((c) => `- ${c.title} (${c.subject || "General"})`).join("\n")
    : "No enrolled courses on record.";

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Create a realistic, week-by-week study plan.
Goal: ${goal}
Available time: ${hoursPerWeek} hours per week
Duration: ${targetWeeks} weeks
Courses the student is currently engaging with:
${courseList}

Produce exactly ${targetWeeks} weeks. Each week needs a short focus theme and 3-5 concrete, actionable tasks sized to fit within the weekly hour budget. Be specific and practical, not generic filler.`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: STUDY_PLAN_SCHEMA },
  });

  return parseJsonResponse(response);
};

export const getRecommendations = async (userId) => {
  const subjectRows = await aiRepository.findUserEngagementSubjects(userId);
  const subjects = subjectRows.map((r) => r.subject);
  const bookmarkedIds = await aiRepository.findUserBookmarkedResourceIds(userId);

  const candidates = await aiRepository.findCandidateResourcesBySubjects(subjects, bookmarkedIds, 15);
  if (!candidates.length) return { recommendations: [] };

  const candidateList = candidates
    .map(
      (c) =>
        `id=${c.id} | title="${c.title}" | subject=${c.subject || "N/A"} | description=${(c.description || "").slice(
          0,
          150
        )}`
    )
    .join("\n");

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `A student has shown interest in these subjects: ${
              subjects.length ? subjects.join(", ") : "no strong pattern yet - use your best judgment from the candidates below"
            }.
Pick up to 5 of the most relevant resources from this candidate list, and for each give a one-sentence reason tailored to the student. Only use resourceId values that literally appear in the list below - never invent one.

${candidateList}`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: RECOMMENDATIONS_SCHEMA },
  });

  const parsed = parseJsonResponse(response);
  const byId = new Map(candidates.map((c) => [c.id, c]));

  const recommendations = parsed.recommendations
    .filter((r) => byId.has(r.resourceId))
    .map((r) => ({ ...byId.get(r.resourceId), reason: r.reason }));

  return { recommendations };
};

export const searchAssist = async (query) => {
  const results = await searchService.search(query);
  const snippets = [
    ...results.lecturerResources.slice(0, 5).map((r) => `- [Resource #${r.id}] ${r.title}: ${(r.description || "").slice(0, 200)}`),
    ...results.courses.slice(0, 5).map((c) => `- [Course #${c.id}] ${c.title}: ${(c.subject || "").slice(0, 200)}`),
  ];

  if (!snippets.length) {
    return { answer: null, results };
  }

  const response = await callGemini({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `A student searched for: "${query}"

Here are the matching items found in the system:
${snippets.join("\n")}

In 2-3 sentences, directly answer what the student is likely looking for, referencing the specific items above by name. If none of them genuinely help, say so plainly. Do not invent items that aren't listed.`,
          },
        ],
      },
    ],
  });

  return { answer: response.text?.trim() || null, results };
};
