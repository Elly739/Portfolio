import { buildLocalAnswer } from '../src/portfolioAssistant.js';

const ANTHROPIC_MODEL = 'claude-sonnet-5-5';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Method not allowed');
  }

  const body = request.body && typeof request.body === 'object' ? request.body : {};
  const { question } = body;
  const history = Array.isArray(body.history) ? body.history : [];
  const knowledge = body.knowledge && typeof body.knowledge === 'object' ? body.knowledge : {};
  if (typeof question !== 'string' || !question.trim()) {
    return response.status(400).send('Question is required');
  }

  const prompt = question.trim();
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');

  if (!process.env.ANTHROPIC_API_KEY) {
    return response.status(200).send(buildLocalAnswer(prompt, knowledge));
  }

  const messages = [
    ...history.slice(-10).filter(message => message && typeof message === 'object').map(message => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '')
    })),
    { role: 'user', content: prompt }
  ];

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || ANTHROPIC_MODEL,
      max_tokens: 700,
      stream: true,
      system:
        'You are the portfolio assistant for Okello Elly. Use the provided portfolio knowledge as the only source of personal facts; do not invent skills, dates, roles, project outcomes, or contact details. Answer naturally and concisely, use conversation context, and say clearly when a detail is not listed. You can help visitors explore the portfolio, but do not claim to browse the web or perform external actions.\n\nPortfolio knowledge:\n' +
        JSON.stringify(knowledge, null, 2),
      messages
    })
  });

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    const errorText = await anthropicResponse.text();
    return response.status(502).send(errorText || 'AI provider request failed');
  }

  response.status(200);
  const reader = anthropicResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event
        .split('\n')
        .find(line => line.startsWith('data: '));
      if (!dataLine || dataLine === 'data: [DONE]') continue;

      try {
        const parsed = JSON.parse(dataLine.slice(6));
        if (parsed.delta?.text) response.write(parsed.delta.text);
      } catch {
        // Ignore partial stream chunks that are not complete JSON events.
      }
    }
  }

  return response.end();
}
