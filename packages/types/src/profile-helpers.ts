import type { UpdateUserProfilePayload, VerificationProfile } from './dto';

export const POSITION_CHOICES = ['none', 'top', 'vers', 'bottom', 'side', 'hidden'] as const;
export type PositionChoice = (typeof POSITION_CHOICES)[number];

export const detectPositionChoice = (profile?: VerificationProfile | null): PositionChoice => {
  if (!profile) {
    return 'none';
  }
  if (profile.topPosition) return 'top';
  if (profile.versPosition) return 'vers';
  if (profile.bottomPosition) return 'bottom';
  if (profile.sidePreference) return 'side';
  if (profile.hidePosition) return 'hidden';
  return 'none';
};

export const applyPositionChoice = <T extends UpdateUserProfilePayload>(choice: PositionChoice, profile: T): T => {
  const next: UpdateUserProfilePayload = {
    ...profile,
    topPosition: undefined,
    versPosition: undefined,
    bottomPosition: undefined,
    sidePreference: undefined,
    hidePosition: false
  };

  if (choice === 'top') {
    next.topPosition = 'Top';
  } else if (choice === 'vers') {
    next.versPosition = 'Vers';
  } else if (choice === 'bottom') {
    next.bottomPosition = 'Bottom';
  } else if (choice === 'side') {
    next.sidePreference = 'Side';
  } else if (choice === 'hidden') {
    next.hidePosition = true;
  }

  return next as T;
};
