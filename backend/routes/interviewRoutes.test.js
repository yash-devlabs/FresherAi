import test from 'node:test';
import assert from 'node:assert/strict';
import { interviewStartSchema, startInterview, buildInterviewQuestionPrompt, buildInterviewGradePrompt } from './interviewRoutes.js';
import { gradeSchema } from '../ai/schemas.js';

test('accepts Technical and Behavioral interview start requests', () => {
  for (const interviewType of ['technical', 'behavioral']) {
    const result = interviewStartSchema.safeParse({ role: 'Software Engineer', interviewType });
    assert.equal(result.success, true);
    assert.equal(result.data.interviewType, interviewType);
  }
});

test('defaults omitted interview type to Technical', () => {
  const result = interviewStartSchema.safeParse({ role: 'Software Engineer' });
  assert.equal(result.success, true);
  assert.equal(result.data.interviewType, 'technical');
});

test('rejects unsupported interview types', () => {
  for (const interviewType of ['mixed', 'hr', 'Mixed', 'HR', 'screening']) {
    assert.equal(interviewStartSchema.safeParse({ role: 'Software Engineer', interviewType }).success, false);
  }
});

test('returns a safe 400 response before AI or database access for unsupported requests', async () => {
  for (const interviewType of ['mixed', 'hr']) {
    const response = {
      statusCode: 200,
      body: undefined,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await startInterview({ body: { role: 'Software Engineer', interviewType } }, response);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { status: 'error', message: 'Choose a Technical or Behavioral interview type.' });
  }
});

test('question prompts calibrate easy, medium, and hard to the requested role', () => {
  const expected = {
    easy: ['basic syntax', 'simple code interpretation'],
    medium: ['debug a realistic snippet', 'predict output', 'data structure'],
    hard: ['edge cases', 'optimization', 'multi-step problem'],
  };
  for (const [difficulty, phrases] of Object.entries(expected)) {
    const prompt = buildInterviewQuestionPrompt({ count: 5, interviewType: 'technical', role: 'Frontend Developer', difficulty });
    assert.match(prompt, /Frontend Developer/);
    assert.match(prompt, /exactly 5/);
    for (const phrase of phrases) assert.ok(prompt.toLowerCase().includes(phrase.toLowerCase()), `${difficulty} prompt lacks ${phrase}`);
  }
});

test('grading prompt requires fair partial credit and complete educational feedback', () => {
  const prompt = buildInterviewGradePrompt({ role: 'Backend Engineer', difficulty: 'hard', question: 'How would you scale this API?', answer: 'Use caching and pagination.' });
  for (const phrase of ['Backend Engineer', 'hard difficulty', 'different words', 'Partially Correct', 'Unanswered', 'score consistent']) {
    assert.ok(prompt.toLowerCase().includes(phrase.toLowerCase()), `grading prompt lacks ${phrase}`);
  }
  assert.match(prompt, /coding.*edge cases.*complexity/i);
  assert.match(prompt, /Never claim strengths/);
  assert.doesNotMatch(prompt, /idealAnswer|Ideal Answer/);
});

