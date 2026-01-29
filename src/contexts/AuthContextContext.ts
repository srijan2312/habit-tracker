import { createContext } from 'react';

export interface User {
	_id: string;
	email: string;
	name?: string;
}

export interface AuthContextType {
	user: User | null;
	loading: boolean;
	signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
	signIn: (email: string, password: string) => Promise<{ error: string | null }>;
	signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);