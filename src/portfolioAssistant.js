const formatProject = project => {
  const details = [`${project.name}: ${project.summary}`];
  if (Array.isArray(project.technologies) && project.technologies.length) {
    details.push(`Technologies: ${project.technologies.join(', ')}.`);
  }
  if (Array.isArray(project.highlights) && project.highlights.length) details.push(project.highlights.join(' '));
  return details.join(' ');
};

const normalizePhrase = value => value.toLowerCase().replace(/[^a-z0-9#+]+/g, ' ').trim();

export function buildLocalAnswer(question, knowledge = {}) {
  const prompt = typeof question === 'string' ? question.trim() : '';
  if (!prompt) return "Please enter a question about Elly's portfolio.";

  const lower = prompt.toLowerCase();
  const data = knowledge && typeof knowledge === 'object' ? knowledge : {};
  const identity = data.identity && typeof data.identity === 'object' ? data.identity : {};
  const education = Array.isArray(data.education) ? data.education : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const community = Array.isArray(data.communityEngagement) ? data.communityEngagement : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const services = Array.isArray(data.services) ? data.services : [];

  if (/\b(resume|cv|summarize|summarise|background)\b/.test(lower)) {
    return data.resumeSummary || identity.summary || 'Resume details are not listed in the portfolio yet.';
  }

  if (/\b(education|degree|university|school|course|study|studies)\b/.test(lower)) {
    if (!education.length) return 'Education details are not listed in the portfolio yet.';
    return education.map(item =>
      `${item.program} at ${item.school} (${item.period}): ${item.focus}`
    ).join(' ');
  }

  if (/\b(leadership|leader|community|volunteer|aspire|alumni)\b/.test(lower)) {
    const roles = community.map(item =>
      `${item.role} at ${item.organization} (${item.period}): ${item.summary}`
    );
    const broaderLeadership = Array.isArray(data.leadership) ? data.leadership : [];
    return [...roles, ...broaderLeadership].join(' ') || 'Leadership and community engagement details are not listed in the portfolio yet.';
  }

  if (/\b(services?|consulting|offerings?)\b/.test(lower)) {
    return services.length
      ? `Portfolio services include ${services.join(', ')}.`
      : 'Service details are not listed in the portfolio yet.';
  }

  if (/\b(contact|hire|available|availability)\b/.test(lower)) {
    const contact = identity.contact || {};
    return `Elly is ${identity.availability || 'open to collaborations and project work.'} Contact him at ${contact.email || 'the email listed on the site'}, GitHub ${contact.github || 'linked on the site'}, or LinkedIn ${contact.linkedin || 'linked on the site'}.`;
  }

  if (/\b(skills?|technologies|technology|stack|tools?|languages?|frameworks?|databases?|cloud|devops|network|security|automation)\b/.test(lower)) {
    if (!skills.length) return 'Technical skills are not listed in the portfolio yet.';
    return `Elly's listed technical skills include ${skills.join(', ')}.`;
  }

  if (/\b(react native|afronative)\b/.test(lower)) {
    const role = experience.find(item => /afronative/i.test(`${item.summary} ${item.role}`));
    return role
      ? `Elly is contributing to AfroNative at ${role.organization} as an ${role.role}. ${role.summary}`
      : "React Native is listed among Elly's skills, with mobile-development work described in the portfolio.";
  }

  if (/\breact\b/.test(lower)) {
    const reactProjects = projects.filter(project =>
      (project.technologies || []).some(technology => technology.toLowerCase() === 'react')
    );
    return reactProjects.length
      ? `Elly has React experience through ${reactProjects.map(project => project.name).join(', ')}.`
      : "React is listed among Elly's front-end skills.";
  }

  if (/\b(android|mobile)\b/.test(lower)) {
    const mobileProjects = projects.filter(project =>
      (project.technologies || []).some(technology => /android|kotlin|xml|react native/i.test(technology))
    );
    return mobileProjects.length
      ? `Mobile projects include ${mobileProjects.map(project => project.name).join(', ')}. Elly works with React Native, Kotlin, and Android technologies listed in the portfolio.`
      : "Mobile development is listed among Elly's portfolio services and skills.";
  }

  const normalizedPrompt = ` ${normalizePhrase(lower)} `;
  const mentionedSkills = skills.filter(skill => {
    const normalizedSkill = normalizePhrase(skill);
    return (normalizedSkill.length > 2 || normalizedSkill === 'c#') &&
      normalizedPrompt.includes(` ${normalizedSkill} `);
  });
  if (mentionedSkills.length) {
    return `Yes. ${mentionedSkills.join(', ')} ${mentionedSkills.length === 1 ? 'is' : 'are'} listed among Elly's technical skills.`;
  }

  const matchedProjects = projects.filter(project => lower.includes(project.name.toLowerCase()));
  if (matchedProjects.length) return matchedProjects.map(formatProject).join(' ');

  if (/\b(ai|artificial intelligence|machine learning|ml)\b/.test(lower)) {
    const aiProjects = projects.filter(project =>
      /ai|machine|tensorflow|energy|sustainability|language learning|pronunciation/i.test(
        `${project.category || ''} ${project.summary || ''} ${(project.technologies || []).join(' ')}`
      )
    );
    return aiProjects.length
      ? `Projects involving AI include ${aiProjects.map(project => project.name).join(', ')}. ${aiProjects.map(formatProject).join(' ')}`
      : "The portfolio lists AI among Elly's focus areas, but has no matching project details yet.";
  }

  if (/\b(project|portfolio|work)\b/.test(lower)) {
    return `Featured projects include ${projects.map(project => `${project.name}: ${project.summary}`).join(' ')}`;
  }

  if (/\b(experience|career|intern|employment|freelance)\b/.test(lower)) {
    return experience.length
      ? experience.map(item => `${item.role} at ${item.organization} (${item.period}): ${item.summary}`).join(' ')
      : 'Professional experience details are not listed in the portfolio yet.';
  }

  const introduction = identity.summary || `${identity.name || 'Okello Elly'} is a ${identity.headline || 'Software Engineer'}. He builds intelligent systems and practical digital products.`;
  return `I don't find that detail in the portfolio. ${introduction} I can answer questions about his skills, projects, experience, education, services, leadership, and contact details.`;
}
