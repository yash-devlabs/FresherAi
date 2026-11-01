import { useLocation, useNavigate } from 'react-router-dom';

export function usePathname() {
  return useLocation().pathname;
}

// Small navigation helper used by authentication and dashboard components.
export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  return {
    push: (path) => navigate(path),
    replace: (path) => navigate(path, { replace: true }),
    refresh: () => window.location.reload(),
    back: () => navigate(-1),
    pathname: location.pathname,
  };
}
