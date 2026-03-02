import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/lib/api/auth';

// Re-export User type so consumers don't break immediately if they imported it from here
export type { User };

export function useUser() {
    const { user, isLoading } = useAuth();

    return { user, isLoading };
}
