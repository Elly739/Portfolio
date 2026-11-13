import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './chat.js';
import { buildLocalAnswer } from '../src/portfolioAssistant.js';
import { portfolioKnowledge } from '../src/portfolioKnowledge.js';

function createResponse() {
  return {
    code: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    write(chunk) {
      this.body += chunk;
    },
    end() {
      this.ended = true;
      return this.body;
    }
  };
}

test('portfolio fallback answers skills, education, projects, services, and leadership', () => {
  assert.match(buildLocalAnswer('What technical skills are listed?', portfolioKnowledge), /CrewAI/);
  assert.match(buildLocalAnswer('Where did Elly study?', portfolioKnowledge), /Zetech University/);
  assert.match(buildLocalAnswer('What AI projects are in the portfolio?', portfolioKnowledge), /AfroNative/);
  assert.match(buildLocalAnswer('Tell me about VumaGrid', portfolioKnowledge), /VumaGrid/);
  assert.match(buildLocalAnswer('Does Elly use Java?', portfolioKnowledge), /Java is listed/);
  assert.match(buildLocalAnswer('What services are available?', portfolioKnowledge), /Web development/);
  assert.match(buildLocalAnswer('What community work has Elly done?', portfolioKnowledge), /Aspire Institute/);
  const experienceAnswer = buildLocalAnswer('Tell me about work experience', portfolioKnowledge);
  assert.match(experienceAnswer, /Momentum Labs/);
  assert.match(experienceAnswer, /Flyrank/);
  assert.doesNotMatch(experienceAnswer, /Campus Pulse/);
});

test('portfolio fallback is explicit about unsupported details and invalid input', () => {
  assert.match(buildLocalAnswer("What is Elly's favorite food?", portfolioKnowledge), /don't find that detail/);
  assert.match(buildLocalAnswer('', portfolioKnowledge), /Please enter a question/);
  assert.match(buildLocalAnswer('What did Elly study?', null), /not listed/);
});

test('chat API validates requests and uses local answers without a provider key', async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const invalidResponse = createResponse();
    await handler({ method: 'POST', body: { question: '   ' } }, invalidResponse);
    assert.equal(invalidResponse.code, 400);

    const methodResponse = createResponse();
    await handler({ method: 'GET' }, methodResponse);
    assert.equal(methodResponse.code, 405);
    assert.equal(methodResponse.headers.Allow, 'POST');

    const response = createResponse();
    await handler({
      method: 'POST',
      body: { question: 'Tell me about community engagement', knowledge: portfolioKnowledge }
    }, response);
    assert.equal(response.code, 200);
    assert.match(response.body, /Aspire Institute/);
    assert.match(response.body, /Aspire Leaders Program/);
    assert.equal(response.headers['X-Portfolio-Assistant-Mode'], 'local');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  }
});

test('chat API streams provider output with portfolio context and the current default model', async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousModel = process.env.ANTHROPIC_MODEL;
  const previousFetch = globalThis.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  delete process.env.ANTHROPIC_MODEL;

  let providerRequest;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    providerRequest = JSON.parse(options.body);
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"text":"Hello '));
        controller.enqueue(encoder.encode('Elly"}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","delta":{"text":"!"}}\n\n'));
        controller.close();
      }
    });
    return { ok: true, body };
  };

  try {
    const response = createResponse();
    await handler({
      method: 'POST',
      body: {
        question: 'Tell me about your community work',
        history: [{ role: 'user', content: 'Earlier question' }],
        knowledge: portfolioKnowledge
      }
    }, response);

    assert.equal(response.code, 200);
    assert.equal(response.body, 'Hello Elly!');
    assert.equal(response.ended, true);
    assert.equal(providerRequest.model, 'claude-sonnet-5-5');
    assert.equal(providerRequest.stream, true);
    assert.equal(providerRequest.messages.at(-1).content, 'Tell me about your community work');
    assert.match(providerRequest.system, /Community Volunteer Moderator/);
    assert.match(providerRequest.system, /Do not substitute the project catalog for work history/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.ANTHROPIC_MODEL;
    else process.env.ANTHROPIC_MODEL = previousModel;
  }
});
