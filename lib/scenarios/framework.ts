import type { FrameworkContribution } from './types';

/** Reads authored contribution data without coupling Standard mode to scenarios. */
export function frameworkContributionForInitiative(initiative: any): FrameworkContribution | undefined {
  const contribution = initiative?.scenarioMetadata?.frameworkContribution ?? initiative?.frameworkContribution;
  if (!contribution) return undefined;
  return {
    peopleChange: Number(contribution.peopleChange || 0),
    processWorkflow: Number(contribution.processWorkflow || 0),
    techData: Number(contribution.techData || 0),
    algorithmModel: Number(contribution.algorithmModel || 0),
  };
}

export function averageFrameworkContribution(initiatives: any[]): FrameworkContribution | undefined {
  const contributions = initiatives.map(frameworkContributionForInitiative).filter(Boolean) as FrameworkContribution[];
  if (!contributions.length) return undefined;
  return {
    peopleChange: contributions.reduce((sum, item) => sum + item.peopleChange, 0) / contributions.length,
    processWorkflow: contributions.reduce((sum, item) => sum + item.processWorkflow, 0) / contributions.length,
    techData: contributions.reduce((sum, item) => sum + item.techData, 0) / contributions.length,
    algorithmModel: contributions.reduce((sum, item) => sum + item.algorithmModel, 0) / contributions.length,
  };
}
