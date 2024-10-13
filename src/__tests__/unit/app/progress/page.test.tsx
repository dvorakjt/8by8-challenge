import { render, cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockDialogMethods } from '@/utils/test/mock-dialog-methods';
import Progress from '@/app/progress/page';
import { UserType } from '@/model/enums/user-type';
import { UserContext, UserContextType } from '@/contexts/user-context';
import type { User } from '@/model/types/user';
import { DateTime } from 'luxon';
import { Actions } from '@/model/enums/actions';

jest.mock('next/navigation', () => require('next-router-mock'));

describe('ProgressTest', () => {
  let appUser: User;

  mockDialogMethods();

  beforeEach(() => {
    appUser = {
      uid: '456',
      email: 'challenger2@example.com',
      name: 'Challenger2',
      avatar: '2',
      type: UserType.Challenger,
      completedActions: {
        sharedChallenge: true,
        electionReminders: false,
        registerToVote: false,
      },
      badges: [
        { action: Actions.SharedChallenge },
        { playerName: 'Player', playerAvatar: '1' },
      ],
      challengeEndTimestamp: DateTime.now().toUnixInteger(),
      completedChallenge: false,
      contributedTo: [],
      inviteCode: '',
    };
  });

  afterEach(cleanup);

  it('renders the days left in the challenge.', () => {
    for (let i = 8; i >= 0; i--) {
      appUser.challengeEndTimestamp = DateTime.now()
        .plus({ days: i })
        .toUnixInteger();

      render(
        <UserContext.Provider value={{ user: appUser } as UserContextType}>
          <Progress />
        </UserContext.Provider>,
      );

      const daysLeft = document.getElementsByClassName('days_label')[0];
      expect(daysLeft.children[0].textContent).toBe(`${i}`);
      expect(daysLeft.children[1].textContent).toBe(
        i === 1 ? 'Day left' : 'Days left',
      );

      cleanup();
    }
  });

  it('renders user when all badges are completed.', () => {
    for (let i = 2; i < 8; i++) {
      appUser.badges[i] = { playerName: `test${i}`, playerAvatar: '1' };
    }

    appUser.completedChallenge = true;

    render(
      <UserContext.Provider value={{ user: appUser } as UserContextType}>
        <Progress />
      </UserContext.Provider>,
    );

    expect(screen.getByText(/You completed all/i)).toBeInTheDocument();
  });
});
