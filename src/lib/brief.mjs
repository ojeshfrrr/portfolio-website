import { features, goals, projectTypes as plannerTypes } from './planner.mjs';
export const contactProjectTypes = [...new Set(['Website development', 'Small-business website', 'Landing page', 'Web application', 'UI refinement', 'Not sure yet', ...plannerTypes.map(([label]) => label)])];
export function prepareBrief(fields) {
  const read = key => typeof fields[key] === 'string' ? fields[key].trim() : '';
  const name = read('name'), email = read('email'), projectType = read('projectType');
  const businessName = read('businessName');
  const description = read('description'), budget = read('budget'), timeline = read('timeline');
  const errors = {};
  const goal = read('goal'), industry = read('industry'), selectedFeatures = read('features'), plannerBrief = read('plannerBrief');
  if (goal && !goals.includes(goal)) errors.goal = 'Choose a listed goal.';
  if (industry.length > 120) errors.industry = 'Keep this to 120 characters or fewer.';
  if (selectedFeatures.length > 1200 || selectedFeatures.split('\n').filter(Boolean).some(item => !features.some(([label]) => label === item))) errors.features = 'Choose features from the list.';
  if (plannerBrief.length > 6500) errors.plannerBrief = 'Keep the planner brief to 6,500 characters or fewer.';
  if (!name || name.length > 100) errors.name = 'Add your name (up to 100 characters).';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address, such as name@business.com.';
  if (!contactProjectTypes.includes(projectType)) errors.projectType = 'Choose a project type, or select “Not sure yet”.';
  if (businessName.length > 120) errors.businessName = 'Keep this to 120 characters or fewer.';
  if (budget.length > 120) errors.budget = 'Keep this to 120 characters or fewer.';
  if (timeline.length > 150) errors.timeline = 'Keep this to 150 characters or fewer.';
  if (description.length < 20) errors.description = 'Describe your idea in at least 20 characters so there is enough context to begin.';
  if (description.length > 3000) errors.description = 'Keep the description to 3,000 characters or fewer.';
  return { errors, brief: Object.keys(errors).length ? '' : `Project enquiry for OVIO\n\nName: ${name}\nEmail: ${email}${businessName ? `\nBusiness or project: ${businessName}` : ''}\nProject: ${projectType}\nWorking budget: ${budget || 'To discuss'}\nDesired timeline: ${timeline || 'Flexible / to discuss'}\n${industry ? `Industry: ${industry}\n` : ''}${goal ? `Primary goal: ${goal}\n` : ''}\nFeatures for discussion:\n${selectedFeatures || 'To discuss'}\n\nProject description\n${description}${plannerBrief ? `\n\nReviewed planner brief\n${plannerBrief}` : ''}` };
}
