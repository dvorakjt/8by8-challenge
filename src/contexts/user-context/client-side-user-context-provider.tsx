'use client';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_ENVIRONMENT_VARIABLES } from '@/constants/public-environment-variables';
import {
  SendOTPToEmailParams,
  SignUpWithEmailParams,
  SignInWithOTPParams,
  UserContext,
} from './user-context';
import { clearInviteCode } from './clear-invite-code-cookie';
import { clearAllPersistentFormElements, ValueOf } from 'fully-formed';
import { VoterRegistrationForm } from '@/app/register/voter-registration-form';
import { UserType } from '@/model/enums/user-type';
import type { User } from '@/model/types/user';
import type { ChallengerData } from '@/model/types/challenger-data';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Props that can be passed from a server component into a
 * {@link ClientSideUserContextProvider} in order to pre-render child components
 * with the user's information pre-populated.
 */
interface ClientSideUserContextProviderProps {
  user: User | null;
  emailForSignIn: string;
  invitedBy: ChallengerData | null;
  children?: ReactNode;
}

/**
 * Receives a {@link User} and an email address to use for signing in from a
 * server component and provides these as React state variables to child
 * components. Provides methods for signing in, signing out, and more.
 *
 * @param props - {@link ClientSideUserContextProviderProps}
 * @returns A {@link UserContext} provider.
 */
export function ClientSideUserContextProvider(
  props: ClientSideUserContextProviderProps,
) {
  const [user, setUser] = useState<User | null>(props.user);
  const [emailForSignIn, setEmailForSignIn] = useState(props.emailForSignIn);
  const [invitedBy, setInvitedBy] = useState<ChallengerData | null>(
    props.invitedBy,
  );
  const supabaseSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const router = useRouter();

  useEffect(() => {
    const refreshUser = async () => {
      const response = await fetch('/api/refresh-user', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.user.uid === user?.uid) {
          setUser(data.user as User);
        }
      }
    };

    const subscribeToBadges = (userId: string) => {
      const supabase = createBrowserClient(
        PUBLIC_ENVIRONMENT_VARIABLES.NEXT_PUBLIC_SUPABASE_URL,
        PUBLIC_ENVIRONMENT_VARIABLES.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );

      supabaseSubscriptionRef.current = supabase
        .channel('badges')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'badges',
            filter: `challenger_id=eq.${userId}`,
          },
          async payload => {
            const newBadge = payload.new;

            /* 
              Only refresh the user if the badge was awarded due to the actions of 
              another user. If the user earned the badge themselves, the
              user object will already have been updated.
            */
            if (newBadge['player_name'] && newBadge['player_avatar']) {
              await refreshUser();
            }
          },
        )
        .subscribe();
    };

    supabaseSubscriptionRef.current?.unsubscribe();

    if (user) {
      clearInviteCode();
      subscribeToBadges(user.uid);
    }

    return () => {
      supabaseSubscriptionRef.current?.unsubscribe();
    };
  }, [user]);

  async function signUpWithEmail(params: SignUpWithEmailParams) {
    const response = await fetch('/api/signup-with-email', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 429 ?
          'Too many requests. Please try again later.'
        : 'Oops! Something went wrong.',
      );
    }

    setEmailForSignIn(params.email);
    router.push('/signin-with-otp');
  }

  async function sendOTPToEmail(params: SendOTPToEmailParams) {
    const response = await fetch('/api/send-otp-to-email', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 429 ?
          'Too many requests. Please try again later.'
        : 'Oops! Something went wrong.',
      );
    }

    setEmailForSignIn(params.email);
    router.push('/signin-with-otp');
  }

  async function resendOTP() {
    const response = await fetch('/api/resend-otp-to-email', {
      method: 'POST',
      body: JSON.stringify({ email: emailForSignIn }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 429 ?
          'Too many requests. Please try again later.'
        : 'Oops! Something went wrong.',
      );
    }
  }

  async function signInWithOTP({ otp }: SignInWithOTPParams) {
    const response = await fetch('/api/signin-with-otp', {
      method: 'POST',
      body: JSON.stringify({ email: emailForSignIn, otp }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 429 ?
          'Too many requests. Please try again later.'
        : 'Oops! Something went wrong.',
      );
    }

    const data = await response.json();
    setUser(data.user as User);
    setInvitedBy(data.invitedBy as ChallengerData);
  }

  async function signOut() {
    const response = await fetch('/api/signout', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('There was a problem signing out.');
    }

    setUser(null);
    setInvitedBy(null);
    clearAllPersistentFormElements();
  }

  async function gotElectionReminders() {
    if (!user || user.completedActions.electionReminders) return;

    const response = await fetch('/api/award-election-reminders-badge', {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to award election reminders badge.');
    }

    const data = await response.json();

    if (data.user.uid === user?.uid) {
      setUser(data.user as User);
    }
  }

  async function shareChallenge() {
    if (!user || user.completedActions.sharedChallenge) return;

    const response = await fetch('/api/share-challenge', {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to award a badge.');
    }

    const data = await response.json();

    if (data.user.uid === user?.uid) {
      setUser(data.user as User);
    }
  }

  async function registerToVote(
    formData: ValueOf<InstanceType<typeof VoterRegistrationForm>>,
  ): Promise<void> {
    if (!user || user.completedActions.registerToVote) return;

    const response = await fetch('/api/register-to-vote', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('There was a problem registering to vote.');
    }

    const data = await response.json();

    if (data.user.uid === user?.uid) {
      setUser(data.user as User);
    }
  }

  async function takeTheChallenge() {
    if (
      !user ||
      user.type === UserType.Challenger ||
      user.type === UserType.Hybrid
    ) {
      return;
    }

    const response = await fetch('/api/take-the-challenge', {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('There was a problem taking the challenge.');
    }

    const data = await response.json();

    if (data.user.uid === user?.uid) {
      setUser(data.user as User);
    }
  }

  async function restartChallenge() {
    if (!user) return;

    const response = await fetch('/api/restart-challenge', {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new Error('Failed to restart the challenge.');
    }

    const data = await response.json();

    if (data.user.uid === user?.uid) {
      setUser(data.user as User);
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        emailForSignIn,
        invitedBy,
        signUpWithEmail,
        sendOTPToEmail,
        resendOTP,
        signInWithOTP,
        gotElectionReminders,
        signOut,
        restartChallenge,
        shareChallenge,

        registerToVote,
        takeTheChallenge,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
