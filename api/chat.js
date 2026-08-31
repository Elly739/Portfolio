const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

function buildLocalAnswer(question, knowledge) {
  const lower = question.toLowerCase();
  const identity = knowledge.identity || {};
  const projects = Array.isArray(knowledge.projects) ? knowledge.projects : [];
  const skills = Array.isArray(knowledge.skills) ? knowledge.skills : [];
  const leadership = Array.isArray(knowledge.leadership) ? knowledge.leadership : [];

  if (lower.includes('resume') || lower.includes('cv') || lower.includes('summar')) {
    return knowledge.resumeSummary || `${identity.name || 'Okello Elly'} is a software engineer focused on web, AI, cloud, and data systems.`;
  }

  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('ml')) {
    const aiProjects = projects.filter(project =>
      /ai|machine|tensorflow|energy|sustainability/i.test(
        `${project.category || ''} ${project.summary || ''} ${(project.technologies || []).join(' ')}`
      )
    );
    if (!aiProjects.length) return 'The portfolio highlights AI/ML as a core focus area, but no matching AI project details were found in the knowledge base.';
    return `Projects involving AI include ${aiProjects.map(project => project.name).join(', ')}. ${aiProjects.map(project => `${project.name} focuses on ${project.summary}`).join(' ')}`;
  }

  if (lower.includes('react')) {
    const reactProjects = projects.filter(project =>
      (project.technologies || []).some(tech => String(tech).toLowerCase() === 'react')
    );
    return reactProjects.length
      ? `Yes. Elly has React experience, especially through ${reactProjects.map(project => project.name).join(', ')}.`
      : "React appears in Elly's broader front-end skill set, but no React-specific project was found in the current knowledge base.";
  }

  if (lower.includes('react native') || lower.includes('afronative')) {
    const rnProjects = projects.filter(project =>
      /react native|afronative|mobile.*learning|language.*learning/i.test(
        `${project.name || ''} ${project.summary || ''} ${(project.technologies || []).join(' ')}`
      )
    );
    if (rnProjects.length) {
      return `Yes. Elly is currently contributing to ${rnProjects.map(project => project.name).join(' and ')} at Momentum Labs — an AI-powered African language learning platform built with React Native, focused on mobile-first education, pronunciation feedback, conversational learning, and interactive lessons.`;
    }
    return 'React Native appears in Elly\'s mobile development skill set. He is currently applying it at Momentum Labs on the AfroNative language learning platform.';
  }

  if (lower.includes('android') || lower.includes('mobile')) {
    const mobileProjects = projects.filter(project =>
      (project.technologies || []).some(tech => /android|kotlin|xml|react native/i.test(String(tech)))
    );
    if (mobileProjects.length) {
      return `Yes, Elly has mobile development experience. ${mobileProjects.map(project => `${project.name}`).join(', ')} involve mobile development with React Native, Kotlin, and XML.`;
    }
    return 'The portfolio includes mobile development services for Android and React Native apps.';
  }

  if (lower.includes('skill') || lower.includes('technolog') || lower.includes('stack')) {
    return `Elly works with ${skills.join(', ')}. His strongest visible areas are frontend engineering, backend APIs, AI/ML systems, cloud architecture, data engineering, and mobile development with React Native.`;
  }

  if (lower.includes('leadership') || lower.includes('leader')) {
    return leadership.length ? leadership.join(' ') : 'The portfolio positions Elly around human-centered innovation, collaboration, and public-facing technology leadership.';
  }

  if (lower.includes('project')) {
    return `Elly's featured projects include:\n${projects.map(project => `${project.name}: ${project.summary}`).join('\n')}`;
  }

  if (lower.includes('contact') || lower.includes('hire') || lower.includes('available')) {
    const contact = identity.contact || {};
    return `Elly is ${identity.availability || 'open to collaborations and project work.'} You can contact him at ${contact.email || 'the email listed on the portfolio'}, GitHub ${contact.github || 'GitHub linked on the site'}, or LinkedIn ${contact.linkedin || 'LinkedIn linked on the site'}.`;
  }

  return `${identity.name || 'Okello Elly'} is a ${identity.headline || 'Software Engineer'}. ${identity.summary || 'He builds intelligent systems, scalable applications, and practical digital products.'} Ask me about his AI projects, React experience, React Native mobile work, skills, resume, leadership, projects, or availability.`;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).send('Method not allowed');
  }

  const { question, history = [], knowledge = {} } = request.body || {};
  if (!question || typeof question !== 'string') {
    return response.status(400).send('Question is required');
  }

  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Cache-Control', 'no-cache, no-transform');

  if (!process.env.ANTHROPIC_API_KEY) {
    return response.status(200).send(buildLocalAnswer(question, knowledge));
  }

  const messages = [
    ...history.slice(-10).map(message => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content || '')
    })),
    { role: 'user', content: question }
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
        'You are the AI assistant on Okello Elly portfolio website. Answer only from the provided portfolio knowledge. Be concise, recruiter-friendly, and honest when information is not listed.\n\nPortfolio knowledge:\n' +
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
      if (!dataLine) continue;
      const data = dataLine.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const text = parsed.delta?.text;
        if (text) response.write(text);
      } catch {
        // Ignore partial stream chunks that are not JSON payloads.
      }
    }
  }

  return response.end();
}