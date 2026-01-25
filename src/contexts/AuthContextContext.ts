import { createContext } from 'react';

export interface User {
	_id: string;
	email: string;
}

export interface AuthContextType {
	user: User | null;
	loading: boolean;
	signUp: (email: string, password: string) => Promise<{ error: string | null }>;
	signIn: (email: string, password: string) => Promise<{ error: string | null }>;
	signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);