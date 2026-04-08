import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  
  return { 
    user: context.user, 
    loading: context.loading, 
    login: context.login, 
    logout: context.logout,
    updateUser: context.updateUser, 
    isLoggedIn: context.isLoggedIn,
    role: context.role
  };
}
